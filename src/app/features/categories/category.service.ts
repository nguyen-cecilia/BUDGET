import {inject, Injectable} from '@angular/core';
import {SupabaseService} from '../../core/supabase.service';
import {Category} from './category.model';

const CATEGORIES_TABLE = 'categories';

@Injectable({
    providedIn: 'root',
})
export class CategoryService {
    private supabaseService = inject(SupabaseService);
    private supabase = this.supabaseService.getClient();

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
}
