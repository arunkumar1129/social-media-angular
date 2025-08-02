import { Component, effect, input, ViewChild, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Avatar } from 'primeng/avatar';
import { Toolbar } from 'primeng/toolbar';
import { Badge } from 'primeng/badge';
import { Button } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { Menu } from 'primeng/menu';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { User } from '../../models/user.model';
import { ConversationService } from '../../services/conversation.service';
import { Auth } from '../../services/auth';
import { UserService } from '../../services/user-service';
import { MobileSidebarComponent } from '../mobile-sidebar/mobile-sidebar';

@Component({
  selector: 'app-header',
  imports: [
    Toolbar,
    Avatar,
    Badge,
    Button,
    MenuModule,
    ConfirmDialogModule,
    ToastModule,
    RouterLink,
    RouterLinkActive,
    MobileSidebarComponent
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  providers: [MessageService, ConfirmationService]
})
export class Header {
  @ViewChild('userMenu') userMenu!: Menu;
  
  private conversationService = inject(ConversationService);
  public router = inject(Router);
  private auth = inject(Auth);
  private userService = inject(UserService);
  private confirmationService = inject(ConfirmationService);
  
  user = input<User | undefined>(undefined);
  
  // Mobile sidebar state
  sidebarVisible = signal(false);
  
  // Computed signals for unread counts
  totalUnreadCount = this.conversationService.totalUnreadCount;
  unreadConversationsCount = this.conversationService.unreadConversationsCount;

  toggleSidebar() {
    this.sidebarVisible.set(!this.sidebarVisible());
  }

  showUserMenu(event: Event) {
    this.userMenu.show(event);
  }

  logout() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to logout?',
      header: 'Logout Confirmation',
      icon: 'pi pi-sign-out',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.auth.logout().subscribe(() => {
          this.userService.logout();
          this.conversationService.disconnect();
          this.router.navigate(['/login']);
        });
      }
    });
  }
}
