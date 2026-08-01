import {inject, Injectable, signal} from '@angular/core';
import {SupabaseService} from '../../core/supabase.service';
import {Account} from './account.model';

const ACCOUNTS_TABLE = 'accounts';

@Injectable({
    providedIn: 'root',
})
export class AccountService {
    private supabaseService = inject(SupabaseService);
    private supabase = this.supabaseService.getClient();

    accountRefreshTrigger = signal<boolean>(false);

    async getAllAccountsByUser(userId: string, includeInactive = false): Promise<Account[]> {
        let query = this.supabase
            .from(ACCOUNTS_TABLE)
            .select('*')
            .eq('user_id', userId);

        if (!includeInactive) {
            query = query.eq('is_active', true);
        }

        const {data, error} = await query
            .order('is_default', {ascending: false})
            .order('label', {ascending: true});

        if (error) {
            console.error('Erreur lors de la récupération des comptes:', error);
            throw error;
        }

        return data;
    }

    async createAccount(userId: string, account: {
        label: string,
        is_active: boolean,
        is_default: boolean,
    }): Promise<Account> {
        const {data, error} = await this.supabase
            .from(ACCOUNTS_TABLE)
            .insert([
                {
                    user_id: userId,
                    label: account.label,
                    is_active: account.is_active,
                    is_default: account.is_default,
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Erreur lors de la création du compte:', error);
            throw error;
        }

        return data;
    }

    async updateAccount(id: string, userId: string, account: {
        label: string;
        is_active: boolean;
        is_default: boolean;
    }): Promise<Account> {
        const {data, error} = await this.supabase
            .from(ACCOUNTS_TABLE)
            .update({
                label: account.label,
                is_active: account.is_active,
                is_default: account.is_default,
            })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        return data;
    }
}
