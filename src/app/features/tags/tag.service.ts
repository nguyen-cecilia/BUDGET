import {inject, Injectable, signal} from '@angular/core';
import {SupabaseService, TAGS_TABLE, TRANSACTION_TAGS_TABLE} from '../../core/supabase.service';
import {Tag} from './tag.model';
import {TransactionService} from '../transactions/transaction.service';

@Injectable({
    providedIn: 'root',
})
export class TagService {
    private supabaseService = inject(SupabaseService);
    private transactionService = inject(TransactionService);
    private supabase = this.supabaseService.getClient();

    tagRefreshTrigger = signal<boolean>(false);

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

    async createTag(userId: string, tag: { label: string; }): Promise<Tag> {
        const {data, error} = await this.supabase
            .from(TAGS_TABLE)
            .insert([{
                user_id: userId,
                label: tag.label,
            }])
            .select()
            .single()
        ;

        if (error) throw error;

        return data;
    }

    async updateTag(id: string, userId: string, tag: {
        label: string;
    }): Promise<Tag> {
        const {data, error} = await this.supabase
            .from(TAGS_TABLE)
            .update({
                label: tag.label,
            })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        return data;
    }

    async deleteTag(id: string, userId: string): Promise<void> {
        await this.transactionService.removeTagFromAllTransactions(id);

        const {error} = await this.supabase
            .from(TAGS_TABLE)
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;
    }

    async deleteAllTags(userId: string): Promise<void> {
        const {data} = await this.supabase
            .from(TAGS_TABLE)
            .select('id')
            .eq('user_id', userId);

        const ids = (data ?? []).map(t => t.id);
        if (ids.length > 0) {
            await this.supabase
                .from(TRANSACTION_TAGS_TABLE)
                .delete()
                .in('tag_id', ids);
        }

        const {error} = await this.supabase
            .from(TAGS_TABLE)
            .delete()
            .eq('user_id', userId);

        if (error) throw error;
    }
}
