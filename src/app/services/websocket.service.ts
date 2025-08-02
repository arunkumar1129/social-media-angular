import { Injectable, inject, signal, computed, effect, untracked } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Message } from '../models/message.model';
import { Auth } from './auth';
import { environment } from '../../environments/environment';
import { 
  SocketEvents, 
  MessageSendData, 
  MessageReceiveData, 
  MessageErrorData,
  MessageDeleteData,
  MessageDeletedData,
  TypingStartData,
  TypingStopData,
  TypingStartEmitData,
  TypingStopEmitData,
  UserOnlineData,
  UserOfflineData,
  UserStatusUpdateData,
  OnlineUsersListData,
  MessagesMarkReadData,
  MessagesReadData,
  CallInitiateData,
  CallIncomingData,
  CallAnswerData,
  CallAnsweredData,
  CallEndData,
  CallEndedData,
  WebRTCOfferData,
  WebRTCAnswerData,
  WebRTCIceCandidateData,
  WebRTCOfferEmitData,
  WebRTCAnswerEmitData,
  WebRTCIceCandidateEmitData,
  OnlineUser,
  createRoomName,
  RoomTypes,
  TypingEvent,
  UserStatusEvent
} from '../models/websocket.model';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  // Constants
  private static readonly DEFAULT_BASE_URL = environment.wsUrl || 'ws://localhost:3000';
  private static readonly SOCKET_TRANSPORTS = ['websocket', 'polling'];
  private static readonly CONNECTION_CONFIG = {
    upgrade: true,
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    maxReconnectionAttempts: 10,
    timeout: 20000,
    forceNew: false
  };

  // Dependencies
  private auth = inject(Auth);

  // Core Properties
  private socket: Socket | null = null;
  private baseUrl = WebSocketService.DEFAULT_BASE_URL;
  private reconnectTimer: any = null;

  // User Status Tracking
  private onlineUsersMap = new Map<string, OnlineUser>();
  
  // Signal-based State Management
  private _messageReceive = signal<MessageReceiveData | null>(null);
  private _messageDeleted = signal<MessageDeletedData | null>(null);
  private _messageError = signal<MessageErrorData | null>(null);
  
  private _typingStart = signal<TypingStartEmitData | null>(null);
  private _typingStop = signal<TypingStopEmitData | null>(null);
  
  private _userOnline = signal<UserOnlineData | null>(null);
  private _userOffline = signal<UserOfflineData | null>(null);
  private _userStatusUpdate = signal<UserStatusUpdateData | null>(null);
  private _onlineUsersList = signal<OnlineUser[]>([]);
  
  private _messagesRead = signal<MessagesReadData | null>(null);
  
  private _callIncoming = signal<CallIncomingData | null>(null);
  private _callAnswered = signal<CallAnsweredData | null>(null);
  private _callEnded = signal<CallEndedData | null>(null);
  
  private _webrtcOffer = signal<WebRTCOfferEmitData | null>(null);
  private _webrtcAnswer = signal<WebRTCAnswerEmitData | null>(null);
  private _webrtcIceCandidate = signal<WebRTCIceCandidateEmitData | null>(null);
  
  private _connectionStatus = signal<boolean>(false);
  
  // Legacy typing for backward compatibility
  private _legacyTyping = signal<TypingEvent | null>(null);

  // Public Signal Accessors
  readonly messageReceive = this._messageReceive.asReadonly();
  readonly messageDeleted = this._messageDeleted.asReadonly();
  readonly messageError = this._messageError.asReadonly();
  readonly typingStart = this._typingStart.asReadonly();
  readonly typingStop = this._typingStop.asReadonly();
  readonly userOnline = this._userOnline.asReadonly();
  readonly userOffline = this._userOffline.asReadonly();
  readonly userStatusUpdate = this._userStatusUpdate.asReadonly();
  readonly onlineUsersList = this._onlineUsersList.asReadonly();
  readonly messagesRead = this._messagesRead.asReadonly();
  readonly callIncoming = this._callIncoming.asReadonly();
  readonly callAnswered = this._callAnswered.asReadonly();
  readonly callEnded = this._callEnded.asReadonly();
  readonly webrtcOffer = this._webrtcOffer.asReadonly();
  readonly webrtcAnswer = this._webrtcAnswer.asReadonly();
  readonly webrtcIceCandidate = this._webrtcIceCandidate.asReadonly();
  readonly connectionStatus = this._connectionStatus.asReadonly();
  readonly legacyTyping = this._legacyTyping.asReadonly();

  // Computed Signals
  readonly connectedStatus = computed(() => this._connectionStatus());
  readonly onlineUsersCount = computed(() => this._onlineUsersList().length);
  readonly hasActiveTyping = computed(() => this._legacyTyping()?.isTyping === true);

  constructor() {
    this.setupLegacyTypingMapping();
  }

  connect(): void {
    const token = this.auth.token();
    if (!token) {
      console.warn('No auth token available for Socket.IO connection');
      return;
    }

    try {
      this.socket = io(this.baseUrl, {
        auth: {
          token: token
        },
        transports: WebSocketService.SOCKET_TRANSPORTS,
        ...WebSocketService.CONNECTION_CONFIG
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Error creating Socket.IO connection:', error);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this._connectionStatus.set(false);
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket.IO connected');
      this._connectionStatus.set(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      this._connectionStatus.set(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      this._connectionStatus.set(false);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket.IO reconnected after', attemptNumber, 'attempts');
      this._connectionStatus.set(true);
    });

    this.socket.on('reconnecting', (attemptNumber) => {
      console.log('Socket.IO attempting to reconnect, attempt:', attemptNumber);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Socket.IO reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Socket.IO failed to reconnect after all attempts');
      this._connectionStatus.set(false);
    });

    // Message events
    this.socket.on(SocketEvents.MESSAGE_RECEIVE, (data: MessageReceiveData) => {
      this._messageReceive.set(data);
    });

    this.socket.on(SocketEvents.MESSAGE_ERROR, (data: MessageErrorData) => {
      this._messageError.set(data);
    });

    this.socket.on(SocketEvents.MESSAGE_DELETED, (data: MessageDeletedData) => {
      this._messageDeleted.set(data);
    });

    // Typing events
    this.socket.on(SocketEvents.TYPING_START, (data: TypingStartEmitData) => {
      this._typingStart.set(data);
    });

    this.socket.on(SocketEvents.TYPING_STOP, (data: TypingStopEmitData) => {
      this._typingStop.set(data);
    });

    // User status events
    this.socket.on(SocketEvents.USER_ONLINE, (data: UserOnlineData) => {
      this._userOnline.set(data);
      this.updateOnlineUser(data.userId, 'online');
    });

    this.socket.on(SocketEvents.USER_OFFLINE, (data: UserOfflineData) => {
      this._userOffline.set(data);
      this.updateOnlineUser(data.userId, 'offline', data.lastSeen);
    });

    this.socket.on(SocketEvents.USER_STATUS_UPDATE_EMIT, (data: UserStatusUpdateData) => {
      this._userStatusUpdate.set(data);
      this.updateOnlineUser(data.userId, data.status, data.timestamp);
    });

    this.socket.on(SocketEvents.USERS_ONLINE_LIST, (data: OnlineUser[]) => {
      this._onlineUsersList.set(data);
      this.updateOnlineUsersFromList(data);
    });

    // Message read events
    this.socket.on(SocketEvents.MESSAGES_READ, (data: MessagesReadData) => {
      this._messagesRead.set(data);
    });

    // Call events
    this.socket.on(SocketEvents.CALL_INCOMING, (data: CallIncomingData) => {
      this._callIncoming.set(data);
    });

    this.socket.on(SocketEvents.CALL_ANSWERED, (data: CallAnsweredData) => {
      this._callAnswered.set(data);
    });

    this.socket.on(SocketEvents.CALL_ENDED, (data: CallEndedData) => {
      this._callEnded.set(data);
    });

    // WebRTC events
    this.socket.on(SocketEvents.WEBRTC_OFFER, (data: WebRTCOfferEmitData) => {
      this._webrtcOffer.set(data);
    });

    this.socket.on(SocketEvents.WEBRTC_ANSWER, (data: WebRTCAnswerEmitData) => {
      this._webrtcAnswer.set(data);
    });

    this.socket.on(SocketEvents.WEBRTC_ICE_CANDIDATE, (data: WebRTCIceCandidateEmitData) => {
      this._webrtcIceCandidate.set(data);
    });
  }

  // Message Methods

  sendMessage(data: MessageSendData): void {
    if (this.isConnected()) {
      this.socket?.emit(SocketEvents.MESSAGE_SEND, data);
    } else {
      console.warn('Socket.IO is not connected. Message not sent:', data);
    }
  }

  deleteMessage(data: MessageDeleteData): void {
    if (this.isConnected()) {
      this.socket?.emit(SocketEvents.MESSAGE_DELETE, data);
    }
  }

  // Conversation Methods

  joinConversation(conversationId: string): void {
    if (this.isConnected()) {
      this.socket?.emit(SocketEvents.CONVERSATION_JOIN, conversationId);
    }
  }

  leaveConversation(conversationId: string): void {
    if (this.isConnected()) {
      this.socket?.emit(SocketEvents.CONVERSATION_LEAVE, conversationId);
    }
  }

  // Typing Methods

  startTyping(data: TypingStartData): void {
    if (this.isConnected()) {
      this.socket?.emit(SocketEvents.TYPING_START, data);
    }
  }

  stopTyping(data: TypingStopData): void {
    if (this.isConnected()) {
      this.socket?.emit(SocketEvents.TYPING_STOP, data);
    }
  }

  // User Status Methods

  updateUserStatus(status: 'online' | 'offline'): void {
    if (this.isConnected()) {
      this.socket?.emit(SocketEvents.USER_STATUS_UPDATE, { status });
    }
  }

  getOnlineUsers(): void {
    if (this.isConnected()) {
      this.socket?.emit(SocketEvents.USERS_GET_ONLINE);
    }
  }

  isUserOnline(userId: string): boolean {
    const user = this.onlineUsersMap.get(userId);
    return user?.status === 'online';
  }

  getUserLastSeen(userId: string): Date | null {
    const user = this.onlineUsersMap.get(userId);
    return user?.lastSeen || null;
  }

  getAllOnlineUsers(): OnlineUser[] {
    return Array.from(this.onlineUsersMap.values()).filter(user => user.status === 'online');
  }

  private updateOnlineUser(userId: string, status: 'online' | 'offline', lastSeen?: Date): void {
    const existingUser = this.onlineUsersMap.get(userId);
    
    if (existingUser) {
      existingUser.status = status;
      if (lastSeen) {
        existingUser.lastSeen = lastSeen;
      }
    } else {
      this.onlineUsersMap.set(userId, {
        userId,
        socketId: '',
        status,
        lastSeen: lastSeen || new Date()
      });
    }
  }

  private updateOnlineUsersFromList(users: OnlineUser[]): void {
    this.onlineUsersMap.clear();
    users.forEach(user => {
      this.onlineUsersMap.set(user.userId, user);
    });
  }

  // Message Read Methods

  markMessagesAsRead(data: MessagesMarkReadData): void {
    if (this.isConnected()) {
      this.socket?.emit(SocketEvents.MESSAGES_MARK_READ, data);
    }
  }

  // Call Methods

  initiateCall(data: CallInitiateData): void {
    if (this.isConnected()) {
      this.socket?.emit(SocketEvents.CALL_INITIATE, data);
    }
  }

  answerCall(data: CallAnswerData): void {
    if (this.isConnected()) {
      this.socket?.emit(SocketEvents.CALL_ANSWER, data);
    }
  }

  endCall(data: CallEndData): void {
    if (this.isConnected()) {
      this.socket?.emit(SocketEvents.CALL_END, data);
    }
  }

  // WebRTC Methods

  sendWebRTCOffer(data: WebRTCOfferData): void {
    if (this.isConnected()) {
      this.socket?.emit(SocketEvents.WEBRTC_OFFER, data);
    }
  }

  sendWebRTCAnswer(data: WebRTCAnswerData): void {
    if (this.isConnected()) {
      this.socket?.emit(SocketEvents.WEBRTC_ANSWER, data);
    }
  }

  sendWebRTCIceCandidate(data: WebRTCIceCandidateData): void {
    if (this.isConnected()) {
      this.socket?.emit(SocketEvents.WEBRTC_ICE_CANDIDATE, data);
    }
  }

  // Utility Methods

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  clearData(): void {
    this._messageReceive.set(null);
    this._messageDeleted.set(null);
    this._messageError.set(null);
    this._typingStart.set(null);
    this._typingStop.set(null);
    this._userOnline.set(null);
    this._userOffline.set(null);
    this._userStatusUpdate.set(null);
    this._onlineUsersList.set([]);
    this._messagesRead.set(null);
    this._callIncoming.set(null);
    this._callAnswered.set(null);
    this._callEnded.set(null);
    this._webrtcOffer.set(null);
    this._webrtcAnswer.set(null);
    this._webrtcIceCandidate.set(null);
    
    // Clear legacy typing signal
    this._legacyTyping.set(null);
    
    // Clear user status data
    this.onlineUsersMap.clear();
  }

  ensureConnection(): void {
    if (!this.isConnected() && this.auth.token()) {
      console.log('Attempting to reconnect WebSocket...');
      this.connect();
    }
  }

  startConnectionMonitoring(): void {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
    }
    
    this.reconnectTimer = setInterval(() => {
      if (!this.isConnected() && this.auth.token()) {
        console.log('Connection lost, attempting to reconnect...');
        this.connect();
      }
    }, 30000); // Check every 30 seconds
  }

  stopConnectionMonitoring(): void {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  sendTyping(conversationId: string, isTyping: boolean): void {
    if (isTyping) {
      this.startTyping({ conversationId, username: 'Current User' });
    } else {
      this.stopTyping({ conversationId });
    }
  }

  private setupLegacyTypingMapping(): void {
    // Map typingStart signal to legacy typing signal
    effect(() => {
      const typingStart = this._typingStart();
      if (typingStart) {
        untracked(() => {
          const legacyEvent: TypingEvent = {
            conversationId: typingStart.conversationId,
            userId: typingStart.userId,
            userName: typingStart.username,
            isTyping: true
          };
          this._legacyTyping.set(legacyEvent);
        });
      }
    });

    // Map typingStop signal to legacy typing signal
    effect(() => {
      const typingStop = this._typingStop();
      if (typingStop) {
        untracked(() => {
          const legacyEvent: TypingEvent = {
            conversationId: typingStop.conversationId,
            userId: typingStop.userId,
            userName: 'Unknown User', // TypingStopEmitData doesn't have username
            isTyping: false
          };
          this._legacyTyping.set(legacyEvent);
        });
      }
    });
  }
}
