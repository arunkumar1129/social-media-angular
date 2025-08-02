export interface User {
    id: string;
    _id?: string;
    username: string;
    email: string;
    avatarUrl: string;
    status: 'online' | 'offline' | 'away' | 'busy';
    displayName: string;
    bio?: string;
    location?: string;
    lastSeen: Date;
    createdAt?: Date;
}

export interface TokenRequest {
    username: string;
    password: string;
}

export interface TokenResponse {
    token: string;
}