import { Component, effect, input, ViewChild, inject } from '@angular/core';
import { Avatar } from 'primeng/avatar';
import { Toolbar } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { User } from '../../models/user.model';
import { ProfileMenuComponent } from '../profile-menu/profile-menu';
import { ConversationService } from '../../services/conversation.service';

@Component({
  selector: 'app-header',
  imports: [
    Toolbar,
    Avatar,
    ButtonModule,
    BadgeModule,
    ProfileMenuComponent
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  @ViewChild('profileMenu') profileMenuComponent!: ProfileMenuComponent;
  
  private conversationService = inject(ConversationService);
  
  user = input<User | undefined>(undefined);
  
  // Computed signals for unread counts
  totalUnreadCount = this.conversationService.totalUnreadCount;
  unreadConversationsCount = this.conversationService.unreadConversationsCount;

  toggleSidebar() {
    const sidebar = document.querySelector('.layout-sidebar');
    if (sidebar) {
      sidebar.classList.toggle('layout-sidebar-active');
    }
  }

  showProfileMenu(event: Event) {
    this.profileMenuComponent.showMenu(event);
  }
}
