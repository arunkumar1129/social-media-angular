import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { Observable, tap, BehaviorSubject, take } from 'rxjs';
import { Conversation } from '../models/conversation.model';
import { ApiResponse } from '../models/api-response.model';
import { Message, MessageSentEvent } from '../models/message.model';
import { WebSocketService } from './websocket.service';
import { MessageReceiveData } from '../models/websocket.model';

export interface CreateConversationRequest {
  participantIds: string[];
  isGroup?: boolean;
  groupName?: string;
  groupAvatar?: string;
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConversationService {
  private http = inject(HttpClient);
  private wsService = inject(WebSocketService);
  private apiUrl = 'http://localhost:3000/api';
  
  // Signals for reactive state management
  conversations = signal<Conversation[]>([]);
  selectedConversationId = signal<string | null>(null);
  previousConversationId = signal<string | null>(null);

  selectedConversation = computed(() => this.conversations().find(c => c._id === this.selectedConversationId()) || null);

  messages = signal<Message[]>([]);

  constructor() {
    // Subscribe to real-time messages from WebSocket
    this.wsService.message$.subscribe(message => {
      if (message) {
        this.handleRealtimeMessage(message);
      }
    });

    // Subscribe to user status updates
    this.wsService.userStatus$.subscribe(statusEvent => {
      if (statusEvent) {
        this.updateUserStatus(statusEvent.userId, statusEvent.status);
      }
    });

    effect(() => {
      if (this.selectedConversationId()) {
        untracked(() => this.handleConversationChange(this.selectedConversationId()))
      }
    });
  }

  /**
   * Get all conversations for the current user
   */
  getConversations(): Observable<ApiResponse<Conversation[]>> {
    return this.http.get<ApiResponse<Conversation[]>>(`${this.apiUrl}/conversations`).pipe(
      tap((response) => {
        if (response.data) {
          this.conversations.set(response.data);
        }
      })
    );
  }

  /**
   * Get a specific conversation by ID
   */
  getConversation(conversationId: string): Observable<ApiResponse<Conversation>> {
    return this.http.get<ApiResponse<Conversation>>(`${this.apiUrl}/conversations/${conversationId}`).pipe(
      tap((response) => {
        if (response.data) {
          this.selectedConversationId.set(response.data._id);
        }
      })
    );
  }

  /**
   * Create a new conversation
   */
  createConversation(request: CreateConversationRequest): Observable<ApiResponse<Conversation>> {
    return this.http.post<ApiResponse<Conversation>>(`${this.apiUrl}/conversations`, request).pipe(
      tap((response) => {
        if (response.data) {
          // Add new conversation to the list
          const currentConversations = this.conversations();
          this.conversations.set([response.data, ...currentConversations]);
        }
      })
    );
  }

  /**
   * Get messages for a specific conversation
   */
  getMessages(conversationId: string, page: number = 1, limit: number = 50): Observable<ApiResponse<Message[]>> {
    const params = { page: page.toString(), limit: limit.toString() };
    return this.http.get<ApiResponse<Message[]>>(`${this.apiUrl}/conversations/${conversationId}/messages`, { params }).pipe(
      tap((response) => {
        if (response.data) {
          this.messages.set(response.data);
        }
      })
    );
  }

  /**
   * Send a message to a conversation
   */
  sendMessage(request: SendMessageRequest): Observable<ApiResponse<Message>> {
    return this.http.post<ApiResponse<Message>>(`${this.apiUrl}/messages`, request).pipe(
      tap((response) => {
        if (response.data) {
          // Add new message to current messages
          this.messages.update((messages) => [...messages, response.data!]);

          // Update conversation's last message
          this.updateConversationLastMessage(request.conversationId, response.data);
        }
      })
    );
  }

  /**
   * Mark messages as read
   */
  markMessagesAsRead(conversationId: string, messageIds: string[]): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.apiUrl}/conversations/${conversationId}/messages/read`, {
      messageIds
    }).pipe(
      tap((response) => {
        if (response.success) {
          // Update unread count for the conversation
          this.updateConversationUnreadCount(conversationId, 0);
        }
      })
    );
  }

  /**
   * Delete a conversation
   */
  deleteConversation(conversationId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/conversations/${conversationId}`).pipe(
      tap((response) => {
        if (response.success) {
          // Remove conversation from the list
          const currentConversations = this.conversations();
          this.conversations.set(currentConversations.filter(c => c._id !== conversationId));
          
          // Clear selected conversation if it was deleted
          if (this.selectedConversationId() === conversationId) {
            this.selectedConversationId.set(null);
            this.messages.set([]);
          }
        }
      })
    );
  }

  /**
   * Search conversations
   */
  searchConversations(query: string): Observable<ApiResponse<Conversation[]>> {
    const params = { q: query };
    return this.http.get<ApiResponse<Conversation[]>>(`${this.apiUrl}/conversations/search`, { params });
  }

  /**
   * Add participant to group conversation
   */
  addParticipant(conversationId: string, userId: string): Observable<ApiResponse<Conversation>> {
    return this.http.post<ApiResponse<Conversation>>(`${this.apiUrl}/conversations/${conversationId}/participants`, {
      userId
    }).pipe(
      tap((response) => {
        if (response.data) {
          this.updateConversationInList(response.data);
        }
      })
    );
  }

  /**
   * Remove participant from group conversation
   */
  removeParticipant(conversationId: string, userId: string): Observable<ApiResponse<Conversation>> {
    return this.http.delete<ApiResponse<Conversation>>(`${this.apiUrl}/conversations/${conversationId}/participants/${userId}`).pipe(
      tap((response) => {
        if (response.data) {
          this.updateConversationInList(response.data);
        }
      })
    );
  }

  /**
   * Update conversation details (name, avatar, etc.)
   */
  updateConversation(conversationId: string, updates: Partial<Conversation>): Observable<ApiResponse<Conversation>> {
    return this.http.patch<ApiResponse<Conversation>>(`${this.apiUrl}/conversations/${conversationId}`, updates).pipe(
      tap((response) => {
        if (response.data) {
          this.updateConversationInList(response.data);
        }
      })
    );
  }

  /**
   * Handle conversation change
   */
  handleConversationChange(conversationId: string | null): void {
    // Leave previous conversation room
    if (this.previousConversationId()) {
      this.wsService.leaveConversation(this.previousConversationId()!);
    }

    if (conversationId) {
      // Join new conversation room
      this.wsService.joinConversation(conversationId);
      // Load messages for the selected conversation
      this.getMessages(conversationId).pipe(take(1)).subscribe();
    } else {
      this.messages.set([]);
    }
  }

  /**
   * Clear all data (useful for logout)
   */
  clearData(): void {
    this.conversations.set([]);
    this.selectedConversationId.set(null);
    this.previousConversationId.set(null);
    this.messages.set([]);
    this.wsService.clearData();
  }

  // Private helper methods
  private handleRealtimeMessage(message: MessageReceiveData): void {
    const currentMessages = this.messages();

    // Check if message already exists (avoid duplicates)
    const messageExists = currentMessages.find(m => m._id === message._id);
    if (!messageExists) {
      this.messages.set([...currentMessages, message]);

      // Update conversation's last message if it's for the current conversation
      this.updateConversationLastMessage(message.conversationId, message);
    }
  }

  private updateUserStatus(userId: string, status: 'online' | 'offline'): void {
    const currentConversations = this.conversations();
    const updatedConversations = currentConversations.map(conversation => {
      if (!conversation.isGroup && conversation.otherParticipant?._id === userId) {
        return {
          ...conversation,
          otherParticipant: {
            ...conversation.otherParticipant,
            status
          }
        };
      }
      return conversation;
    });
    this.conversations.set(updatedConversations);
  }

  private updateConversationLastMessage(conversationId: string, message: Message): void {
    const currentConversations = this.conversations();
    const updatedConversations = currentConversations.map(conversation => {
      if (conversation._id === conversationId) {
        return {
          ...conversation,
          lastMessage: {...message},
          lastUpdated: message.timestamp
        };
      }
      return conversation;
    });
    this.conversations.set([...updatedConversations]);
  }

  private updateConversationUnreadCount(conversationId: string, unreadCount: number): void {
    const currentConversations = this.conversations();
    const updatedConversations = currentConversations.map(conversation => {
      if (conversation._id === conversationId) {
        return {
          ...conversation,
          unreadCount
        };
      }
      return conversation;
    });
    this.conversations.set(updatedConversations);
  }

  private updateConversationInList(updatedConversation: Conversation): void {
    const currentConversations = this.conversations();
    const index = currentConversations.findIndex(c => c._id === updatedConversation._id);
    
    if (index !== -1) {
      const updatedConversations = [...currentConversations];
      updatedConversations[index] = updatedConversation;
      this.conversations.set(updatedConversations);
    }
  }
}
