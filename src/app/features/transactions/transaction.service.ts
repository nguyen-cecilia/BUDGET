import {inject, Injectable} from '@angular/core';
import {SupabaseService} from '../../core/supabase.service';
import {Transaction, TransactionsByDay, TransactionsByMonth} from './transaction.model';

const TRANSACTIONS_TABLE = 'transactions';

@Injectable({
    providedIn: 'root',
})
export class TransactionService {
    private supabaseService = inject(SupabaseService);
    private supabase = this.supabaseService.getClient();

    async getTransactionsByCurrentMonth(userId: string): Promise<TransactionsByMonth> {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const startDate = this.formatDate(firstDay);
        const endDate = this.formatDate(lastDay);

        const {data, error} = await this.supabase
            .from(TRANSACTIONS_TABLE)
            .select(`
                *,
                account:accounts(id, label),
                category:categories(id, label, color),
                currency:currencies(id, code, label),
                tags(id, label)
            `)
            .eq('user_id', userId)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', {ascending: false})
        ;

        if (error) {
            console.error('Erreur lors de la récupération des transactions:', error);
            throw error;
        }

        return this.groupByMonth(data || []);
    }

    async getTransactionsByMonth(userId: string, monthIndex: number, year: number): Promise<TransactionsByMonth> {
        const firstDay = new Date(year, monthIndex, 1);
        const lastDay = new Date(year, monthIndex + 1, 0);

        const startDate = this.formatDate(firstDay);
        const endDate = this.formatDate(lastDay);

        const {data, error} = await this.supabase
            .from(TRANSACTIONS_TABLE)
            .select(`
                *,
                account:accounts(id, label),
                category:categories(id, label, color),
                currency:currencies(id, code, label),
                tags(id, label)
            `)
            .eq('user_id', userId)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', {ascending: false})
        ;

        if (error) {
            console.error('Erreur lors de la récupération des transactions:', error);
            throw error;
        }

        return this.groupByMonth(data || []);
    }

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private getMostUsedCurrency(transactions: Transaction[]): string {
        if (transactions.length === 0) return '';

        const currencyCount = new Map<string, number>();

        transactions.forEach(transaction => {
            const currency = transaction.currency.code;
            currencyCount.set(currency, (currencyCount.get(currency) || 0) + 1);
        });

        let mostUsedCurrency = '';
        let maxCount = 0;

        currencyCount.forEach((count, currency) => {
            if (count > maxCount) {
                maxCount = count;
                mostUsedCurrency = currency;
            }
        });

        return mostUsedCurrency;
    }

    private groupByDay(transactions: Transaction[]): TransactionsByDay[] {
        const grouped = new Map<string, Transaction[]>();

        transactions.forEach(transaction => {
            const dateStr = transaction.date.split('T')[0];
            if (!grouped.has(dateStr)) {
                grouped.set(dateStr, []);
            }
            grouped.get(dateStr)!.push(transaction);
        });

        return Array.from(grouped.entries())
            .map(([date, transactionList]) => ({
                date,
                transactions: transactionList,
                total_amount: transactionList.reduce((sum, t) => {
                    return t.type === 'expense' ? sum - t.amount : sum + t.amount;
                }, 0),
                total_amount_currency: this.getMostUsedCurrency(transactionList)
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    private groupByMonth(transactions: Transaction[]): TransactionsByMonth {
        console.log(transactions);
        const transactionsByDay = this.groupByDay(transactions);

        let transactionsByMonth = {
            month: '',
            count: 0,
            transactionsByDay: transactionsByDay,
        };

        if (transactions.length > 0) {
            const firstTransaction = transactions[0];
            const date = new Date(firstTransaction.date);
            const month = date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

            const count = transactions.length;

            transactionsByMonth = {
                ...transactionsByMonth,
                month: month.charAt(0).toUpperCase() + month.slice(1),
                count: count,
            };
        }

         return transactionsByMonth;
    }
}
