import {inject, Injectable, signal} from '@angular/core';
import {SupabaseService} from '../../core/supabase.service';
import {SavingsGoal} from './savings-goal.model';

const SAVINGS_GOALS_TABLE = 'savings_goals';

@Injectable({
    providedIn: 'root',
})
export class SavingsGoalService {
    private supabaseService = inject(SupabaseService);
    private supabase = this.supabaseService.getClient();

    goalRefreshTrigger = signal<boolean>(false);

    async getAllSavingsGoalsByUser(userId: string): Promise<SavingsGoal[]> {
        const {data, error} = await this.supabase
            .from(SAVINGS_GOALS_TABLE)
            .select(`
                *,
                currency:currencies(label, code, symbol)
            `)
            .eq('user_id', userId)
            .order('label', {ascending: true})
        ;

        if (error) {
            console.error('Erreur lors de la récupération des objectifs:', error);
            throw error;
        }

        return data;
    }

    async getRecentSavingsGoals(userId: string, limit = 3): Promise<SavingsGoal[]> {
        const {data, error} = await this.supabase
            .from(SAVINGS_GOALS_TABLE)
            .select(`
            *,
            currency:currencies(label, code, symbol)
        `)
            .eq('user_id', userId)
            .order('created_at', {ascending: false})
            .limit(limit);

        if (error) {
            console.error('Erreur lors de la récupération des objectifs:', error);
            throw error;
        }

        return data || [];
    }

    async createSavingsGoal(userId: string, goal: {
        label: string,
        target_amount: number,
        current_amount: number,
        amount_per_month: number,
        currency_id: string,
    }): Promise<SavingsGoal> {
        const {data, error} = await this.supabase
            .from(SAVINGS_GOALS_TABLE)
            .insert([
                {
                    user_id: userId,
                    label: goal.label,
                    target_amount: goal.target_amount,
                    current_amount: goal.current_amount,
                    amount_per_month: goal.amount_per_month,
                    currency_id: goal.currency_id,
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Erreur lors de la création de l\'objectif:', error);
            throw error;
        }

        return data;
    }

    async updateSavingsGoal(id: string, userId: string, goal: {
        label: string;
        target_amount: number;
        current_amount: number;
        amount_per_month: number;
        currency_id: string;
    }): Promise<SavingsGoal> {
        const {data, error} = await this.supabase
            .from(SAVINGS_GOALS_TABLE)
            .update({
                label: goal.label,
                target_amount: goal.target_amount,
                current_amount: goal.current_amount,
                amount_per_month: goal.amount_per_month,
                currency_id: goal.currency_id,
            })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        return data;
    }

    async deleteSavingsGoal(id: string, userId: string): Promise<void> {
        const {error} = await this.supabase
            .from(SAVINGS_GOALS_TABLE)
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        if (error) throw error;
    }
}
