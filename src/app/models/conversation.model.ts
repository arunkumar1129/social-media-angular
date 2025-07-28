import { Message } from "./message.model";
import { User } from "./user.model";

export interface Conversation {
    _id: string;
    participants: Partial<User>[]; // Array of user IDs
    lastMessage: Message; // Last message in the conversation
    lastUpdated: Date; // Timestamp of the last update
    unreadCount: number; // Count of unread messages
    isGroup: boolean; // Indicates if the conversation is a group chat
    groupName?: string; // Optional group name for group conversations
    groupAvatar?: string; // Optional group avatar URL for group conversations
    displayName?: string; // Display name for the conversation
    otherParticipant?: Partial<User>; // Optional other participant for one-on-one conversations
}