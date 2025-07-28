export interface User {
    id: string;
    _id?: string;
    username: string;
    email: string;
    avatarUrl: string;
    status: 'online' | 'offline';
    displayName: string;
}

export interface TokenRequest {
    username: string;
    password: string;
}

export interface TokenResponse {
    token: string;
}