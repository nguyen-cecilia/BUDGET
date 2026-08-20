import {inject, Injectable, signal} from '@angular/core';
import {CURRENCIES_TABLE, SupabaseService, USERS_CURRENCIES_TABLE} from '../../core/supabase.service';
import {Currency, UserCurrencies} from './currency.model';

@Injectable({
    providedIn: 'root',
})
export class CurrencyService {
    private supabaseService = inject(SupabaseService);
    private supabase = this.supabaseService.getClient();

    currencyRefreshTrigger = signal(false);

    defaultCurrency = signal<string>('EUR');
    private baseCode = signal<string>('');
    private rates = signal<Record<string, number> | null>(null);

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

    async refreshRates(baseCode: string): Promise<void> {
        this.defaultCurrency.set(baseCode);

        if (this.baseCode() === baseCode && this.rates()) return;

        const cacheKey = `budget.rates.${baseCode}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const {fetchedAt, rates} = JSON.parse(cached);
            if (Date.now() - fetchedAt < 24 * 60 * 60 * 1000) {
                this.baseCode.set(baseCode);
                this.rates.set(rates);
                return;
            }
        }

        try {
            const res = await fetch(`https://api.frankfurter.dev/v2/rates?base=${baseCode}`);
            const data = await res.json();
            const rates = Array.isArray(data)
                ? Object.fromEntries(data.map(r => [r.quote, Number(r.rate)]))
                : data.rates;
            localStorage.setItem(cacheKey, JSON.stringify({fetchedAt: Date.now(), rates}));
            this.baseCode.set(baseCode);
            this.rates.set(rates);
        } catch (error) {
            console.error('Erreur de récupération des taux:', error);
        }
    }

    convertToDefault(amount: number, fromCode: string): number {
        const rates = this.rates();
        if (!rates || fromCode === this.baseCode()) return amount;
        const rate = rates[fromCode];
        return rate ? amount / rate : amount;
    }

    canConvert(fromCode: string): boolean {
        if (fromCode === this.defaultCurrency()) return true;
        const rates = this.rates();
        return !!rates && rates[fromCode] != null;
    }

    async loadDefaultCurrency(userId: string): Promise<void> {
        const currencies = await this.getUserCurrencies(userId);
        const def = currencies.find(c => c.is_default) ?? currencies[0];
        await this.refreshRates(def?.code ?? 'EUR');
    }
}
