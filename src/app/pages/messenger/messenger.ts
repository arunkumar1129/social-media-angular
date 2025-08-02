import { Component, OnInit, OnDestroy, inject, effect, untracked, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { ChatListComponent } from '../../components/chat-list/chat-list';
import { ChatWindowComponent } from '../../components/chat-window/chat-window';
import { Conversation } from '../../models/conversation.model';
import { MessageSentEvent } from '../../models/message.model';
import { ConversationService } from '../../services/conversation.service';
import { UserService } from '../../services/user-service';
import { WebSocketService } from '../../services/websocket.service';
import { DeviceService } from '../../services/device.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-messenger',
  imports: [
    CommonModule,
    TagModule,
    ChatListComponent,
    ChatWindowComponent
  ],
  templateUrl: './messenger.html',
  styleUrl: './messenger.scss'
})
export class Messenger implements OnInit, OnDestroy {
  public conversationService = inject(ConversationService);
  private userService = inject(UserService);
  private socketService = inject(WebSocketService);
  private deviceService = inject(DeviceService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  conversations = this.conversationService.conversations;
  user = this.userService.user;
  connectionStatus = this.socketService.connectionStatus;

  // Mobile state management
  showChatWindow = computed(() => this.isMobileOrTablet() && !!this.conversationService.selectedConversationId());

  // Device type getters
  isMobile = this.deviceService.isMobile;
  isTablet = this.deviceService.isTablet;
  isDesktop = this.deviceService.isDesktop;
  isMobileOrTablet = this.deviceService.isMobileOrTablet;

  constructor() {
    effect(() => {
      const selectedConversationId = this.conversationService.selectedConversationId();
      this.conversationService.isConversationRoute.set(!!selectedConversationId);
      if (selectedConversationId) {
        this.router.navigate(['messenger'], { queryParams: { id: selectedConversationId } });
      }
    });
  }

  ngOnInit() {
    this.socketService.connect();
    this.socketService.startConnectionMonitoring();
    this.loadConversations();
    const selectedConversationId = this.route.snapshot.queryParamMap.get('id');
    if (selectedConversationId) {
      this.conversationService.selectedConversationId.set(selectedConversationId);
    }
  }

  ngOnDestroy() {
    this.socketService.stopConnectionMonitoring();
  }

  private loadConversations() {
    this.conversationService.getConversations().subscribe();
  }

  onMessageSent(event: MessageSentEvent): void {
    // Message sent - no client-side notification logic needed
    // The backend will handle sending push notifications to other participants
  }

  onBackToList(): void {
    this.conversationService.selectedConversationId.set(null);
    this.router.navigate(['messenger']);
  }
}
