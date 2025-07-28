# Chat Components API Integration

This document outlines the integration of the chat-list and chat-window components with the backend APIs for conversations and messages.

## Services Created

### 1. ConversationService (`conversation.service.ts`)
The main service for handling conversation and message operations.

#### Key Features:
- **Reactive State Management**: Uses Angular signals for conversations and selected conversation
- **Real-time Updates**: Integrates with WebSocket service for live messaging
- **API Integration**: Handles all HTTP requests for conversations and messages
- **Optimistic Updates**: Provides immediate UI feedback while API calls are in progress

#### API Endpoints:
- `GET /api/conversations` - Get all conversations
- `GET /api/conversations/:id` - Get specific conversation
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/:id/messages` - Get messages for conversation
- `POST /api/conversations/:id/messages` - Send message
- `PATCH /api/conversations/:id/messages/read` - Mark messages as read
- `DELETE /api/conversations/:id` - Delete conversation
- `GET /api/conversations/search` - Search conversations

#### Methods:
- `getConversations()` - Fetch user's conversations
- `getMessages(conversationId)` - Fetch messages for a conversation
- `sendMessage(conversationId, message)` - Send a new message
- `setSelectedConversation(conversation)` - Set active conversation
- `markMessagesAsRead(conversationId, messageIds)` - Mark messages as read
- `createConversation(participants)` - Create new conversation

### 2. WebSocketService (`websocket.service.ts`)
Handles real-time communication for instant messaging.

#### Key Features:
- **Real-time Messaging**: Instant message delivery and receipt
- **Typing Indicators**: Shows when users are typing
- **User Status Updates**: Online/offline status changes
- **Auto Reconnection**: Automatically reconnects on connection loss
- **Room Management**: Join/leave conversation rooms

#### WebSocket Events:
- `message` - New message received
- `typing` - User typing status
- `user_status` - User online/offline status
- `conversation_update` - Conversation metadata changes

## Component Updates

### ChatListComponent
- **Service Integration**: Now uses `ConversationService` to fetch conversations
- **Real-time Updates**: Automatically updates when new messages arrive
- **Loading States**: Shows loading indicators during API calls
- **Error Handling**: Graceful fallback to mock data if API fails

### ChatWindowComponent
- **Message Loading**: Fetches messages from API when conversation is selected
- **Real-time Messaging**: Receives messages instantly via WebSocket
- **Optimistic Updates**: Shows sent messages immediately with fallback on error
- **Typing Indicators**: Can send/receive typing status (ready for implementation)
- **Message States**: Tracks sent, delivered, and read status

### MessengerComponent
- **Service Orchestration**: Coordinates between conversation and user services
- **User Profile**: Loads current user profile for message attribution
- **State Management**: Manages selected conversation and message flow

## Data Flow

### 1. Loading Conversations
```
MessengerComponent.ngOnInit()
  → ConversationService.getConversations()
  → HTTP GET /api/conversations
  → Update conversations signal
  → ChatListComponent displays updated list
```

### 2. Selecting Conversation
```
User clicks conversation in ChatListComponent
  → ConversationService.setSelectedConversation()
  → WebSocket: Leave previous room, join new room
  → ConversationService.getMessages()
  → HTTP GET /api/conversations/:id/messages
  → Update messages BehaviorSubject
  → ChatWindowComponent displays messages
```

### 3. Sending Message
```
User types and sends message in ChatWindowComponent
  → Optimistic UI update (show message immediately)
  → ConversationService.sendMessage()
  → HTTP POST /api/conversations/:id/messages
  → WebSocket: Broadcast to all participants
  → Replace optimistic message with server response
  → Update conversation's last message
```

### 4. Receiving Message
```
WebSocket receives message event
  → WebSocketService.handleMessage()
  → ConversationService.handleRealtimeMessage()
  → Update messages BehaviorSubject
  → ChatWindowComponent automatically updates
  → Update conversation list with new last message
```

## Error Handling

### API Failures
- **Graceful Degradation**: Falls back to mock data for development
- **User Feedback**: Logs errors to console (can be extended with toast notifications)
- **Retry Logic**: WebSocket auto-reconnection with exponential backoff

### Optimistic Updates
- **Message Sending**: Shows message immediately, removes if send fails
- **Connection Loss**: Maintains local state, syncs when reconnected
- **Duplicate Prevention**: Checks for existing messages to avoid duplicates

## Configuration

### API Base URL
Both services use `http://localhost:3000/api` as the base URL. This can be configured via environment variables.

### WebSocket URL
WebSocket connects to `ws://localhost:3000` with authentication token in query params.

### Authentication
- Uses token from `Auth` service for HTTP requests (via interceptor)
- Passes token to WebSocket connection for authorization

## Usage Examples

### Loading Conversations
```typescript
// Automatically called in MessengerComponent.ngOnInit()
this.conversationService.getConversations().subscribe({
  next: (response) => {
    // Conversations automatically updated via signal
  },
  error: (error) => {
    // Falls back to mock data
  }
});
```

### Sending Message
```typescript
// Called from ChatWindowComponent
const messageRequest = {
  content: 'Hello world!',
  type: 'text'
};

this.conversationService.sendMessage(conversationId, messageRequest).subscribe({
  next: (response) => {
    // Message automatically added to conversation
  },
  error: (error) => {
    // Optimistic message removed, original text restored
  }
});
```

### Real-time Message Handling
```typescript
// Automatically handled in ConversationService constructor
this.wsService.message$.subscribe(message => {
  if (message) {
    // Add to current messages and update conversation
    this.handleRealtimeMessage(message);
  }
});
```

## Testing

### Unit Tests
- `ConversationService` has comprehensive tests for all API methods
- `WebSocketService` has tests for connection management and message handling
- Component tests verify service integration and UI updates

### Mock Data
- Services fall back to mock data when API is unavailable
- Supports development without backend running
- Realistic conversation and message data for UI testing

## Future Enhancements

### Planned Features
- **Message Reactions**: Like, love, laugh reactions
- **File Attachments**: Image, document, and media sharing
- **Message Editing**: Edit sent messages with history
- **Message Threading**: Reply to specific messages
- **Push Notifications**: Browser notifications for new messages
- **Message Encryption**: End-to-end encryption for privacy
- **Voice Messages**: Audio message recording and playback
- **Message Search**: Full-text search across conversations
- **Message Persistence**: Offline message caching with sync

### Technical Improvements
- **Pagination**: Load messages in chunks for better performance
- **Virtual Scrolling**: Handle large message lists efficiently
- **Background Sync**: Sync messages when app comes back online
- **Message Queuing**: Queue messages when offline, send when connected
- **Performance Optimization**: Message deduplication and memory management
