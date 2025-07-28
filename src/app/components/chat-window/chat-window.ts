import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, inject, signal, SimpleChanges, effect, input, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { ToolbarModule } from 'primeng/toolbar';
import { MenuModule } from 'primeng/menu';
import { BadgeModule } from 'primeng/badge';
import { Subscription } from 'rxjs';
import { Conversation } from '../../models/conversation.model';
import { User } from '../../models/user.model';
import { ConversationService } from '../../services/conversation.service';
import { Message, MessageSentEvent } from '../../models/message.model';
import { WebSocketService } from '../../services/websocket.service';
import { TimeUtilsService } from '../../services/time-utils.service';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    AvatarModule,
    ScrollPanelModule,
    ToolbarModule,
    MenuModule,
    BadgeModule
  ],
  templateUrl: './chat-window.html',
  styleUrls: ['./chat-window.scss']
})
export class ChatWindowComponent implements OnInit, OnDestroy {
  private conversationService = inject(ConversationService);
  private socketService = inject(WebSocketService);
  private timeUtils = inject(TimeUtilsService);
  private messageSubscription?: Subscription;

  conversation = input<Conversation | null>(null);
  user = input<User | undefined>();
  @Output() messageSent = new EventEmitter<MessageSentEvent>();

  newMessage: string = '';
  messages = this.conversationService.messages;
  isLoading: boolean = false;

  constructor() {
    effect(() => {
      if (this.messages()) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  ngOnInit() {
    // Subscribe to messages from the service
    
  }

  ngOnDestroy() {
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.conversation()) {
      return;
    }
    const messageContent = this.newMessage.trim();
    const messageRequest = {
      content: messageContent,
      type: 'text' as const
    };

    this.newMessage = '';

    // Send message via API
    // this.conversationService.sendMessage({ ...messageRequest, conversationId: this.conversation._id }).subscribe();
    this.socketService.sendMessage({ ...messageRequest, conversationId: this.conversation()!._id });
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  getDisplayName(): string {
    if (!this.conversation()) return '';

    if (this.conversation()!.isGroup) {
      return this.conversation()!.groupName || 'Group Chat';
    }
    return this.conversation()!.displayName || this.conversation()!.otherParticipant?.displayName || 'Unknown User';
  }

  getAvatar(): string {
    if (!this.conversation()) return '';

    if (this.conversation()!.isGroup) {
      return this.conversation()!.groupAvatar || 'images/default-group-avatar.png';
    }
    return this.conversation()!.otherParticipant?.avatarUrl || 'images/default-avatar.png';
  }

  formatMessageTime(timestamp: Date): string {
    return this.timeUtils.formatMessageTime(timestamp);
  }

  private scrollToBottom() {
    // This will be implemented to scroll the message container to bottom
    const messageContainer = document.querySelector('.messages-container .p-scrollpanel-content');
    if (messageContainer) {
      messageContainer.scrollTop = messageContainer.scrollHeight;
    }
  }

  getOnlineStatus(): string {
    if (!this.conversation() || this.conversation()!.isGroup) return '';
    return this.conversation()!.otherParticipant?.status === 'online' ? 'online' : 'offline';
  }

  trackByMessageId(index: number, message: Message): string {
    return message._id;
  }
}
