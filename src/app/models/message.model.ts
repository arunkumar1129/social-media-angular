import { User } from "./user.model";

export interface Message {
  _id: string;
  conversationId: string;
  senderId: Partial<User>; // Partial user info for the sender
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file' | 'video'; // Message type
  readBy?: string[];
}

export interface MessageSentEvent {
  conversationId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'video';
}