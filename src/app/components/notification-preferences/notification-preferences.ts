import { Component, inject, model, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { DividerModule } from 'primeng/divider';
import { BadgeModule } from 'primeng/badge';
import { PushNotificationService } from '../../services/push-notification.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-notification-preferences',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ToggleButtonModule,
    DividerModule,
    BadgeModule,
    FormsModule
  ],
  template: `
    <div class="notification-preferences p-4">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-lg font-semibold text-surface-900 dark:text-surface-0 m-0">
          Notifications
        </h4>
        <p-badge 
          *ngIf="isSubscribed()" 
          value="ON" 
          severity="success" 
          size="small">
        </p-badge>
        <p-badge 
          *ngIf="!isSubscribed()" 
          value="OFF" 
          severity="secondary" 
          size="small">
        </p-badge>
      </div>

      <!-- Push Notifications Toggle -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex flex-col">
          <label class="text-sm font-medium text-surface-700 dark:text-surface-300">
            Push Notifications
          </label>
          <span class="text-xs text-surface-500 dark:text-surface-400">
            Get notified about new messages
          </span>
        </div>
        <p-toggleButton
          [(ngModel)]="isSubscribed"
          onLabel="ON"
          offLabel="OFF"
          onIcon="pi pi-bell"
          offIcon="pi pi-bell-slash"
          [disabled]="!pushService.isSupported || isLoading()"
          (onChange)="onTogglePushNotifications($event)">
        </p-toggleButton>
      </div>

      <!-- Message Notifications -->
      <div class="flex items-center justify-between mb-3" *ngIf="isSubscribed()">
        <div class="flex flex-col">
          <label class="text-sm font-medium text-surface-700 dark:text-surface-300">
            New Messages
          </label>
          <span class="text-xs text-surface-500 dark:text-surface-400">
            Notify when you receive messages
          </span>
        </div>
        <p-toggleButton
          [(ngModel)]="messageNotifications"
          onLabel="ON"
          offLabel="OFF"
          (onChange)="onToggleMessageNotifications($event)">
        </p-toggleButton>
      </div>

      <!-- Group Message Notifications -->
      <div class="flex items-center justify-between mb-3" *ngIf="isSubscribed()">
        <div class="flex flex-col">
          <label class="text-sm font-medium text-surface-700 dark:text-surface-300">
            Group Messages
          </label>
          <span class="text-xs text-surface-500 dark:text-surface-400">
            Notify for group conversations
          </span>
        </div>
        <p-toggleButton
          [(ngModel)]="groupNotifications"
          onLabel="ON"
          offLabel="OFF"
          (onChange)="onToggleGroupNotifications($event)">
        </p-toggleButton>
      </div>

      <p-divider></p-divider>

      <!-- Test Notification -->
      <div class="flex justify-center mt-3" *ngIf="isSubscribed()">
        <p-button
          label="Send Test Notification"
          icon="pi pi-send"
          severity="secondary"
          size="small"
          [text]="true"
          [disabled]="isLoading()"
          (onClick)="sendTestNotification()">
        </p-button>
      </div>

      <!-- Browser Settings Help -->
      <div class="mt-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg" 
           *ngIf="!pushService.isSupported || pushService.permissionStatus() === 'denied'">
        <div class="flex items-start gap-2">
          <i class="pi pi-info-circle text-blue-500 mt-1"></i>
          <div class="text-xs text-surface-600 dark:text-surface-400">
            <p class="font-medium mb-1">Enable Notifications:</p>
            <ol class="list-decimal list-inside space-y-1">
              <li>Click the lock/shield icon in the address bar</li>
              <li>Set "Notifications" to "Allow"</li>
              <li>Refresh the page</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .notification-preferences {
      min-width: 280px;
    }
  `]
})
export class NotificationPreferencesComponent {
  pushService = inject(PushNotificationService);
  
  // Use the service's reactive signals directly
  isSubscribed = this.pushService.isSubscribed;
  isLoading = signal(false);
  messageNotifications = model(false);
  groupNotifications = signal(true);

  constructor() {
    // Load preferences from localStorage
    this.loadPreferences();
  }

  async onTogglePushNotifications(event: any) {
    this.isLoading.set(true);
    
    try {
      if (event.checked) {
        await this.pushService.requestPermissionAndSubscribe();
      } else {
        await this.pushService.unsubscribe();
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  onToggleMessageNotifications(event: any) {
    this.messageNotifications.set(event.checked);
    this.savePreferences();
  }

  onToggleGroupNotifications(event: any) {
    this.groupNotifications.set(event.checked);
    this.savePreferences();
  }

  async sendTestNotification() {
    this.isLoading.set(true);
    try {
      await this.pushService.sendTestNotification();
    } finally {
      this.isLoading.set(false);
    }
  }

  private loadPreferences(): void {
    const preferences = localStorage.getItem('notificationPreferences');
    if (preferences) {
      try {
        const parsed = JSON.parse(preferences);
        this.messageNotifications.set(parsed.messageNotifications ?? true);
        this.groupNotifications.set(parsed.groupNotifications ?? true);
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      }
    }
  }

  private savePreferences(): void {
    const preferences = {
      messageNotifications: this.messageNotifications(),
      groupNotifications: this.groupNotifications()
    };
    localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
  }

  getNotificationPreferences() {
    return {
      messageNotifications: this.messageNotifications(),
      groupNotifications: this.groupNotifications()
    };
  }
}
