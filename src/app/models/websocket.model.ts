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
