import { Component, inject, model, signal } from '@angular/core';
import { Button } from 'primeng/button';
import { ToggleButton } from 'primeng/togglebutton';
import { Divider } from 'primeng/divider';
import { PushNotificationService } from '../../services/push-notification.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-notification-preferences',
  imports: [
    Button,
    ToggleButton,
    Divider,
    FormsModule
  ],
  template: `
    <div class="space-y-2">
      <!-- Push Notifications -->
      <div class="flex items-center justify-between py-2">
        <div class="flex items-center gap-3">
          <i class="pi pi-bell text-surface-400"></i>
          <div class="flex-1">
            <div class="text-surface-900 dark:text-surface-0">Push Notifications</div>
            <div class="text-sm text-surface-500 dark:text-surface-400">Enable notifications on this device</div>
          </div>
        </div>
        <p-toggleButton
          [(ngModel)]="isSubscribed"
          onLabel="ON"
          offLabel="OFF"
          styleClass="toggle-switch"
          [disabled]="!pushService.isSupported || isLoading()"
          (onChange)="onTogglePushNotifications($event)">
        </p-toggleButton>
      </div>

      <!-- Message Notifications -->
      @if (isSubscribed()) {
        <div class="flex items-center justify-between py-2">
          <div class="flex items-center gap-3">
            <i class="pi pi-comment text-surface-400"></i>
            <div class="flex-1">
              <div class="text-surface-900 dark:text-surface-0">New Messages</div>
              <div class="text-sm text-surface-500 dark:text-surface-400">Get notified of new messages</div>
            </div>
          </div>
          <p-toggleButton
            [(ngModel)]="likesAndCommentsNotifications"
            onLabel="ON"
            offLabel="OFF"
            styleClass="toggle-switch"
            (onChange)="onToggleLikesAndComments($event)">
          </p-toggleButton>
        </div>
      }

      <!-- Group Messages -->
      @if (isSubscribed()) {
        <div class="flex items-center justify-between py-2">
          <div class="flex items-center gap-3">
            <i class="pi pi-users text-surface-400"></i>
            <div class="flex-1">
              <div class="text-surface-900 dark:text-surface-0">Group Messages</div>
              <div class="text-sm text-surface-500 dark:text-surface-400">Notifications for group conversations</div>
            </div>
          </div>
          <p-toggleButton
            [(ngModel)]="newFollowersNotifications"
            onLabel="ON"
            offLabel="OFF"
            styleClass="toggle-switch"
            (onChange)="onToggleNewFollowers($event)">
          </p-toggleButton>
        </div>
      }

      <!-- Sound -->
      @if (isSubscribed()) {
        <div class="flex items-center justify-between py-2">
          <div class="flex items-center gap-3">
            <i class="pi pi-volume-up text-surface-400"></i>
            <div class="flex-1">
              <div class="text-surface-900 dark:text-surface-0">Message Sounds</div>
              <div class="text-sm text-surface-500 dark:text-surface-400">Play sound for new messages</div>
            </div>
          </div>
          <p-toggleButton
            [(ngModel)]="directMessagesNotifications"
            onLabel="ON"
            offLabel="OFF"
            styleClass="toggle-switch"
            (onChange)="onToggleDirectMessages($event)">
          </p-toggleButton>
        </div>
      }

      <!-- Do Not Disturb -->
      <div class="flex items-center justify-between py-2">
        <div class="flex items-center gap-3">
          <i class="pi pi-moon text-surface-400"></i>
          <div class="flex-1">
            <div class="text-surface-900 dark:text-surface-0">Do Not Disturb</div>
            <div class="text-sm text-surface-500 dark:text-surface-400">Mute all notifications temporarily</div>
          </div>
        </div>
        <p-toggleButton
          [(ngModel)]="doNotDisturb"
          onLabel="ON"
          offLabel="OFF"
          styleClass="toggle-switch"
          (onChange)="onToggleDoNotDisturb($event)">
        </p-toggleButton>
      </div>
    </div>

      <p-divider></p-divider>

      <!-- Test Notification -->
      @if (isSubscribed()) {
        <div class="flex justify-center mt-3">
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
      }

      <!-- Browser Settings Help -->
      @if (!pushService.isSupported || pushService.permissionStatus() === 'denied') {
        <div class="mt-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
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
      }
  `,
  styles: [`
    :host {
      display: block;
    }
    
    :host ::ng-deep .toggle-switch {
      min-width: 60px !important;
      height: 32px !important;
      border-radius: 16px !important;
      border: 1px solid var(--p-surface-300) !important;
      background: var(--p-surface-100) !important;
      color: var(--p-surface-600) !important;
      font-size: 0.75rem !important;
      font-weight: 500 !important;
      transition: all 0.2s ease !important;
    }
    
    :host ::ng-deep .toggle-switch:hover {
      border-color: var(--p-surface-400) !important;
    }
    
    :host ::ng-deep .toggle-switch.p-togglebutton-checked {
      background: var(--p-primary-500) !important;
      border-color: var(--p-primary-500) !important;
      color: white !important;
    }
    
    :host ::ng-deep .toggle-switch.p-togglebutton-checked:hover {
      background: var(--p-primary-600) !important;
      border-color: var(--p-primary-600) !important;
    }
    
    :host ::ng-deep .toggle-switch:disabled {
      opacity: 0.6 !important;
      cursor: not-allowed !important;
    }
    
    :host ::ng-deep .toggle-switch .p-button-label {
      padding: 0 !important;
    }
  `]
})
export class NotificationPreferencesComponent {
  pushService = inject(PushNotificationService);
  
  // Use the service's reactive signals directly
  isSubscribed = this.pushService.isSubscribed;
  isLoading = signal(false);
  likesAndCommentsNotifications = signal(true);
  newFollowersNotifications = signal(true);
  directMessagesNotifications = signal(true);
  doNotDisturb = signal(false);

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

  onToggleLikesAndComments(event: any) {
    this.likesAndCommentsNotifications.set(event.checked);
    this.savePreferences();
  }

  onToggleNewFollowers(event: any) {
    this.newFollowersNotifications.set(event.checked);
    this.savePreferences();
  }

  onToggleDirectMessages(event: any) {
    this.directMessagesNotifications.set(event.checked);
    this.savePreferences();
  }

  onToggleDoNotDisturb(event: any) {
    this.doNotDisturb.set(event.checked);
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
        this.likesAndCommentsNotifications.set(parsed.likesAndComments ?? true);
        this.newFollowersNotifications.set(parsed.newFollowers ?? true);
        this.directMessagesNotifications.set(parsed.directMessages ?? true);
        this.doNotDisturb.set(parsed.doNotDisturb ?? false);
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      }
    }
  }

  private savePreferences(): void {
    const preferences = {
      likesAndComments: this.likesAndCommentsNotifications(),
      newFollowers: this.newFollowersNotifications(),
      directMessages: this.directMessagesNotifications(),
      doNotDisturb: this.doNotDisturb()
    };
    localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
  }

  getNotificationPreferences() {
    return {
      likesAndComments: this.likesAndCommentsNotifications(),
      newFollowers: this.newFollowersNotifications(),
      directMessages: this.directMessagesNotifications(),
      doNotDisturb: this.doNotDisturb()
    };
  }
}
