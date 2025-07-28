import { Component, EventEmitter, Input, Output, OnInit, inject, input, computed, signal, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListboxModule } from 'primeng/listbox';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Conversation } from '../../models/conversation.model';
import { TimeUtilsService } from '../../services/time-utils.service';

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
    InputIconModule
  ],
  templateUrl: './chat-list.html',
  styleUrls: ['./chat-list.scss']
})
export class ChatListComponent {
  private timeUtils = inject(TimeUtilsService);

  conversations = input<Conversation[]>([]);
  selectedConversationId = model<string | null>(null);
  previousConversationId = model<string | null>(null);

  searchTerm = signal('');
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
}
