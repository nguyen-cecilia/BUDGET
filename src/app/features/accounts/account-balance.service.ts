import {inject, Injectable} from '@angular/core';
import {ACCOUNT_BALANCES_TABLE, SupabaseService} from '../../core/supabase.service';
import {AccountBalance, AccountBalanceWithAccount} from './account-balance.model';

@Injectable({
    providedIn: 'root',
})
export class AccountBalanceService {
    private supabaseService = inject(SupabaseService);
    private supabase = this.supabaseService.getClient();

    async getBalancesForMonth(userId: string, year: number, month: number): Promise<AccountBalanceWithAccount[]> {
        const {data, error} = await this.supabase
            .from(ACCOUNT_BALANCES_TABLE)
            .select(`
                *,
                account:accounts(
                    id,
                    label,
                    currency:currencies(id, code, label, symbol)
                )
            `)
            .eq('user_id', userId)
            .eq('year', year)
            .eq('month', month);

        if (error) {
            console.error('Erreur lors de la récupération des soldes:', error);
            throw error;
        }

        return data.map(row => ({
            ...row,
            account: {
                ...row.account,
                currency: row.account.currency,
            },
        }));
    }

    async upsertBalance(
        userId: string,
        accountId: string,
        year: number,
        month: number,
        balance: number,
    ): Promise<AccountBalance> {
        const {data, error} = await this.supabase
            .from(ACCOUNT_BALANCES_TABLE)
            .upsert(
                {
                    user_id: userId,
                    account_id: accountId,
                    year,
                    month,
                    balance,
                },
                {onConflict: 'user_id,account_id,year,month'}
            )
            .select()
            .single();

        if (error) {
            console.error('Erreur lors de la mise à jour du solde:', error);
            throw error;
        }

        return data;
    }

    async deleteAllBalances(userId: string): Promise<void> {
        const {error} = await this.supabase
            .from(ACCOUNT_BALANCES_TABLE)
            .delete()
            .eq('user_id', userId);

        if (error) throw error;
    }
}
