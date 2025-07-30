import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const authGuard: CanActivateChildFn = (childRoute, state) => {
  const token = inject(Auth).token;
  if (!token()) {
    inject(Router).navigate(['login']);
    return false;
  }
  return !!token();
};
