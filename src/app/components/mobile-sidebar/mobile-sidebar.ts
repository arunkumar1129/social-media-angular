import { Component, inject, input, output } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Button } from 'primeng/button';
import { Avatar } from 'primeng/avatar';
import { User } from '../../models/user.model';
import { Auth } from '../../services/auth';
import { UserService } from '../../services/user-service';
import { ConversationService } from '../../services/conversation.service';

@Component({
  selector: 'app-mobile-sidebar',
  imports: [
    Button,
    Avatar,
    RouterLink,
    RouterLinkActive
  ],
  template: `
    <!-- Backdrop -->
    @if (visible()) {
      <div 
        class="fixed inset-0 bg-black bg-opacity-50 z-40"
        (click)="closeSidebar()">
      </div>
    }

    <!-- Sidebar -->
    <div 
      class="fixed top-0 left-0 h-full w-72 bg-white dark:bg-surface-800 shadow-2xl transform transition-transform duration-300 z-50"
      [class.translate-x-0]="visible()"
      [class.-translate-x-full]="!visible()">
      
      <!-- Header with User Profile -->
      <div class="p-6 bg-gradient-to-br from-primary-500 to-primary-600 text-white">
        <div class="flex items-center justify-end mb-3">
          <p-button
            icon="pi pi-times"
            [text]="true"
            [rounded]="true"
            severity="secondary"
            size="small"
            styleClass="text-white hover:bg-white hover:bg-opacity-20"
            (onClick)="closeSidebar()">
          </p-button>
        </div>
        
        <!-- User Profile -->
        <div class="flex items-center gap-3">
          <p-avatar 
            [image]="user()?.avatarUrl" 
            [label]="!user()?.avatarUrl ? getAvatarLabel() : undefined"
            size="large"
            shape="circle"
            class="border-2 border-white border-opacity-30">
          </p-avatar>
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-white truncate">
              {{ user()?.displayName || user()?.username }}
            </h3>
            <p class="text-sm text-white text-opacity-80 truncate">
              {{ user()?.email }}
            </p>
          </div>
        </div>
      </div>

      <!-- Navigation Menu -->
      <div class="p-4">
        <nav class="space-y-2">
          <p-button
            label="Messages"
            icon="pi pi-comments"
            [text]="true"
            severity="secondary"
            styleClass="w-full p-3 border-0 text-left mb-2"
            routerLink="/messenger"
            routerLinkActive="nav-active"
            (onClick)="closeSidebar()">
          </p-button>

          <p-button
            label="Profile"
            icon="pi pi-user"
            [text]="true"
            severity="secondary"
            styleClass="w-full p-3 border-0 text-left mb-2"
            routerLink="/profile"
            routerLinkActive="nav-active"
            (onClick)="closeSidebar()">
          </p-button>

          <p-button
            label="Settings"
            icon="pi pi-cog"
            [text]="true"
            severity="secondary"
            styleClass="w-full p-3 border-0 text-left mb-2">
          </p-button>
        </nav>
      </div>

      <!-- Bottom Section -->
      <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-surface-200 dark:border-surface-700">
        <p-button
          label="Sign Out"
          icon="pi pi-sign-out"
          severity="danger"
          [text]="true"
          styleClass="w-full justify-center"
          (onClick)="logout()">
        </p-button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      .nav-active ::ng-deep .p-button {
        background-color: var(--p-primary-50) !important;
        color: var(--p-primary-600) !important;
      }
      
      ::ng-deep .p-button {
        justify-content: flex-start !important;
      }
      
      ::ng-deep .justify-center.p-button {
        justify-content: center !important;
      }
      
      ::ng-deep .text-white .p-button {
        color: white !important;
      }
      
      ::ng-deep .text-white .p-button .p-button-icon {
        color: white !important;
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
