import {inject, Injectable} from '@angular/core';
import {SupabaseService} from '../../core/supabase.service';
import {Account} from './account.model';

const ACCOUNTS_TABLE = 'accounts';

@Injectable({
    providedIn: 'root',
})
export class AccountService {
    private supabaseService = inject(SupabaseService);
    private supabase = this.supabaseService.getClient();

    async getAllAccountsByUser(userId: string): Promise<Account[]> {
        const {data, error} = await this.supabase
            .from(ACCOUNTS_TABLE)
            .select('*')
            .eq('user_id', userId)
            .order('label', {ascending: true})
        ;

        if (error) {
            console.error('Erreur lors de la récupération des catégories:', error);
            throw error;
        }

        return data;
    }
}
