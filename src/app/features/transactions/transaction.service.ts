import {inject, Injectable, signal} from '@angular/core';
import {SupabaseService} from '../../core/supabase.service';
import {Transaction, TransactionsByDay, TransactionsByMonth, TransactionType} from './transaction.model';

const TRANSACTIONS_TABLE = 'transactions';
const TRANSACTION_TAGS_TABLE = 'transaction_tags';

@Injectable({
    providedIn: 'root',
})
export class TransactionService {
    private supabaseService = inject(SupabaseService);
    private supabase = this.supabaseService.getClient();

    transactionRefreshTrigger = signal<boolean>(false);

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

    async createTransaction(userId: string, transaction: {
        type: TransactionType;
        amount: number;
        amount_currency_id: string;
        label: string;
        date: string;
        account_id: string;
        category_id?: string;
        is_subscription: boolean;
        subscription_id?: number | null;
    }): Promise<Transaction> {
        const {data, error} = await this.supabase
            .from(TRANSACTIONS_TABLE)
            .insert([
                {
                    user_id: userId,
                    type: transaction.type,
                    amount: transaction.amount,
                    amount_currency_id: transaction.amount_currency_id,
                    label: transaction.label,
                    date: transaction.date,
                    account_id: transaction.account_id,
                    category_id: transaction.category_id || null,
                    is_subscription: transaction.is_subscription,
                    subscription_id: transaction.subscription_id || null,
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Erreur lors de la création de la transaction:', error);
            throw error;
        }

        return data;
    }

    async addTagsToTransaction(transactionId: string, tagIds: (string | number)[]): Promise<void> {
        const {error} = await this.supabase
            .from(TRANSACTION_TAGS_TABLE)
            .insert(tagIds.map(tagId => ({
                transaction_id: transactionId,
                tag_id: tagId
            })));

        if (error) throw error;
    }

    async updateTransaction(id: string, userId: string, transaction: {
        type: TransactionType;
        amount: number;
        amount_currency_id: string;
        label: string;
        date: string;
        account_id: string;
        category_id?: string;
        is_subscription: boolean;
        subscription_id?: number | null;
    }): Promise<Transaction> {
        const {data, error} = await this.supabase
            .from(TRANSACTIONS_TABLE)
            .update({
                type: transaction.type,
                amount: transaction.amount,
                amount_currency_id: transaction.amount_currency_id,
                label: transaction.label,
                date: transaction.date,
                account_id: transaction.account_id,
                category_id: transaction.category_id || null,
                is_subscription: transaction.is_subscription,
                subscription_id: transaction.subscription_id || null,
            })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async removeTagsFromTransaction(transactionId: string): Promise<void> {
        const {error} = await this.supabase
            .from(TRANSACTION_TAGS_TABLE)
            .delete()
            .eq('transaction_id', transactionId);

        if (error) throw error;
    }

    async deleteTransaction(id: string, userId: string): Promise<void> {
        await this.removeTagsFromTransaction(id);

        const {error} = await this.supabase
            .from(TRANSACTIONS_TABLE)
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;
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
                transactions: transactionList.sort((a, b) => {
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
                }),
                total_amount: transactionList.reduce((sum, t) => {
                    return t.type === 'expense' ? sum - t.amount : sum + t.amount;
                }, 0),
                total_amount_currency: this.getMostUsedCurrency(transactionList)
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    private groupByMonth(transactions: Transaction[]): TransactionsByMonth {
        const transactionsByDay = this.groupByDay(transactions);

        let transactionsByMonth = {
            month: '',
            count: 0,
            transactionsByDay: transactionsByDay,
        };

        if (transactions.length > 0) {
            const firstTransaction = transactions[0];
            const date = new Date(firstTransaction.date);
            const month = date.toLocaleString('fr-FR', {month: 'long', year: 'numeric'});

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
