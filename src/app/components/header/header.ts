import { Component, effect, input, ViewChild } from '@angular/core';
import { Avatar } from 'primeng/avatar';
import { Toolbar } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { User } from '../../models/user.model';
import { ProfileMenuComponent } from '../profile-menu/profile-menu';

@Component({
  selector: 'app-header',
  imports: [
    Toolbar,
    Avatar,
    ButtonModule,
    ProfileMenuComponent
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  @ViewChild('profileMenu') profileMenuComponent!: ProfileMenuComponent;
  
  user = input<User | undefined>(undefined);

  constructor() {
    effect(() => {
      // This effect runs when the user input changes
      if (this.user()) {
        console.log('User profile loaded:', this.user());
      }
    });
  }

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
