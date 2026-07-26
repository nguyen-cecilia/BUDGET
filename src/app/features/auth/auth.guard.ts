import {inject} from '@angular/core';
import {Router, CanActivateFn} from '@angular/router';
import {AuthStateService} from './auth-state.service';

export const authGuard: CanActivateFn = async () => {
    const authState = inject(AuthStateService);
    const router = inject(Router);

    if (!authState.isAuthenticated()) {
        await router.navigate(['connexion']);
        return false;
    }

    return true;
};
