import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./pages/login/login').then(m => m.Login),
        title: 'Login | Talkio'
    },
    {
        path: 'register',
        loadComponent: () => import('./pages/register/register').then(m => m.Register),
        title: 'Register | Talkio'
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
                loadComponent: () => import('./pages/messenger/messenger').then(m => m.Messenger),
                title: 'Messenger | Talkio'
            },
            {
                path: 'profile',
                loadComponent: () => import('./pages/profile/profile').then(m => m.Profile),
                title: 'Profile | Talkio'
            }
        ]
    }
];
