import {Routes} from '@angular/router';
import {LoginComponent} from './features/login/login.component';
import {authGuard} from './features/auth/auth.guard';
import {DashboardComponent} from './features/dashboard/dashboard.component';
import {TransactionsListingComponent} from './features/transactions/transactions-listing.component';
import {SettingsComponent} from './features/settings/settings.component';
import {isDevMode} from '@angular/core';
import {StyleGuideComponent} from './features/style-guide/style-guide.component';
import {SavingsGoalsListingComponent} from './features/saving-goals/savings-goals-listing.component';

export const routes: Routes = [
    {
        path: 'connexion',
        component: LoginComponent,
    },
    {
        path: '',
        canActivate: [authGuard],
        children: [
            {
                path: '',
                component: DashboardComponent,
            },
            {
                path: 'transactions',
                component: TransactionsListingComponent,
            },
            {
                path: 'objectifs',
                component: SavingsGoalsListingComponent,
            },
            {
                path: 'vue-annuelle',
                component: DashboardComponent,
            },
            {
                path: 'parametres',
                component: SettingsComponent,
            },
        ],
    },
    ...(isDevMode() ? [
        {path: 'style-guide', component: StyleGuideComponent}
    ] : []),
    {
        path: '**',
        redirectTo: 'connexion',
    },
];
