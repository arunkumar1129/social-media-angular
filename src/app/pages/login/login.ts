import { Component, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../../services/auth';
import { TokenRequest } from '../../models/user.model';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [
    RouterLink,
    InputText,
    Password,
    Button,
    Checkbox,
    ReactiveFormsModule,
    NgOptimizedImage
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  loginForm = new FormGroup({
    username: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)])
  });

  authService = inject(Auth);
  router = inject(Router);
  token = this.authService.token;

  loginEffect = effect(() => {
    if (this.token()) {
      this.router.navigate(['/messenger']);
    }
  })

  login() {
    this.authService.login(this.loginForm.value as TokenRequest).subscribe();
  }
}
