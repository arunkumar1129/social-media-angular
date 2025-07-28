import { Component, OnInit, inject } from '@angular/core';
import { ChatListComponent } from '../../components/chat-list/chat-list';
import { ChatWindowComponent } from '../../components/chat-window/chat-window';
import { Conversation } from '../../models/conversation.model';
import { MessageSentEvent } from '../../models/message.model';
import { ConversationService } from '../../services/conversation.service';
import { UserService } from '../../services/user-service';
import { WebSocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-messenger',
  imports: [
    ChatListComponent,
    ChatWindowComponent
  ],
  templateUrl: './messenger.html',
  styleUrl: './messenger.scss'
})
export class Messenger implements OnInit {
  public conversationService = inject(ConversationService);
  private userService = inject(UserService);
  private socketService = inject(WebSocketService);
  
  conversations = this.conversationService.conversations;
  user = this.userService.user;

  ngOnInit() {
    this.socketService.connect();
    this.loadConversations();
  }

  private loadConversations() {
    this.conversationService.getConversations().subscribe();
  }

  onMessageSent(event: MessageSentEvent): void {
    // Handle message sent event
    console.log('Message sent:', event);
    
    // The conversation service will handle updating the conversation's last message
    // No need to manually update here as the service manages this
  }
}
