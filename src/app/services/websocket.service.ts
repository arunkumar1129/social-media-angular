import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { Message } from '../models/message.model';
import { Auth } from './auth';
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
  private auth = inject(Auth);
  private socket: Socket | null = null;
  private baseUrl = 'http://localhost:3000';

  // Subjects for real-time events
  private messageReceiveSubject = new BehaviorSubject<MessageReceiveData | null>(null);
  private messageDeletedSubject = new BehaviorSubject<MessageDeletedData | null>(null);
  private messageErrorSubject = new BehaviorSubject<MessageErrorData | null>(null);
  
  private typingStartSubject = new BehaviorSubject<TypingStartEmitData | null>(null);
  private typingStopSubject = new BehaviorSubject<TypingStopEmitData | null>(null);
  
  private userOnlineSubject = new BehaviorSubject<UserOnlineData | null>(null);
  private userOfflineSubject = new BehaviorSubject<UserOfflineData | null>(null);
  private userStatusUpdateSubject = new BehaviorSubject<UserStatusUpdateData | null>(null);
  private onlineUsersListSubject = new BehaviorSubject<OnlineUser[]>([]);
  
  private messagesReadSubject = new BehaviorSubject<MessagesReadData | null>(null);
  
  private callIncomingSubject = new BehaviorSubject<CallIncomingData | null>(null);
  private callAnsweredSubject = new BehaviorSubject<CallAnsweredData | null>(null);
  private callEndedSubject = new BehaviorSubject<CallEndedData | null>(null);
  
  private webrtcOfferSubject = new BehaviorSubject<WebRTCOfferEmitData | null>(null);
  private webrtcAnswerSubject = new BehaviorSubject<WebRTCAnswerEmitData | null>(null);
  private webrtcIceCandidateSubject = new BehaviorSubject<WebRTCIceCandidateEmitData | null>(null);
  
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);

  // Public observables
  messageReceive$ = this.messageReceiveSubject.asObservable();
  messageDeleted$ = this.messageDeletedSubject.asObservable();
  messageError$ = this.messageErrorSubject.asObservable();
  
  typingStart$ = this.typingStartSubject.asObservable();
  typingStop$ = this.typingStopSubject.asObservable();
  
  userOnline$ = this.userOnlineSubject.asObservable();
  userOffline$ = this.userOfflineSubject.asObservable();
  userStatusUpdate$ = this.userStatusUpdateSubject.asObservable();
  onlineUsersList$ = this.onlineUsersListSubject.asObservable();
  
  messagesRead$ = this.messagesReadSubject.asObservable();
  
  callIncoming$ = this.callIncomingSubject.asObservable();
  callAnswered$ = this.callAnsweredSubject.asObservable();
  callEnded$ = this.callEndedSubject.asObservable();
  
  webrtcOffer$ = this.webrtcOfferSubject.asObservable();
  webrtcAnswer$ = this.webrtcAnswerSubject.asObservable();
  webrtcIceCandidate$ = this.webrtcIceCandidateSubject.asObservable();
  
  connectionStatus$ = this.connectionStatusSubject.asObservable();

  // Legacy observables for backward compatibility
  message$ = this.messageReceiveSubject.asObservable();
  typing$ = new BehaviorSubject<TypingEvent | null>(null).asObservable();
  userStatus$ = new BehaviorSubject<UserStatusEvent | null>(null).asObservable();

  /**
   * Initialize Socket.IO connection
   */
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
        transports: ['websocket', 'polling'],
        upgrade: true,
        autoConnect: true
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Error creating Socket.IO connection:', error);
    }
  }

  /**
   * Disconnect Socket.IO
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionStatusSubject.next(false);
  }

  /**
   * Setup Socket.IO event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket.IO connected');
      this.connectionStatusSubject.next(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      this.connectionStatusSubject.next(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      this.connectionStatusSubject.next(false);
    });

    // Message events
    this.socket.on(SocketEvents.MESSAGE_RECEIVE, (data: MessageReceiveData) => {
      console.log('Message received:', data);
      this.messageReceiveSubject.next(data);
    });

    this.socket.on(SocketEvents.MESSAGE_ERROR, (data: MessageErrorData) => {
      this.messageErrorSubject.next(data);
    });

    this.socket.on(SocketEvents.MESSAGE_DELETED, (data: MessageDeletedData) => {
      this.messageDeletedSubject.next(data);
    });

    // Typing events
    this.socket.on(SocketEvents.TYPING_START, (data: TypingStartEmitData) => {
      this.typingStartSubject.next(data);
    });

    this.socket.on(SocketEvents.TYPING_STOP, (data: TypingStopEmitData) => {
      this.typingStopSubject.next(data);
    });

    // User status events
    this.socket.on(SocketEvents.USER_ONLINE, (data: UserOnlineData) => {
      this.userOnlineSubject.next(data);
    });

    this.socket.on(SocketEvents.USER_OFFLINE, (data: UserOfflineData) => {
      this.userOfflineSubject.next(data);
    });

    this.socket.on(SocketEvents.USER_STATUS_UPDATE_EMIT, (data: UserStatusUpdateData) => {
      this.userStatusUpdateSubject.next(data);
    });

    this.socket.on(SocketEvents.USERS_ONLINE_LIST, (data: OnlineUser[]) => {
      this.onlineUsersListSubject.next(data);
    });

    // Message read events
    this.socket.on(SocketEvents.MESSAGES_READ, (data: MessagesReadData) => {
      this.messagesReadSubject.next(data);
    });

    // Call events
    this.socket.on(SocketEvents.CALL_INCOMING, (data: CallIncomingData) => {
      this.callIncomingSubject.next(data);
    });

    this.socket.on(SocketEvents.CALL_ANSWERED, (data: CallAnsweredData) => {
      this.callAnsweredSubject.next(data);
    });

    this.socket.on(SocketEvents.CALL_ENDED, (data: CallEndedData) => {
      this.callEndedSubject.next(data);
    });

    // WebRTC events
    this.socket.on(SocketEvents.WEBRTC_OFFER, (data: WebRTCOfferEmitData) => {
      this.webrtcOfferSubject.next(data);
    });

    this.socket.on(SocketEvents.WEBRTC_ANSWER, (data: WebRTCAnswerEmitData) => {
      this.webrtcAnswerSubject.next(data);
    });

    this.socket.on(SocketEvents.WEBRTC_ICE_CANDIDATE, (data: WebRTCIceCandidateEmitData) => {
      this.webrtcIceCandidateSubject.next(data);
    });
  }

  // ============ Message Methods ============

  /**
   * Send a message
   */
  sendMessage(data: MessageSendData): void {
    if (this.isConnected()) {
      this.socket?.emit(SocketEvents.MESSAGE_SEND, data);
    } else {
      console.warn('Socket.IO is not connected. Message not sent:', data);
    }
  }

  /**
   * Delete a message
   */
  deleteMessage(data: MessageDeleteData): void {
    if (this.isConnected()) {
      this.socket?.emit(SocketEvents.MESSAGE_DELETE, data);
    }
  }

  // ============ Conversation Methods ============

  /**
   * Join a conversation room
   */
  joinConversation(conversationId: string): void {
    if (this.isConnected()) {
      this.socket?.emit(SocketEvents.CONVERSATION_JOIN, conversationId);
    }
  }

  /**
   * Leave a conversation room
   */
  leaveConversation(conversationId: string): void {
    if (this.isConnected()) {
      this.socket?.emit(SocketEvents.CONVERSATION_LEAVE, conversationId);
    }
  }

  // ============ Typing Methods ============

  /**
   * Start typing indicator
   */
  startTyping(data: TypingStartData): void {
    if (this.isConnected()) {
      this.socket?.emit(SocketEvents.TYPING_START, data);
    }
  }

  /**
   * Stop typing indicator
   */
  stopTyping(data: TypingStopData): void {
    if (this.isConnected()) {
      this.socket?.emit(SocketEvents.TYPING_STOP, data);
    }
  }

  // ============ User Status Methods ============

  /**
   * Update user status
   */
  updateUserStatus(status: 'online' | 'offline'): void {
    if (this.isConnected()) {
      this.socket?.emit(SocketEvents.USER_STATUS_UPDATE, { status });
    }
  }

  /**
   * Get online users list
   */
  getOnlineUsers(): void {
    if (this.isConnected()) {
      this.socket?.emit(SocketEvents.USERS_GET_ONLINE);
    }
  }

  // ============ Message Read Methods ============

  /**
   * Mark messages as read
   */
  markMessagesAsRead(data: MessagesMarkReadData): void {
    if (this.isConnected()) {
      this.socket?.emit(SocketEvents.MESSAGES_MARK_READ, data);
    }
  }

  // ============ Call Methods ============

  /**
   * Initiate a call
   */
  initiateCall(data: CallInitiateData): void {
    if (this.isConnected()) {
      this.socket?.emit(SocketEvents.CALL_INITIATE, data);
    }
  }

  /**
   * Answer a call
   */
  answerCall(data: CallAnswerData): void {
    if (this.isConnected()) {
      this.socket?.emit(SocketEvents.CALL_ANSWER, data);
    }
  }

  /**
   * End a call
   */
  endCall(data: CallEndData): void {
    if (this.isConnected()) {
      this.socket?.emit(SocketEvents.CALL_END, data);
    }
  }

  // ============ WebRTC Methods ============

  /**
   * Send WebRTC offer
   */
  sendWebRTCOffer(data: WebRTCOfferData): void {
    if (this.isConnected()) {
      this.socket?.emit(SocketEvents.WEBRTC_OFFER, data);
    }
  }

  /**
   * Send WebRTC answer
   */
  sendWebRTCAnswer(data: WebRTCAnswerData): void {
    if (this.isConnected()) {
      this.socket?.emit(SocketEvents.WEBRTC_ANSWER, data);
    }
  }

  /**
   * Send WebRTC ICE candidate
   */
  sendWebRTCIceCandidate(data: WebRTCIceCandidateData): void {
    if (this.isConnected()) {
      this.socket?.emit(SocketEvents.WEBRTC_ICE_CANDIDATE, data);
    }
  }

  // ============ Utility Methods ============

  /**
   * Get current connection status
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Clear all subjects (useful for logout)
   */
  clearData(): void {
    this.messageReceiveSubject.next(null);
    this.messageDeletedSubject.next(null);
    this.messageErrorSubject.next(null);
    this.typingStartSubject.next(null);
    this.typingStopSubject.next(null);
    this.userOnlineSubject.next(null);
    this.userOfflineSubject.next(null);
    this.userStatusUpdateSubject.next(null);
    this.onlineUsersListSubject.next([]);
    this.messagesReadSubject.next(null);
    this.callIncomingSubject.next(null);
    this.callAnsweredSubject.next(null);
    this.callEndedSubject.next(null);
    this.webrtcOfferSubject.next(null);
    this.webrtcAnswerSubject.next(null);
    this.webrtcIceCandidateSubject.next(null);
  }

  // ============ Legacy Methods for Backward Compatibility ============

  /**
   * Legacy method for sending typing indicator
   */
  sendTyping(conversationId: string, isTyping: boolean): void {
    if (isTyping) {
      this.startTyping({ conversationId, username: 'Current User' });
    } else {
      this.stopTyping({ conversationId });
    }
  }
}
