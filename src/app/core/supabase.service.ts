import {Injectable} from '@angular/core';
import {createClient, SupabaseClient} from '@supabase/supabase-js';
import {environment} from '../../environments/environment';

let refreshFn: () => Promise<void> = () => Promise.resolve();

export function setRefreshFn(fn: () => Promise<void>) {
    refreshFn = fn;
}

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
            environment.supabaseKey,
            {
                global: {
                    fetch: async (input: URL | RequestInfo, init?: RequestInit) => {
                        const response = await fetch(input, init);

                        if (response.status === 401) {
                            const cloned = response.clone();
                            try {
                                const body = await cloned.json();
                                if (body?.code === 'PGRST303') {
                                    await refreshFn();
                                    return fetch(input, init);
                                }
                            } catch {
                                // Not JSON, ignore
                            }
                        }

                        return response;
                    }
                }
            }
        );
    }

    getClient(): SupabaseClient {
        return this.supabase;
    }
}
