import {inject, Injectable} from '@angular/core';
import {SupabaseService} from '../../core/supabase.service';
import {Subscription} from './subscription.model';

const SUBSCRIPTIONS_TABLE = 'subscriptions';

@Injectable({
    providedIn: 'root',
})
export class SubscriptionService {
    private supabaseService = inject(SupabaseService);
    private supabase = this.supabaseService.getClient();

    async getAllSubscriptionsByUser(userId: string): Promise<Subscription[]> {
        const {data, error} = await this.supabase
            .from(SUBSCRIPTIONS_TABLE)
            .select('*')
            .eq('user_id', userId)
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
        category_id: string;
        frequency: string;
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

    async updateSubscription(id: number, data: {
        next_payment_date?: string;
        is_active?: boolean;
        account_id?: string;
        category_id?: string;
        frequency?: string;
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
}
