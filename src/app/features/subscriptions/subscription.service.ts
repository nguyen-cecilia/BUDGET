import {inject, Injectable, signal} from '@angular/core';
import {SupabaseService} from '../../core/supabase.service';
import {Subscription} from './subscription.model';

const SUBSCRIPTIONS_TABLE = 'subscriptions';

@Injectable({
    providedIn: 'root',
})
export class SubscriptionService {
    private supabaseService = inject(SupabaseService);
    private supabase = this.supabaseService.getClient();

    subscriptionRefreshTrigger = signal<boolean>(false);

    async getAllSubscriptionsByUser(userId: string, includeInactive = false): Promise<Subscription[]> {
        let query = this.supabase
            .from(SUBSCRIPTIONS_TABLE)
            .select(`
                *,
                category:categories(label, color),
                account:accounts(label),
                currency:currencies(code, label, symbol)
            `)
            .eq('user_id', userId)
        ;

        if (!includeInactive) {
            query = query.eq('is_active', true);
        }

        const {data, error} = await query
            .order('is_active', {ascending: false})
            .order('label', {ascending: true})
        ;

        if (error) {
            console.error('Erreur lors de la récupération des abonnements:', error);
            throw error;
        }

        return data;
    }

    async createSubscription(userId: string, subscription: {
        label: string;
        next_payment_date: string;
        is_active: boolean;
        account_id: string;
        category_id: string | null;
        frequency: string;
        amount: number;
        currency_id: string;
    }): Promise<Subscription> {
        const {data, error} = await this.supabase
            .from(SUBSCRIPTIONS_TABLE)
            .insert([
                {
                    user_id: userId,
                    label: subscription.label,
                    next_payment_date: subscription.next_payment_date,
                    is_active: subscription.is_active,
                    account_id: subscription.account_id,
                    category_id: subscription.category_id,
                    frequency: subscription.frequency,
                    amount: subscription.amount,
                    currency_id: subscription.currency_id,
                }
            ])
            .select()
            .single()
        ;

        if (error) {
            console.error('Erreur lors de la création de l\'abonnement:', error);
            throw error;
        }

        return data;
    }

    async updateSubscription(id: string, data: {
        next_payment_date?: string;
        is_active?: boolean;
        account_id?: string;
        category_id?: string | null;
        frequency?: string;
        amount?: number;
        currency_id?: string;
        label?: string;
    }): Promise<Subscription> {
        const {data: result, error} = await this.supabase
            .from(SUBSCRIPTIONS_TABLE)
            .update(data)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return result;
    }

    async getSubscriptionById(id: string): Promise<Subscription> {
        const {data, error} = await this.supabase
            .from(SUBSCRIPTIONS_TABLE)
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    }

    async deleteSubscription(id: string, userId: string): Promise<void> {
        const {error} = await this.supabase
            .from(SUBSCRIPTIONS_TABLE)
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        if (error) throw error;
    }

    computeNextDate(frequency: string): string {
        return this.computeNextDateFrom(this.formatDate(new Date()), frequency);
    }

    computeNextDateFrom(date: string, frequency: string): string {
        const dayPart = date.slice(0, 10);
        const base = new Date(dayPart + 'T00:00:00');
        return this.computeNextDateFromDate(base, frequency);
    }

    private computeNextDateFromDate(base: Date, frequency: string): string {
        let next: Date;

        switch (frequency) {
            case 'daily':
                next = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1);
                break;
            case 'weekly':
                next = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 7);
                break;
            case 'monthly': {
                const nextMonth = new Date(base.getFullYear(), base.getMonth() + 2, 0);
                const day = Math.min(base.getDate(), nextMonth.getDate());
                next = new Date(base.getFullYear(), base.getMonth() + 1, day);
                break;
            }
            case 'yearly':
                next = new Date(base.getFullYear() + 1, base.getMonth(), base.getDate());
                break;
            default:
                next = new Date(base.getFullYear(), base.getMonth() + 1, base.getDate());
        }

        return this.formatDate(next);
    }

    private formatDate(date: Date): string {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    getSubscriptionLabel(frequency: string): string | null {
        switch (frequency) {
            case 'daily':
                return 'Journalier';
            case 'weekly':
                return 'Hebdomadaire';
            case 'monthly': {
                return 'Mensuel';
            }
            case 'yearly':
                return 'Annuel';
            default:
                return null;
        }
    }
}
