import {inject, Injectable} from '@angular/core';
import {SupabaseService} from '../../core/supabase.service';
import {Tag} from './tag.model';

const TAGS_TABLE = 'tags';

@Injectable({
    providedIn: 'root',
})
export class TagService {
    private supabaseService = inject(SupabaseService);
    private supabase = this.supabaseService.getClient();

    async getAllTagsByUser(userId: string): Promise<Tag[]> {
        const {data, error} = await this.supabase
            .from(TAGS_TABLE)
            .select('*')
            .eq('user_id', userId)
            .order('label', {ascending: true})
        ;

        if (error) {
            console.error('Erreur lors de la récupération des tags:', error);
            throw error;
        }

        return data;
    }

    async createTag(tag: { label: string; user_id: string }): Promise<Tag> {
        const {data, error} = await this.supabase
            .from(TAGS_TABLE)
            .insert([tag])
            .select()
            .single()
        ;

        if (error) throw error;

        return data;
    }
}
