import {Routes} from '@angular/router';
import {LoginComponent} from './features/login/login.component';
import {authGuard} from './features/auth/auth.guard';
import {DashboardComponent} from './features/dashboard/dashboard.component';
import {TransactionsListingComponent} from './features/transactions/transactions-listing.component';

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
                component: DashboardComponent,
            },
            {
                path: 'vue-annuelle',
                component: DashboardComponent,
            },
            {
                path: 'parametres',
                component: DashboardComponent,
            },
        ],
    },
    {
        path: '**',
        redirectTo: 'connexion',
    },
];
