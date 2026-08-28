import {inject, Injectable, signal} from '@angular/core';
import {User} from '@supabase/supabase-js';
import {setRefreshFn, SupabaseService} from '../supabase.service';

@Injectable({
    providedIn: 'root',
})
export class AuthStateService {
    private supabase = inject(SupabaseService);

    private userSignal = signal<User | null>(null);
    user$ = this.userSignal.asReadonly();

    private isAuthenticatedSignal = signal<boolean>(false);
    isAuthenticated$ = this.isAuthenticatedSignal.asReadonly();

    private loadingSignal = signal<boolean>(true);
    loading$ = this.loadingSignal.asReadonly();

    ready: Promise<void>;

    constructor() {
        this.ready = this.initializeAuth();
        this.setupVisibilityListener();
        setRefreshFn(() => this.refreshSession());
    }

    private async initializeAuth() {
        const {data: {session}} = await this.supabase.getClient().auth.getSession();

        if (session?.user) {
            this.userSignal.set(session.user);
            this.isAuthenticatedSignal.set(true);
        }

        this.loadingSignal.set(false);

        this.supabase.getClient().auth.onAuthStateChange(async (event, session) => {
            this.userSignal.set(session?.user ?? null);
            this.isAuthenticatedSignal.set(!!session?.user);
        });
    }

    private setupVisibilityListener() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                void this.refreshSession();
            }
        });
    }

    private async refreshSession(): Promise<void> {
        try {
            const {data: {session}, error} = await this.supabase.getClient().auth.refreshSession();
            if (error || !session) {
                this.userSignal.set(null);
                this.isAuthenticatedSignal.set(false);
            } else {
                this.userSignal.set(session.user);
                this.isAuthenticatedSignal.set(true);
            }
        } catch {
            this.userSignal.set(null);
            this.isAuthenticatedSignal.set(false);
        }
    }

    getCurrentUser(): User | null {
        return this.userSignal();
    }

    isAuthenticated(): boolean {
        return this.isAuthenticatedSignal();
    }

    isLoading(): boolean {
        return this.loadingSignal();
    }
}
