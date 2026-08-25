import {Routes} from '@angular/router';
import {LoginComponent} from './features/login/login.component';
import {authGuard, guestGuard} from './core/auth/auth.guard';
import {isDevMode} from '@angular/core';

export const routes: Routes = [
    {
        path: 'connexion',
        component: LoginComponent,
        canActivate: [guestGuard],
    },
    {
        path: '',
        canActivate: [authGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
            },
            {
                path: 'transactions',
                loadComponent: () => import('./features/transactions/transactions-listing.component').then(m => m.TransactionsListingComponent),
            },
            {
                path: 'objectifs',
                loadComponent: () => import('./features/saving-goals/savings-goals-listing.component').then(m => m.SavingsGoalsListingComponent),
            },
            {
                path: 'vue-annuelle',
                loadComponent: () => import('./features/yearly-view/yearly-view.component').then(m => m.YearlyViewComponent),
            },
            {
                path: 'parametres',
                loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
            },
        ],
    },
    ...(isDevMode() ? [
        {
            path: 'style-guide',
            loadComponent: () => import('./features/style-guide/style-guide.component').then(m => m.StyleGuideComponent),
        }
    ] : []),
    {
        path: '**',
        redirectTo: 'connexion',
    },
];
