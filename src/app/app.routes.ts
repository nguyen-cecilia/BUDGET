import {Routes} from '@angular/router';
import {LoginComponent} from './features/login/login.component';
import {authGuard} from './features/auth/auth.guard';
import {DashboardComponent} from './features/dashboard/dashboard.component';
import {TransactionsComponent} from './features/transactions/transactions.component';

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
                component: TransactionsComponent,
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
        redirectTo: 'login',
    },
];
