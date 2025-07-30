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
import { WindowFocusService } from '../../services/window-focus.service';
import { DeviceService } from '../../services/device.service';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';

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
    BadgeModule,
    TimeAgoPipe
  ],
  templateUrl: './chat-window.html',
  styleUrls: ['./chat-window.scss']
})
export class ChatWindowComponent implements OnInit, OnDestroy {
  private conversationService = inject(ConversationService);
  private socketService = inject(WebSocketService);
  private windowFocusService = inject(WindowFocusService);
  deviceService = inject(DeviceService);
  private messageSubscription?: Subscription;
  private typingTimeout?: ReturnType<typeof setTimeout>;

  conversation = input<Conversation | null>(null);
  user = input<User | undefined>();
  @Output() messageSent = new EventEmitter<MessageSentEvent>();
  @Output() backToList = new EventEmitter<void>();

  newMessage: string = '';
  messages = this.conversationService.messages;
  isLoading: boolean = false;
  
  // Typing state
  isTyping: boolean = false;

  constructor() {
    effect(() => {
      if (this.messages()) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });

    // Scroll to bottom when typing indicators appear
    effect(() => {
      if (this.conversation() && this.isAnyoneTyping()) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });

    // Mark messages as read when conversation is active and has unread messages
    effect(() => {
      const conversation = this.conversation();
      const isWindowFocused = this.windowFocusService.isWindowFocused();
      
      if (conversation && conversation.unReadCount > 0 && isWindowFocused) {
        // Use a slight delay to ensure the conversation is fully loaded
        setTimeout(() => {
          this.conversationService.markConversationAsRead(conversation._id);
        }, 500);
      }
    });
  }

  ngOnInit() {
    // Subscribe to messages from the service
    
    // Add scroll event listener to mark messages as read when visible
    setTimeout(() => {
      const messageContainer = document.querySelector('.messages-container .p-scrollpanel-content');
      if (messageContainer) {
        messageContainer.addEventListener('scroll', () => {
          this.checkAndMarkMessagesAsRead();
        });
      }
    }, 1000);
  }

  private checkAndMarkMessagesAsRead(): void {
    const conversation = this.conversation();
    if (conversation && conversation.unReadCount > 0 && this.windowFocusService.isWindowFocused()) {
      // Mark as read if user has scrolled or conversation is visible
      this.conversationService.markConversationAsRead(conversation._id);
    }
  }

  ngOnDestroy() {
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
    
    // Clear typing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    // Stop typing indicator if active
    if (this.isTyping && this.conversation()) {
      this.conversationService.stopTyping(this.conversation()!._id);
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

    // Stop typing indicator
    this.stopTyping();

    this.newMessage = '';

    // Send message via socket
    this.socketService.sendMessage({...messageRequest, conversationId: this.conversation()!._id});
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    } else {
      // Handle typing for other keys
      this.onMessageInput();
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

  private scrollToBottom() {
    // This will be implemented to scroll the message container to bottom
    const messageContainer = document.querySelector('.messages-container .p-scrollpanel-content');
    if (messageContainer) {
      messageContainer.scrollTop = messageContainer.scrollHeight;
    }
  }

  trackByMessageId(index: number, message: Message): string {
    return message._id;
  }

  // ============ Typing Methods ============

  /**
   * Handle input change and typing indicators
   */
  onMessageInput(): void {
    if (!this.conversation()) return;

    const conversationId = this.conversation()!._id;

    // Start typing if not already typing
    if (!this.isTyping) {
      this.startTyping();
    }

    // Clear existing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Set timeout to stop typing after 1 second of inactivity
    this.typingTimeout = setTimeout(() => {
      this.stopTyping();
    }, 1000);
  }

  /**
   * Start typing indicator
   */
  private startTyping(): void {
    if (!this.conversation() || this.isTyping) return;

    this.isTyping = true;
    this.conversationService.startTyping(this.conversation()!._id);
  }

  /**
   * Stop typing indicator
   */
  private stopTyping(): void {
    if (!this.conversation() || !this.isTyping) return;

    this.isTyping = false;
    this.conversationService.stopTyping(this.conversation()!._id);
    
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = undefined;
    }
  }

  /**
   * Check if anyone is typing in the current conversation
   */
  isAnyoneTyping(): boolean {
    if (!this.conversation()) return false;
    return this.conversationService.isAnyoneTyping(this.conversation()!._id);
  }

  /**
   * Get typing text for display
   */
  getTypingText(): string {
    if (!this.conversation()) return '';
    return this.conversationService.getTypingText(this.conversation()!._id);
  }

  onBackToList(): void {
    this.backToList.emit();
  }
}
