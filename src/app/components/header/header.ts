import { Component, effect, input } from '@angular/core';
import { Avatar } from 'primeng/avatar';
import { Toolbar } from 'primeng/toolbar';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-header',
  imports: [
    Toolbar,
    Avatar
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
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
}
