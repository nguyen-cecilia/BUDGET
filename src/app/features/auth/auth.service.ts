import {inject, Injectable} from "@angular/core";
import {SupabaseService} from "../../core/supabase.service";
import {BehaviorSubject, Observable} from "rxjs";

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private supabaseService = inject(SupabaseService);
    private supabase = this.supabaseService.getClient();
    private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
    public isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();

    constructor() {
        this.initializeAuth();
    }

    private async initializeAuth(): Promise<void> {
        const {data} = await this.supabase.auth.getSession();
        this.isAuthenticatedSubject.next(!!data.session);

        this.supabase.auth.onAuthStateChange((event, session) => {
            this.isAuthenticatedSubject.next(!!session);
        });
    }

    async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
        try {
            const {error} = await this.supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return {success: false, error: error.message};
            }

            return {success: true};
        } catch (err) {
            return {success: false, error: 'Une erreur est survenue'};
        }
    }

    async logout(): Promise<void> {
        await this.supabase.auth.signOut();
    }

    isAuthenticated(): boolean {
        return this.isAuthenticatedSubject.value;
    }

    getSession() {
        return this.supabase.auth.getSession();
    }
}
