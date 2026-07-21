import {inject, Injectable} from '@angular/core';
import {SupabaseService} from '../../core/supabase.service';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private supabase = inject(SupabaseService);

    async signInWithPassword(email: string, password: string) {
        return this.supabase.getClient().auth.signInWithPassword({email, password});
    }

    async signInWithOtp(email: string) {
        return this.supabase.getClient().auth.signInWithOtp({email});
    }

    async signOut() {
        return this.supabase.getClient().auth.signOut();
    }

    async updatePassword(newPassword: string) {
        return this.supabase.getClient().auth.updateUser({password: newPassword});
    }
}
