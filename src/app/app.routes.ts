import { Routes } from '@angular/router';

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
        loadComponent: () => import('./pages/layout/layout').then(m => m.Layout),
        children: [
            {
                path: 'messenger',
                loadComponent: () => import('./pages/messenger/messenger').then(m => m.Messenger)
            }
        ]
    },
    // {
    //     path: '',
    //     redirectTo: 'login',
    //     pathMatch: 'full'
    // }
];
