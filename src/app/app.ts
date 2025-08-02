import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected title = 'Talkio';
  sidebarVisible = false;
  ngOnInit() {
    // The NotificationIntegrationService is automatically initialized
    // and will handle auth state changes and push notifications
  }
}
