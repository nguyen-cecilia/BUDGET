import {inject, Injectable, signal} from '@angular/core';
import {SupabaseService} from '../../core/supabase.service';
import {Currency, UserCurrencies} from './currency.model';

const CURRENCIES_TABLE = 'currencies';
const USERS_CURRENCIES_TABLE = 'users_currencies';

@Injectable({
    providedIn: 'root',
})
export class CurrencyService {
    private supabaseService = inject(SupabaseService);
    private supabase = this.supabaseService.getClient();

    currencyRefreshTrigger = signal(false);

    async getAllCurrencies(): Promise<Currency[]> {
        const {data, error} = await this.supabase
            .from(CURRENCIES_TABLE)
            .select('*')
            .order('label', {ascending: true});

        if (error) {
            console.error('Erreur lors de la récupération des devises:', error);
            throw error;
        }

        return data;
    }

    async getUserCurrencies(userId: string): Promise<UserCurrencies[]> {
        const {data, error} = await this.supabase
            .from(USERS_CURRENCIES_TABLE)
            .select(`
                *,
                currency:currencies(id, code, label, symbol)
            `)
            .eq('user_id', userId)
            .order('is_default', {ascending: false});

        if (error) {
            console.error('Erreur lors de la récupération des devises:', error);
            throw error;
        }

        return data.map(row => ({
            currency_id: row.currency_id,
            user_id: row.user_id,
            is_default: row.is_default,
            code: row.currency.code,
            label: row.currency.label,
            symbol: row.currency.symbol,
        }));
    }

    async createUserCurrency(userId: string, currencyId: string, isDefault = false): Promise<UserCurrencies> {
        if (isDefault) {
            await this.supabase
                .from(USERS_CURRENCIES_TABLE)
                .update({is_default: false})
                .eq('user_id', userId)
                .eq('is_default', true);
        }

        const {data, error} = await this.supabase
            .from(USERS_CURRENCIES_TABLE)
            .insert([{
                user_id: userId,
                currency_id: currencyId,
                is_default: isDefault,
            }])
            .select('*, currency:currencies(id, code, label, symbol)')
            .single();

        if (error) {
            console.error('Erreur lors de la création de la devise:', error);
            throw error;
        }

        return {
            currency_id: data.currency_id,
            user_id: data.user_id,
            is_default: data.is_default,
            code: data.currency.code,
            label: data.currency.label,
            symbol: data.currency.symbol,
        };
    }

    async updateUserCurrency(currencyId: string, userId: string, isDefault: boolean): Promise<UserCurrencies> {
        if (isDefault) {
            await this.supabase
                .from(USERS_CURRENCIES_TABLE)
                .update({is_default: false})
                .eq('user_id', userId)
                .eq('is_default', true);
        }
        const {data, error} = await this.supabase
            .from(USERS_CURRENCIES_TABLE)
            .update({is_default: isDefault})
            .eq('currency_id', currencyId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        return data;
    }

    async deleteUserCurrency(currencyId: string, userId: string): Promise<void> {
        const {error} = await this.supabase
            .from(USERS_CURRENCIES_TABLE)
            .delete()
            .eq('currency_id', currencyId)
            .eq('user_id', userId);
        if (error) throw error;
    }
}
