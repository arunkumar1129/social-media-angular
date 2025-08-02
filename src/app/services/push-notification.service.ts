import { Injectable, inject, signal } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private swPush = inject(SwPush);
  private messageService = inject(MessageService);
  private http = inject(HttpClient);
  
  // Simple state management with signals
  public isSubscribed = signal<boolean>(false);
  public permissionStatus = signal<NotificationPermission>('default');

  vapidPublicKey = signal('');

  constructor() {
    this.initializePermissionStatus();
    this.checkExistingSubscription();
    this.setupMessageListeners();
  }

  /**
   * Check if push notifications are supported
   */
  get isSupported(): boolean {
    return this.swPush.isEnabled && 'Notification' in window;
  }

  /**
   * Request permission and subscribe to push notifications
   */
  async requestPermissionAndSubscribe(): Promise<boolean> {
    if (!this.isSupported) {
      this.showError('Push notifications are not supported in this browser');
      return false;
    }

    try {
      // Step 1: Request notification permission
      const permission = await Notification.requestPermission();
      this.permissionStatus.set(permission);
      
      if (permission !== 'granted') {
        this.showError('Notification permission denied');
        return false;
      }

      const vapidPublicKey = await this.getVapidPublicKey();

      // Step 2: Subscribe to push service
      const subscription = await this.swPush.requestSubscription({
        serverPublicKey: vapidPublicKey
      });

      if (subscription) {
        // Step 3: Send subscription to backend
        await this.sendSubscriptionToBackend(subscription);
        this.isSubscribed.set(true);
        this.showSuccess('Push notifications enabled successfully!');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      this.showError('Failed to enable push notifications');
      return false;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.isSupported) {
      return false;
    }

    try {
      const subscription = await firstValueFrom(this.swPush.subscription);
      
      if (subscription) {
        // Unsubscribe from service worker
        await this.swPush.unsubscribe();
        
        // Remove subscription from backend
        await this.removeSubscriptionFromBackend(subscription);
        
        this.isSubscribed.set(false);
        this.showSuccess('Push notifications disabled');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      this.showError('Failed to disable push notifications');
      return false;
    }
  }

  /**
   * Check if there's an existing subscription
   */
  private async checkExistingSubscription(): Promise<void> {
    if (this.isSupported) {
      try {
        const subscription = await firstValueFrom(this.swPush.subscription);
        this.isSubscribed.set(!!subscription);
      } catch (error) {
        console.error('Error checking subscription status:', error);
        this.isSubscribed.set(false);
      }
    }
  }

  /**
   * Initialize permission status
   */
  private initializePermissionStatus(): void {
    if ('Notification' in window) {
      this.permissionStatus.set(Notification.permission);
    }
  }

  /**
   * Setup listeners for incoming push messages and notification clicks
   */
  private setupMessageListeners(): void {
    if (!this.isSupported) return;

    // Listen for incoming push messages
    this.swPush.messages.subscribe((message: any) => {
      console.log('Push message received:', message);
      this.handleIncomingMessage(message);
    });

    // Listen for notification clicks
    this.swPush.notificationClicks.subscribe((click: any) => {
      console.log('Notification clicked:', click);
      this.handleNotificationClick(click);
    });
  }

  /**
   * Handle incoming push message
   */
  private handleIncomingMessage(message: any): void {
    if (message) {
      // Show browser notification if app is not in focus
      if (document.hidden) {
        console.log('Showing browser notification:', message);
        this.showBrowserNotification(message);
      } else {
        // Show in-app notification
        console.log('Showing in-app notification:', message);
        this.showInAppNotification(message);
      }
    }
  }

  /**
   * Handle notification click
   */
  private handleNotificationClick(click: any): void {
    // Focus the window
    if (window.focus) {
      window.focus();
    }

    // Handle specific actions based on notification data
    if (click.notification?.data) {
      const data = click.notification.data;
      
      // Navigate based on notification type
      if (data.type === 'message' && data.conversationId) {
        window.location.href = `/messenger?id=${data.conversationId}`;
      }
    }
  }

  /**
   * Display browser notification
   */
  private showBrowserNotification(notification: any): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/icons/icon-192x192.png',
        badge: notification.badge || '/icons/icon-72x72.png',
        data: notification.data,
        tag: notification.tag
      });

      // Auto-close after 10 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 10000);
    }
  }

  /**
   * Show in-app notification using PrimeNG Toast
   */
  private showInAppNotification(notification: any): void {
    this.messageService.add({
      severity: 'info',
      summary: notification.title,
      detail: notification.body,
      life: 5000
    });
  }

  /**
   * Send subscription to backend
   */
  private async sendSubscriptionToBackend(subscription: PushSubscription): Promise<void> {
    try {
      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        },
        vapidPublicKey: this.vapidPublicKey()
      };

      const response = await firstValueFrom(
        this.http.post<ApiResponse<any>>(`${environment.apiUrl}/api/notifications/push/subscribe`, subscriptionData)
      );

      if (!response.success) {
        throw new Error(response.error || response.message);
      }
    } catch (error) {
      console.error('Error sending subscription to backend:', error);
      throw error;
    }
  }

  /**
   * Remove subscription from backend
   */
  private async removeSubscriptionFromBackend(subscription: PushSubscription): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.delete<ApiResponse<any>>(`${environment.apiUrl}/api/notifications/push/unsubscribe/${subscription.endpoint}`)
      );

      if (!response.success) {
        throw new Error(response.error || response.message);
      }
    } catch (error) {
      console.error('Error removing subscription from backend:', error);
      throw error;
    }
  }

  //get vapidpublickey from server
  private async getVapidPublicKey(): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<{ publicKey: string }>>(`${environment.apiUrl}/api/notifications/vapid-public-key`)
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || response.message || 'Failed to get VAPID public key');
      }

      this.vapidPublicKey.set(response.data.publicKey);
      return response.data.publicKey;
    } catch (error) {
      console.error('Error fetching VAPID public key:', error);
      throw error;
    }
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach(byte => binary += String.fromCharCode(byte));
    return btoa(binary);
  }

  /**
   * Send a test notification (for development)
   */
  async sendTestNotification(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.post<ApiResponse<any>>(`${environment.apiUrl}/api/notifications/push/test`, {})
      );

      if (!response.success) {
        throw new Error(response.error || response.message);
      }

      this.showSuccess('Test notification sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      this.showError('Failed to send test notification');
    }
  }

  private showSuccess(message: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Push Notifications',
      detail: message,
      life: 3000
    });
  }

  private showError(message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Push Notifications',
      detail: message,
      life: 5000
    });
  }
}
