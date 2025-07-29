import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, inject, input, computed, signal, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListboxModule } from 'primeng/listbox';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { Conversation } from '../../models/conversation.model';
import { User } from '../../models/user.model';
import { TimeUtilsService } from '../../services/time-utils.service';
import { ConversationService } from '../../services/conversation.service';
import { ContactsDialogComponent } from '../contacts-dialog/contacts-dialog';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ListboxModule,
    AvatarModule,
    BadgeModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    ButtonModule,
    TooltipModule,
    ContactsDialogComponent
  ],
  templateUrl: './chat-list.html',
  styleUrls: ['./chat-list.scss']
})
export class ChatListComponent implements OnInit, OnDestroy {
  private timeUtils = inject(TimeUtilsService);
  private conversationService = inject(ConversationService);

  conversations = input<Conversation[]>([]);
  selectedConversationId = model<string | null>(null);
  previousConversationId = model<string | null>(null);

  searchTerm = signal('');
  showContactsDialog = signal(false);
  isLoading: boolean = false;

  filteredConversations = computed(() => {
    if (!this.searchTerm()) {
      return this.conversations();
    }

    return this.conversations().filter(conversation =>
      conversation.displayName?.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
      conversation.groupName?.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
      conversation.otherParticipant?.displayName?.toLowerCase().includes(this.searchTerm().toLowerCase())
    );
  });

  onConversationSelect(conversationId: string): void {
    this.previousConversationId.set(this.selectedConversationId());
    this.selectedConversationId.set(conversationId);
  }

  getDisplayName(conversation: Conversation): string {
    if (conversation.isGroup) {
      return conversation.groupName || 'Group Chat';
    }
    return conversation.displayName || conversation.otherParticipant?.displayName || 'Unknown User';
  }

  getAvatar(conversation: Conversation): string {
    if (conversation.isGroup) {
      return conversation.groupAvatar || 'images/default-group-avatar.png';
    }
    return conversation.otherParticipant?.avatarUrl || 'images/default-avatar.png';
  }

  getLastMessageTime(conversation: Conversation): string {
    if (!conversation.lastMessage?.timestamp) {
      return '';
    }
    return this.timeUtils.formatConversationTime(conversation.lastMessage.timestamp);
  }

  truncateMessage(message: string, maxLength: number = 50): string {
    if (message.length <= maxLength) {
      return message;
    }
    return message.substring(0, maxLength) + '...';
  }

  onAddConversation(): void {
    this.showContactsDialog.set(true);
  }

  onUserSelected(user: User): void {
    // Create a new direct conversation with the selected user
    this.conversationService.createDirectConversation(user._id || user.id).subscribe({
      next: (response) => {
        // Conversation created and selected automatically by the service
        this.showContactsDialog.set(false);
      },
      error: (error) => {
        console.error('Error creating conversation:', error);
        // Handle error - maybe show a toast notification
      }
    });
  }

  ngOnInit(): void {
    // User status updates are now handled by ConversationService
    // No need for additional subscriptions in the component
  }

  ngOnDestroy(): void {
    // No cleanup needed as ConversationService handles subscriptions
  }
}
