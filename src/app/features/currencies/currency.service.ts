import {inject, Injectable} from '@angular/core';
import {SupabaseService} from '../../core/supabase.service';
import {Currency} from './currency.model';

const CURRENCIES_TABLE = 'currencies';

@Injectable({
    providedIn: 'root',
})
export class CurrencyService {
    private supabaseService = inject(SupabaseService);
    private supabase = this.supabaseService.getClient();

    async getAllCurrencies(): Promise<Currency[]> {
        const {data, error} = await this.supabase
            .from(CURRENCIES_TABLE)
            .select('*')
            .order('id', {ascending: true})
        ;

        if (error) {
            console.error('Erreur lors de la récupération des devises:', error);
            throw error;
        }

        return data;
    }
}
