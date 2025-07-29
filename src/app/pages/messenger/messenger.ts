import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
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
    CommonModule,
    TagModule,
    ChatListComponent,
    ChatWindowComponent
  ],
  templateUrl: './messenger.html',
  styleUrl: './messenger.scss'
})
export class Messenger implements OnInit, OnDestroy {
  public conversationService = inject(ConversationService);
  private userService = inject(UserService);
  private socketService = inject(WebSocketService);
  
  conversations = this.conversationService.conversations;
  user = this.userService.user;
  connectionStatus = this.socketService.connectionStatus;

  ngOnInit() {
    this.socketService.connect();
    this.socketService.startConnectionMonitoring();
    this.loadConversations();
  }

  ngOnDestroy() {
    this.socketService.stopConnectionMonitoring();
  }

  private loadConversations() {
    this.conversationService.getConversations().subscribe();
  }

  onMessageSent(event: MessageSentEvent): void {
    
  }
}
