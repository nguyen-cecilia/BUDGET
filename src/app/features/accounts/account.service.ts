import {inject, Injectable} from '@angular/core';
import {
    ACCOUNT_BALANCES_TABLE,
    ACCOUNTS_TABLE,
    SUBSCRIPTIONS_TABLE,
    SupabaseService,
    TRANSACTIONS_TABLE
} from '../../core/supabase.service';
import {Account} from './account.model';

@Injectable({
    providedIn: 'root',
})
export class AccountService {
    private supabaseService = inject(SupabaseService);
    private supabase = this.supabaseService.getClient();

    async getAllAccountsByUser(userId: string, includeInactive = false): Promise<Account[]> {
        let query = this.supabase
            .from(ACCOUNTS_TABLE)
            .select('*, currency:currencies(id, code, label, symbol)')
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
        currency_id: string | null,
    }): Promise<Account> {
        const {data, error} = await this.supabase
            .from(ACCOUNTS_TABLE)
            .insert([
                {
                    user_id: userId,
                    label: account.label,
                    is_active: account.is_active,
                    is_default: account.is_default,
                    currency_id: account.currency_id,
                }
            ])
            .select('*, currency:currencies(id, code, label, symbol)')
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
        currency_id: string | null;
    }): Promise<Account> {
        const {data, error} = await this.supabase
            .from(ACCOUNTS_TABLE)
            .update({
                label: account.label,
                is_active: account.is_active,
                is_default: account.is_default,
                currency_id: account.currency_id,
            })
            .eq('id', id)
            .eq('user_id', userId)
            .select('*, currency:currencies(id, code, label, symbol)')
            .single();

        if (error) throw error;

        return data;
    }

    async deleteAllAccounts(userId: string): Promise<void> {
        await this.supabase
            .from(TRANSACTIONS_TABLE)
            .update({account_id: null})
            .eq('user_id', userId)
            .not('account_id', 'is', null);

        await this.supabase
            .from(SUBSCRIPTIONS_TABLE)
            .update({account_id: null})
            .eq('user_id', userId)
            .not('account_id', 'is', null);

        await this.supabase
            .from(ACCOUNT_BALANCES_TABLE)
            .delete()
            .eq('user_id', userId);

        const {error} = await this.supabase
            .from(ACCOUNTS_TABLE)
            .delete()
            .eq('user_id', userId);

        if (error) throw error;
    }
}
