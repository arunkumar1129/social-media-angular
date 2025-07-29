import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { Observable, tap, BehaviorSubject, take, takeUntil, Subject } from 'rxjs';
import { Conversation } from '../models/conversation.model';
import { ApiResponse } from '../models/api-response.model';
import { Message, MessageSentEvent } from '../models/message.model';
import { WebSocketService } from './websocket.service';
import { UserService } from './user-service';
import { MessageReceiveData } from '../models/websocket.model';
import { TimeUtilsService } from './time-utils.service';

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
  private userService = inject(UserService);
  private apiUrl = 'http://localhost:3000/api';
  private destroy$ = new Subject<void>();
  
  // Signals for reactive state management
  conversations = signal<Conversation[]>([]);
  selectedConversationId = signal<string | null>(null);
  previousConversationId = signal<string | null>(null);

  selectedConversation = computed(() => this.conversations().find(c => c._id === this.selectedConversationId()) || null);

  messages = signal<Message[]>([]);
  
  // Typing indicators - Map of conversationId -> Map of userId -> isTyping
  private typingUsers = signal<Map<string, Map<string, boolean>>>(new Map());
  
  // Public computed for typing status
  typingInConversation = computed(() => {
    const conversationId = this.selectedConversationId();
    if (!conversationId) return [];
    
    const conversationTyping = this.typingUsers().get(conversationId);
    if (!conversationTyping) return [];
    
    return Array.from(conversationTyping.entries())
      .filter(([userId, isTyping]) => isTyping)
      .map(([userId]) => userId);
  });

  // Computed signal for total unread count across all conversations
  totalUnreadCount = computed(() => {
    return this.conversations().reduce((total, conversation) => total + conversation.unReadCount, 0);
  });

  // Computed signal for unread conversations count
  unreadConversationsCount = computed(() => {
    return this.conversations().filter(conversation => conversation.unReadCount > 0).length;
  });

  constructor() {
    // Subscribe to real-time messages from WebSocket
    this.wsService.message$.subscribe(message => {
      if (message) {
        this.handleRealtimeMessage(message);
      }
    });

    // Subscribe to typing events
    this.wsService.typingStart$
      .pipe(takeUntil(this.destroy$))
      .subscribe(typingStart => {
        if (typingStart) {
          this.handleTypingStart(typingStart.conversationId, typingStart.userId);
        }
      });

    this.wsService.typingStop$
      .pipe(takeUntil(this.destroy$))
      .subscribe(typingStop => {
        if (typingStop) {
          this.handleTypingStop(typingStop.conversationId, typingStop.userId);
        }
      });

    // Subscribe to user status updates from WebSocket
    this.wsService.userOnline$
      .pipe(takeUntil(this.destroy$))
      .subscribe(userOnline => {
        if (userOnline) {
          this.updateUserStatusInConversations(userOnline.userId, 'online');
        }
      });

    this.wsService.userOffline$
      .pipe(takeUntil(this.destroy$))
      .subscribe(userOffline => {
        if (userOffline) {
          this.updateUserStatusInConversations(userOffline.userId, 'offline');
        }
      });

    // Subscribe to message read events from WebSocket
    this.wsService.messagesRead$
      .pipe(takeUntil(this.destroy$))
      .subscribe(messagesRead => {
        if (messagesRead) {
          this.handleMessagesRead(messagesRead.conversationId, messagesRead.userId);
        }
      });

    this.wsService.userStatusUpdate$
      .pipe(takeUntil(this.destroy$))
      .subscribe(statusUpdate => {
        if (statusUpdate) {
          this.updateUserStatusInConversations(statusUpdate.userId, statusUpdate.status);
        }
      });

    // Subscribe to legacy user status for backward compatibility
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
   * Create a direct conversation with a user
   */
  createDirectConversation(userId: string): Observable<ApiResponse<Conversation>> {
    const request: CreateConversationRequest = {
      participantIds: [userId],
      isGroup: false
    };
    
    return this.createConversation(request).pipe(
      tap((response) => {
        if (response.data) {
          // Select the newly created conversation
          this.selectedConversationId.set(response.data._id);
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
      
      // Mark messages as read when conversation is selected
      const conversation = this.conversations().find(c => c._id === conversationId);
      if (conversation && conversation.unReadCount > 0) {
        this.markConversationAsRead(conversationId);
      }
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

  // ============ Typing Methods ============

  /**
   * Start typing indicator for current user
   */
  startTyping(conversationId: string): void {
    this.wsService.startTyping({
      conversationId,
      username: 'Current User' // This could be enhanced to use actual username
    });
  }

  /**
   * Stop typing indicator for current user
   */
  stopTyping(conversationId: string): void {
    this.wsService.stopTyping({
      conversationId
    });
  }

  /**
   * Check if any users are typing in a conversation
   */
  isAnyoneTyping(conversationId: string): boolean {
    const conversationTyping = this.typingUsers().get(conversationId);
    if (!conversationTyping) return false;
    
    return Array.from(conversationTyping.values()).some(isTyping => isTyping === true);
  }

  /**
   * Get list of users typing in a conversation
   */
  getTypingUsers(conversationId: string): string[] {
    const conversationTyping = this.typingUsers().get(conversationId);
    if (!conversationTyping) return [];
    
    return Array.from(conversationTyping.entries())
      .filter(([userId, isTyping]) => isTyping)
      .map(([userId]) => userId);
  }

  /**
   * Get typing text for display
   */
  getTypingText(conversationId: string): string {
    const typingUsers = this.getTypingUsers(conversationId);

    if (!this.selectedConversation()?.isGroup) {
      return `${this.selectedConversation()?.otherParticipant?.displayName} is typing...`;
    }
    
    if (typingUsers.length === 0) {
      return '';
    } else if (typingUsers.length === 1) {
      return 'Someone is typing...';
    } else if (typingUsers.length === 2) {
      return '2 people are typing...';
    } else {
      return `${typingUsers.length} people are typing...`;
    }
  }

  /**
   * Handle typing start event
   */
  private handleTypingStart(conversationId: string, userId: string): void {
    const currentTyping = this.typingUsers();
    const newTyping = new Map(currentTyping);
    
    if (!newTyping.has(conversationId)) {
      newTyping.set(conversationId, new Map());
    }
    
    const conversationTyping = newTyping.get(conversationId)!;
    conversationTyping.set(userId, true);
    
    this.typingUsers.set(newTyping);
    
    // Auto-clear typing indicator after 3 seconds
    setTimeout(() => {
      this.handleTypingStop(conversationId, userId);
    }, 3000);
  }

  /**
   * Handle typing stop event
   */
  private handleTypingStop(conversationId: string, userId: string): void {
    const currentTyping = this.typingUsers();
    const newTyping = new Map(currentTyping);
    
    const conversationTyping = newTyping.get(conversationId);
    if (conversationTyping) {
      conversationTyping.set(userId, false);
      this.typingUsers.set(newTyping);
    }
  }

  // Private helper methods
  private handleRealtimeMessage(message: MessageReceiveData): void {
    const currentMessages = this.messages();
    const currentUserId = this.userService.user()?._id;

    // Check if message already exists (avoid duplicates)
    const messageExists = currentMessages.find(m => m._id === message._id);
    if (!messageExists) {
      // Only add to current conversation messages if this is the selected conversation
      if (this.selectedConversationId() === message.conversationId) {
        this.messages.set([...currentMessages, message]);
      }

      // Always update conversation's last message and unread count
      this.updateConversationLastMessage(message.conversationId, message);

      // Increment unread count if message is not from current user and conversation is not selected
      if (message.senderId !== currentUserId && this.selectedConversationId() !== message.conversationId) {
        this.incrementUnreadCount(message.conversationId);
      }
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

  /**
   * Update user status in conversations (enhanced version)
   */
  private updateUserStatusInConversations(userId: string, status: 'online' | 'offline'): void {
    // Update the conversation list to trigger UI updates
    const currentConversations = this.conversations();
    const updatedConversations = currentConversations.map(conversation => {
      // Update direct message conversations
      if (!conversation.isGroup && conversation.otherParticipant?._id === userId) {
        return {
          ...conversation,
          otherParticipant: {
            ...conversation.otherParticipant,
            status
          }
        };
      }
      
      // Update group conversations - update participant status
      if (conversation.isGroup && conversation.participants) {
        const updatedParticipants = conversation.participants.map(participant => {
          if (participant._id === userId) {
            return {
              ...participant,
              status
            };
          }
          return participant;
        });
        
        return {
          ...conversation,
          participants: updatedParticipants
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

  private updateConversationUnreadCount(conversationId: string, unReadCount: number): void {
    const currentConversations = this.conversations();
    const updatedConversations = currentConversations.map(conversation => {
      if (conversation._id === conversationId) {
        return {
          ...conversation,
          unReadCount
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

  /**
   * Handle messages read event from WebSocket
   */
  private handleMessagesRead(conversationId: string, userId: string): void {
    // If it's the current user marking messages as read, we can clear the unread count
    const currentUserId = this.userService.user()?._id;
    if (userId === currentUserId) {
      this.updateConversationUnreadCount(conversationId, 0);
    }
  }

  /**
   * Increment unread count for a conversation
   */
  private incrementUnreadCount(conversationId: string): void {
    const currentConversations = this.conversations();
    const conversation = currentConversations.find(c => c._id === conversationId);
    if (conversation) {
      this.updateConversationUnreadCount(conversationId, conversation.unReadCount + 1);
    }
  }

  /**
   * Mark messages as read for a conversation
   */
  markConversationAsRead(conversationId: string): void {
    this.wsService.markMessagesAsRead({ conversationId });
    this.updateConversationUnreadCount(conversationId, 0);
  }

  /**
   * Cleanup method for service destruction
   */
  destroy(): void {
    // Clear typing indicators
    this.typingUsers.set(new Map());
    
    this.destroy$.next();
    this.destroy$.complete();
  }
}
