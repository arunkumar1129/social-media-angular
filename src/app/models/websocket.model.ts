import { User } from './user.model';

// Socket Authentication
export interface AuthenticatedSocket {
    userId?: string;
    user?: User;
    id: string;
    join(room: string): void;
    leave(room: string): void;
    to(room: string): any;
    broadcast: any;
    emit(event: string, data?: any): void;
    on(event: string, callback: Function): void;
    handshake: {
        auth: {
            token?: string;
        };
    };
}

// Online User Management
export interface OnlineUser {
    userId: string;
    socketId: string;
    lastSeen: Date;
    status: 'online' | 'offline';
}

// Message Events
export interface MessageSendData {
    conversationId: string;
    content: string;
    type?: 'text' | 'image' | 'video' | 'file';
    replyTo?: string;
}

export interface MessageReceiveData {
    _id: string;
    senderId: Partial<User>;
    conversationId: string;
    content: string;
    type: 'text' | 'image' | 'video' | 'file';
    timestamp: Date;
    read: boolean;
    replyTo?: string;
}

export interface MessageErrorData {
    message: string;
    error?: string;
}

export interface MessageDeleteData {
    messageId: string;
    conversationId: string;
}

export interface MessageDeletedData {
    messageId: string;
    conversationId: string;
}

// Typing Events
export interface TypingStartData {
    conversationId: string;
    username: string;
}

export interface TypingStartEmitData {
    userId: string;
    username: string;
    conversationId: string;
}

export interface TypingStopData {
    conversationId: string;
}

export interface TypingStopEmitData {
    userId: string;
    conversationId: string;
}

// User Status Events
export interface UserOnlineData {
    userId: string;
    timestamp: Date;
}

export interface UserOfflineData {
    userId: string;
    lastSeen: Date;
}

export interface UserStatusUpdateData {
    userId: string;
    status: 'online' | 'offline';
    timestamp: Date;
}

export interface OnlineUsersListData {
    userId: string;
    lastSeen: Date;
}

// Message Read Events
export interface MessagesMarkReadData {
    conversationId: string;
}

export interface MessagesReadData {
    conversationId: string;
    userId: string;
}

// Call Events
export interface CallInitiateData {
    conversationId: string;
    type: 'voice' | 'video';
    participants: string[];
}

export interface CallIncomingData {
    callerId: string;
    callerName: string;
    conversationId: string;
    type: 'voice' | 'video';
    timestamp: Date;
}

export interface CallAnswerData {
    conversationId: string;
    accepted: boolean;
}

export interface CallAnsweredData {
    userId: string;
    accepted: boolean;
}

export interface CallEndData {
    conversationId: string;
}

export interface CallEndedData {
    userId: string;
    timestamp: Date;
}

// WebRTC Events
export interface WebRTCOfferData {
    conversationId: string;
    offer: RTCSessionDescriptionInit;
}

export interface WebRTCOfferEmitData {
    offer: RTCSessionDescriptionInit;
    senderId: string;
}

export interface WebRTCAnswerData {
    conversationId: string;
    answer: RTCSessionDescriptionInit;
}

export interface WebRTCAnswerEmitData {
    answer: RTCSessionDescriptionInit;
    senderId: string;
}

export interface WebRTCIceCandidateData {
    conversationId: string;
    candidate: RTCIceCandidate;
}

export interface WebRTCIceCandidateEmitData {
    candidate: RTCIceCandidate;
    senderId: string;
}

// Socket Event Names (for type safety)
export enum SocketEvents {
    // Connection
    CONNECTION = 'connection',
    DISCONNECT = 'disconnect',

    // Conversation
    CONVERSATION_JOIN = 'conversation:join',
    CONVERSATION_LEAVE = 'conversation:leave',

    // Messages
    MESSAGE_SEND = 'message:send',
    MESSAGE_RECEIVE = 'message:receive',
    MESSAGE_ERROR = 'message:error',
    MESSAGE_DELETE = 'message:delete',
    MESSAGE_DELETED = 'message:deleted',

    // Typing
    TYPING_START = 'typing:start',
    TYPING_STOP = 'typing:stop',

    // User Status
    USER_ONLINE = 'user:online',
    USER_OFFLINE = 'user:offline',
    USER_STATUS_UPDATE = 'status:update',
    USER_STATUS_UPDATE_EMIT = 'user:status_update',
    USERS_GET_ONLINE = 'users:get_online',
    USERS_ONLINE_LIST = 'users:online_list',

    // Message Read
    MESSAGES_MARK_READ = 'messages:mark_read',
    MESSAGES_READ = 'messages:read',

    // Calls
    CALL_INITIATE = 'call:initiate',
    CALL_INCOMING = 'call:incoming',
    CALL_ANSWER = 'call:answer',
    CALL_ANSWERED = 'call:answered',
    CALL_END = 'call:end',
    CALL_ENDED = 'call:ended',

    // WebRTC
    WEBRTC_OFFER = 'webrtc:offer',
    WEBRTC_ANSWER = 'webrtc:answer',
    WEBRTC_ICE_CANDIDATE = 'webrtc:ice_candidate',
}

// Room Types
export enum RoomTypes {
    USER = 'user',
    CONVERSATION = 'conversation',
}

// Helper function to create room names
export const createRoomName = (type: RoomTypes, id: string): string => {
    return `${type}:${id}`;
};

// Legacy interface for backward compatibility
export interface WebSocketMessage {
    type: string;
    data: any;
}

export interface TypingEvent {
    conversationId: string;
    userId: string;
    userName: string;
    isTyping: boolean;
}

export interface UserStatusEvent {
    userId: string;
    status: 'online' | 'offline';
    timestamp?: Date;
}
