import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { RippleModule } from 'primeng/ripple';
import { User } from '../../models/user.model';
import { Auth } from '../../services/auth';
import { UserService } from '../../services/user-service';
import { ConversationService } from '../../services/conversation.service';

@Component({
  selector: 'app-mobile-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    AvatarModule,
    DividerModule,
    RippleModule
  ],
  template: `
    <!-- Backdrop -->
    <div 
      *ngIf="visible()"
      class="fixed inset-0 bg-black bg-opacity-50 z-40"
      (click)="closeSidebar()">
    </div>

    <!-- Sidebar -->
    <div 
      class="fixed top-0 left-0 h-full w-80 max-w-screen bg-white dark:bg-surface-800 shadow-lg transform transition-transform duration-300 z-50"
      [class.translate-x-0]="visible()"
      [class.-translate-x-full]="!visible()">
      
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700">
        <div class="flex items-center gap-3">
          <img src="talkio-logo.png" alt="Talkio" class="w-8 h-8" />
          <span class="text-lg font-semibold text-surface-900 dark:text-surface-0">Talkio</span>
        </div>
        <p-button
          icon="pi pi-times"
          [text]="true"
          [rounded]="true"
          severity="secondary"
          size="small"
          (onClick)="closeSidebar()">
        </p-button>
      </div>

      <!-- Content -->
      <div class="p-4 space-y-6">
        <!-- User Profile Section -->
        <div class="flex flex-col items-center text-center p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
          <p-avatar 
            [image]="user()?.avatarUrl" 
            [label]="!user()?.avatarUrl ? getAvatarLabel() : undefined"
            size="xlarge" 
            shape="circle"
            class="mb-3">
          </p-avatar>
          <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-1">
            {{ user()?.displayName || user()?.username }}
          </h3>
          <p class="text-sm text-surface-600 dark:text-surface-400">
            {{ user()?.email }}
          </p>
        </div>

        <!-- Navigation Menu -->
        <div class="space-y-2 flex flex-col items-start">
          <p-button
            label="Messages"
            icon="pi pi-comments"
            [text]="true"
            severity="secondary"
            styleClass="w-full nav-item"
            [class]="isActiveRoute('/messenger') ? 'active-nav-item' : ''"
            (onClick)="navigateTo('/messenger')">
          </p-button>

          <p-button
            label="Profile"
            icon="pi pi-user"
            [text]="true"
            severity="secondary"
            styleClass="w-full nav-item"
            [class]="isActiveRoute('/profile') ? 'active-nav-item' : ''"
            (onClick)="navigateTo('/profile')">
          </p-button>
        </div>

        <p-divider></p-divider>

        <!-- Action Buttons -->
        <div class="space-y-2">
          <p-button
            label="Logout"
            icon="pi pi-sign-out"
            severity="danger"
            [outlined]="true"
            styleClass="w-full"
            (onClick)="logout()">
          </p-button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      .nav-item {
        justify-content: flex-start !important;
        padding: 0.75rem 1rem !important;
        text-align: left !important;
      }
      
      .active-nav-item {
        background-color: var(--primary-50) !important;
        color: var(--primary-600) !important;
      }
      
      .translate-x-0 {
        transform: translateX(0);
      }
      
      .-translate-x-full {
        transform: translateX(-100%);
      }
    }
  `]
})
export class MobileSidebarComponent {
  private router = inject(Router);
  private auth = inject(Auth);
  private userService = inject(UserService);
  private conversationService = inject(ConversationService);

  user = input<User | undefined>();
  visible = input<boolean>(false);
  visibleChange = output<boolean>();

  closeSidebar() {
    this.visibleChange.emit(false);
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
    this.closeSidebar();
  }

  isActiveRoute(route: string): boolean {
    return this.router.url === route;
  }

  logout() {
    this.auth.logout().subscribe(() => {
      this.userService.logout();
      this.conversationService.disconnect();
      this.router.navigate(['/login']);
      this.closeSidebar();
    });
  }

  getAvatarLabel(): string {
    return this.user()?.displayName?.charAt(0).toUpperCase() || 
           this.user()?.username?.charAt(0).toUpperCase() || 'U';
  }
}
