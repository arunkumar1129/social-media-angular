import { Component, inject, OnInit } from '@angular/core';
import { Header } from '../../components/header/header';
import { RouterOutlet } from '@angular/router';
import { UserService } from '../../services/user-service';

@Component({
  selector: 'app-layout',
  imports: [
    Header,
    RouterOutlet
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.scss'
})
export class Layout implements OnInit {
  userService = inject(UserService);
  user = this.userService.user;

  ngOnInit(): void {
    this.userService.getUserProfile().subscribe();
  }
}
