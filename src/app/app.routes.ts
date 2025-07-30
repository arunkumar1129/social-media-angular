import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./pages/login/login').then(m => m.Login)
    },
    {
        path: 'register',
        loadComponent: () => import('./pages/register/register').then(m => m.Register)
    },
    {
        path: '',
        redirectTo: 'messenger',
        pathMatch: 'full'
    },
    {
        path: '',
        loadComponent: () => import('./pages/layout/layout').then(m => m.Layout),
        canActivateChild: [authGuard],
        children: [
            {
                path: 'messenger',
                loadComponent: () => import('./pages/messenger/messenger').then(m => m.Messenger)
            }
        ]
    }
];
