import { Component, inject, input, computed, signal, model, output } from '@angular/core';
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
import { ConversationService } from '../../services/conversation.service';
import { ContactsDialogComponent } from '../contacts-dialog/contacts-dialog';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';

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
    ContactsDialogComponent,
    TimeAgoPipe
  ],
  templateUrl: './chat-list.html',
  styleUrls: ['./chat-list.scss']
})
export class ChatListComponent {
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

  getAvatar(conversation: Conversation): string {
    if (conversation.isGroup) {
      return conversation.groupAvatar || 'images/default-group-avatar.png';
    }
    return conversation.otherParticipant?.avatarUrl || 'images/default-avatar.png';
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
    this.conversationService.createDirectConversation(user._id || user.id).subscribe({
      next: (response) => {
        this.showContactsDialog.set(false);
      },
      error: (error) => {
        this.showContactsDialog.set(false);
      }
    });
  }
}
