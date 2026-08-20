import {inject, Injectable, signal} from '@angular/core';
import {CATEGORIES_TABLE, SUBSCRIPTIONS_TABLE, SupabaseService, TRANSACTIONS_TABLE} from '../../core/supabase.service';
import {Category, CategoryType} from './category.model';

@Injectable({
    providedIn: 'root',
})
export class CategoryService {
    private supabaseService = inject(SupabaseService);
    private supabase = this.supabaseService.getClient();

    categoryRefreshTrigger = signal<boolean>(false);

    async getAllCategoriesByUser(userId: string): Promise<Category[]> {
        const {data, error} = await this.supabase
            .from(CATEGORIES_TABLE)
            .select('*')
            .eq('user_id', userId)
            .order('label', {ascending: true})
        ;

        if (error) {
            console.error('Erreur lors de la récupération des catégories:', error);
            throw error;
        }

        return data;
    }

    async createCategory(userId: string, category: {
        label: string;
        color: string;
        type: CategoryType;
    }): Promise<Category> {
        const {data, error} = await this.supabase
            .from(CATEGORIES_TABLE)
            .insert([{
                user_id: userId,
                label: category.label,
                color: category.color,
                type: category.type,
            }])
            .select()
            .single()
        ;

        if (error) throw error;

        return data;
    }

    async updateCategory(id: string, userId: string, category: {
        label: string;
        color: string;
        type: CategoryType;
    }): Promise<Category> {
        const {data, error} = await this.supabase
            .from(CATEGORIES_TABLE)
            .update({
                label: category.label,
                color: category.color,
                type: category.type,
            })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        return data;
    }

    async deleteCategory(userId: string, id: string, reassignTo: string | null): Promise<void> {
        await this.supabase
            .from(TRANSACTIONS_TABLE)
            .update({category_id: reassignTo})
            .eq('category_id', id)
            .eq('user_id', userId);

        await this.supabase
            .from(SUBSCRIPTIONS_TABLE)
            .update({category_id: reassignTo})
            .eq('category_id', id)
            .eq('user_id', userId);

        await this.supabase
            .from(CATEGORIES_TABLE)
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
    }

    async deleteAllCategories(userId: string): Promise<void> {
        await this.supabase
            .from(TRANSACTIONS_TABLE)
            .update({category_id: null})
            .eq('user_id', userId)
            .not('category_id', 'is', null);

        await this.supabase
            .from(SUBSCRIPTIONS_TABLE)
            .update({category_id: null})
            .eq('user_id', userId)
            .not('category_id', 'is', null);

        const {error} = await this.supabase
            .from(CATEGORIES_TABLE)
            .delete()
            .eq('user_id', userId);

        if (error) throw error;
    }
}
