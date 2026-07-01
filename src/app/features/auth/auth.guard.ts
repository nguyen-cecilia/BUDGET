import {inject} from '@angular/core';
import {Router, CanActivateFn} from '@angular/router';
import {AuthService} from './auth.service';
import {firstValueFrom} from 'rxjs';

export const authGuard: CanActivateFn = async (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const isAuthenticated = await firstValueFrom(authService.isAuthenticated$);

    if (isAuthenticated) {
        return true;
    }

    await router.navigate(['login'], {queryParams: {returnUrl: state.url}});
    return false;
};
