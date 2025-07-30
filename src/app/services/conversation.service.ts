import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { Observable, tap, take } from 'rxjs';
import { Conversation } from '../models/conversation.model';
import { ApiResponse } from '../models/api-response.model';
import { Message } from '../models/message.model';
import { WebSocketService } from './websocket.service';
import { UserService } from './user-service';
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
  private static readonly TYPING_TIMEOUT_MS = 3000;
  private static readonly MARK_AS_READ_DELAY_MS = 500;

  private http = inject(HttpClient);
  private wsService = inject(WebSocketService);
  private userService = inject(UserService);
  private apiUrl = 'http://localhost:3000/api';
  
  conversations = signal<Conversation[]>([]);
  selectedConversationId = signal<string | null>(null);
  previousConversationId = signal<string | null>(null);

  selectedConversation = computed(() => this.conversations().find(c => c._id === this.selectedConversationId()) || null);

  messages = signal<Message[]>([]);
  
  private typingUsers = signal<Map<string, Map<string, boolean>>>(new Map());
  
  typingInConversation = computed(() => {
    const conversationId = this.selectedConversationId();
    if (!conversationId) return [];
    
    const conversationTyping = this.typingUsers().get(conversationId);
    if (!conversationTyping) return [];
    
    return Array.from(conversationTyping.entries())
      .filter(([userId, isTyping]) => isTyping)
      .map(([userId]) => userId);
  });

  totalUnreadCount = computed(() => {
    return this.conversations().reduce((total, conversation) => total + conversation.unReadCount, 0);
  });

  unreadConversationsCount = computed(() => {
    return this.conversations().filter(conversation => conversation.unReadCount > 0).length;
  });

  constructor() {
    effect(() => {
      const connected = this.wsService.connectedStatus();
      if (connected) {
        untracked(() => {
          this.autoJoinConversations();
        })
      }
    });

    effect(() => {
      const message = this.wsService.messageReceive();
      if (message) {
        untracked(() => this.handleRealtimeMessage(message));
      }
    });

    effect(() => {
      const typingStart = this.wsService.typingStart();
      if (typingStart) {
        untracked(() => this.handleTypingStart(typingStart.conversationId, typingStart.userId));
      }
    });

    effect(() => {
      const typingStop = this.wsService.typingStop();
      if (typingStop) {
        untracked(() => this.handleTypingStop(typingStop.conversationId, typingStop.userId));
      }
    });

    effect(() => {
      const userOnline = this.wsService.userOnline();
      if (userOnline) {
        untracked(() => this.updateUserStatusInConversations(userOnline.userId, 'online'));
      }
    });

    effect(() => {
      const userOffline = this.wsService.userOffline();
      if (userOffline) {
        untracked(() => this.updateUserStatusInConversations(userOffline.userId, 'offline'));
      }
    });

    effect(() => {
      const messagesRead = this.wsService.messagesRead();
      if (messagesRead) {
        untracked(() => this.handleMessagesRead(messagesRead.conversationId, messagesRead.userId));
      }
    });

    effect(() => {
      const statusUpdate = this.wsService.userStatusUpdate();
      if (statusUpdate) {
        untracked(() => this.updateUserStatusInConversations(statusUpdate.userId, statusUpdate.status));
      }
    });

    effect(() => {
      if (this.selectedConversationId()) {
        untracked(() => this.handleConversationChange(this.selectedConversationId()))
      }
    });
  }

  getConversations(): Observable<ApiResponse<Conversation[]>> {
    return this.http.get<ApiResponse<Conversation[]>>(`${this.apiUrl}/conversations`).pipe(
      tap((response) => {
        if (response.data) {
          this.conversations.set(response.data);
        }
      })
    );
  }

  getConversation(conversationId: string): Observable<ApiResponse<Conversation>> {
    return this.http.get<ApiResponse<Conversation>>(`${this.apiUrl}/conversations/${conversationId}`).pipe(
      tap((response) => {
        if (response.data) {
          this.selectedConversationId.set(response.data._id);
        }
      })
    );
  }

  createConversation(request: CreateConversationRequest): Observable<ApiResponse<Conversation>> {
    return this.http.post<ApiResponse<Conversation>>(`${this.apiUrl}/conversations`, request).pipe(
      tap((response) => {
        if (response.data) {
          const currentConversations = this.conversations();
          this.conversations.set([response.data, ...currentConversations]);
          this.wsService.joinConversation(response.data._id);
        }
      })
    );
  }

  createDirectConversation(userId: string): Observable<ApiResponse<Conversation>> {
    const request: CreateConversationRequest = {
      participantIds: [userId],
      isGroup: false
    };
    
    return this.createConversation(request).pipe(
      tap((response) => {
        if (response.data) {
          this.selectedConversationId.set(response.data._id);
        }
      })
    );
  }

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

  sendMessage(request: SendMessageRequest): Observable<ApiResponse<Message>> {
    return this.http.post<ApiResponse<Message>>(`${this.apiUrl}/messages`, request).pipe(
      tap((response) => {
        if (response.data) {
          this.messages.update((messages) => [...messages, response.data!]);

          this.updateConversationLastMessage(request.conversationId, response.data);
        }
      })
    );
  }

  markMessagesAsRead(conversationId: string, messageIds: string[]): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.apiUrl}/conversations/${conversationId}/messages/read`, {
      messageIds
    }).pipe(
      tap((response) => {
        if (response.success) {
          this.updateConversationUnreadCount(conversationId, 0);
        }
      })
    );
  }

  deleteConversation(conversationId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/conversations/${conversationId}`).pipe(
      tap((response) => {
        if (response.success) {
          const currentConversations = this.conversations();
          this.conversations.set(currentConversations.filter(c => c._id !== conversationId));
          
          if (this.selectedConversationId() === conversationId) {
            this.selectedConversationId.set(null);
            this.messages.set([]);
          }
        }
      })
    );
  }

  searchConversations(query: string): Observable<ApiResponse<Conversation[]>> {
    const params = { q: query };
    return this.http.get<ApiResponse<Conversation[]>>(`${this.apiUrl}/conversations/search`, { params });
  }

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

  removeParticipant(conversationId: string, userId: string): Observable<ApiResponse<Conversation>> {
    return this.http.delete<ApiResponse<Conversation>>(`${this.apiUrl}/conversations/${conversationId}/participants/${userId}`).pipe(
      tap((response) => {
        if (response.data) {
          this.updateConversationInList(response.data);
        }
      })
    );
  }

  updateConversation(conversationId: string, updates: Partial<Conversation>): Observable<ApiResponse<Conversation>> {
    return this.http.patch<ApiResponse<Conversation>>(`${this.apiUrl}/conversations/${conversationId}`, updates).pipe(
      tap((response) => {
        if (response.data) {
          this.updateConversationInList(response.data);
        }
      })
    );
  }

  handleConversationChange(conversationId: string | null): void {
    if (this.previousConversationId()) {
      this.wsService.leaveConversation(this.previousConversationId()!);
    }

    if (conversationId) {
      this.wsService.joinConversation(conversationId);
      this.getMessages(conversationId).pipe(take(1)).subscribe();
      
      const conversation = this.conversations().find(c => c._id === conversationId);
      if (conversation && conversation.unReadCount > 0) {
        this.markConversationAsRead(conversationId);
      }
    } else {
      this.messages.set([]);
    }
  }

  disconnect(): void {
    this.conversations.set([]);
    this.selectedConversationId.set(null);
    this.previousConversationId.set(null);
    this.messages.set([]);
    this.wsService.clearData();
    this.wsService.disconnect();
  }

  startTyping(conversationId: string): void {
    this.wsService.startTyping({
      conversationId,
      username: this.userService.user()?.username!
    });
  }

  stopTyping(conversationId: string): void {
    this.wsService.stopTyping({
      conversationId
    });
  }

  isAnyoneTyping(conversationId: string): boolean {
    const conversationTyping = this.typingUsers().get(conversationId);
    if (!conversationTyping) return false;
    
    return Array.from(conversationTyping.values()).some(isTyping => isTyping === true);
  }

  getTypingUsers(conversationId: string): string[] {
    const conversationTyping = this.typingUsers().get(conversationId);
    if (!conversationTyping) return [];
    
    return Array.from(conversationTyping.entries())
      .filter(([userId, isTyping]) => isTyping)
      .map(([userId]) => userId);
  }

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

  private handleTypingStart(conversationId: string, userId: string): void {
    this.typingUsers.update(typingMap => {
      const newTypingMap = new Map(typingMap);
      
      if (!newTypingMap.has(conversationId)) {
        newTypingMap.set(conversationId, new Map());
      }
      
      const conversationTyping = newTypingMap.get(conversationId)!;
      conversationTyping.set(userId, true);
      
      return newTypingMap;
    });
    
    setTimeout(() => {
      this.handleTypingStop(conversationId, userId);
    }, ConversationService.TYPING_TIMEOUT_MS);
  }

  private handleTypingStop(conversationId: string, userId: string): void {
    this.typingUsers.update(typingMap => {
      const newTypingMap = new Map(typingMap);
      const conversationTyping = newTypingMap.get(conversationId);
      
      if (conversationTyping) {
        conversationTyping.set(userId, false);
      }
      
      return newTypingMap;
    });
  }

  private handleRealtimeMessage(message: MessageReceiveData): void {
    const currentMessages = this.messages();
    const currentUserId = this.userService.user()?._id;

    const messageExists = currentMessages.find(m => m._id === message._id);
    if (!messageExists) {
      if (this.selectedConversationId() === message.conversationId) {
        this.messages.set([...currentMessages, message]);
      }

      this.updateConversationLastMessage(message.conversationId, message);

      if (message.senderId !== currentUserId && this.selectedConversationId() !== message.conversationId) {
        this.incrementUnreadCount(message.conversationId);
      }
    }
  }

  private updateUserStatusInConversations(userId: string, status: 'online' | 'offline'): void {
    this.conversations.update(conversations => 
      conversations.map(conversation => {
        if (!conversation.isGroup && conversation.otherParticipant?._id === userId) {
          return {
            ...conversation,
            otherParticipant: {
              ...conversation.otherParticipant,
              status,
              lastSeen: new Date()
            }
          };
        }
        
        if (conversation.isGroup && conversation.participants) {
          const updatedParticipants = conversation.participants.map(participant => 
            participant._id === userId 
              ? { ...participant, status }
              : participant
          );
          
          return {
            ...conversation,
            participants: updatedParticipants
          };
        }
        
        return conversation;
      })
    );
  }

  private updateConversationInMemory(conversationId: string, updates: Partial<Conversation>): void {
    this.conversations.update(conversations => 
      conversations.map(conversation => 
        conversation._id === conversationId 
          ? { ...conversation, ...updates }
          : conversation
      )
    );
  }

  private updateConversationLastMessage(conversationId: string, message: Message): void {
    this.updateConversationInMemory(conversationId, {
      lastMessage: { ...message },
      updatedAt: message.timestamp
    });
  }

  private updateConversationUnreadCount(conversationId: string, unReadCount: number): void {
    this.updateConversationInMemory(conversationId, { unReadCount });
  }

  private updateConversationInList(updatedConversation: Conversation): void {
    this.conversations.update(conversations => 
      conversations.map(conversation => 
        conversation._id === updatedConversation._id 
          ? updatedConversation 
          : conversation
      )
    );
  }

  private handleMessagesRead(conversationId: string, userId: string): void {
    const currentUserId = this.userService.user()?._id;
    if (userId === currentUserId) {
      this.updateConversationUnreadCount(conversationId, 0);
    }
  }

  private incrementUnreadCount(conversationId: string): void {
    const currentConversations = this.conversations();
    const conversation = currentConversations.find(c => c._id === conversationId);
    if (conversation) {
      this.updateConversationUnreadCount(conversationId, conversation.unReadCount + 1);
    }
  }

    // Add this method
  private autoJoinConversations(): void {
    // Join all user conversations for message reception
    this.conversations().forEach(conversation => {
      if (conversation._id) {
        console.log(`Joining conversation: ${conversation._id}`);
        this.wsService.joinConversation(conversation._id);
      }
    });
  }

  markConversationAsRead(conversationId: string): void {
    this.wsService.markMessagesAsRead({ conversationId });
    this.updateConversationUnreadCount(conversationId, 0);
  }
}
