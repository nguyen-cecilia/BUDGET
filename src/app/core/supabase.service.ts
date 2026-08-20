import {Injectable} from '@angular/core';
import {createClient, SupabaseClient} from '@supabase/supabase-js';
import {environment} from '../../environments/environment';

export const ACCOUNTS_TABLE = 'accounts';
export const CATEGORIES_TABLE = 'categories';
export const CURRENCIES_TABLE = 'currencies';
export const SAVINGS_GOALS_TABLE = 'savings_goals';
export const SUBSCRIPTIONS_TABLE = 'subscriptions';
export const TAGS_TABLE = 'tags';
export const TRANSACTION_TAGS_TABLE = 'transaction_tags';
export const TRANSACTIONS_TABLE = 'transactions';
export const USERS_CURRENCIES_TABLE = 'users_currencies';

@Injectable({
    providedIn: 'root',
})
export class SupabaseService {
    protected readonly supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(
            environment.supabaseUrl,
            environment.supabaseKey
        );
    }

    getClient(): SupabaseClient {
        return this.supabase;
    }
}
