import {Injectable, inject} from '@angular/core';
import {SelectOption} from '../../components/select/select.component';
import {AccountService} from '../accounts/account.service';
import {CategoryService} from '../categories/category.service';
import {TagService} from '../tags/tag.service';
import {CurrencyService} from '../currencies/currency.service';

@Injectable({
    providedIn: 'root'
})
export class TransactionOptionsService {
    private accountService = inject(AccountService);
    private categoryService = inject(CategoryService);
    private tagService = inject(TagService);
    private currencyService = inject(CurrencyService);

    async getAccountsOptions(userId: string, includeAll = false): Promise<SelectOption[]> {
        const data = await this.accountService.getAllAccountsByUser(userId);
        const options: SelectOption[] = data.map(account => ({
            value: account.id,
            label: account.label
        }));

        if (includeAll) {
            options.unshift({value: 'all', label: 'Tout'});
        }

        return options;
    }

    async getCategoriesOptions(userId: string, includeAll = false): Promise<SelectOption[]> {
        const data = await this.categoryService.getAllCategoriesByUser(userId);
        const options: SelectOption[] = data.map(category => ({
            value: category.id,
            label: category.label
        }));

        if (includeAll) {
            options.unshift({value: 'all', label: 'Tout'});
        }

        return options;
    }

    async getTagsOptions(userId: string): Promise<SelectOption[]> {
        const data = await this.tagService.getAllTagsByUser(userId);
        return data.map(tag => ({
            value: tag.id,
            label: tag.label
        }));
    }

    async getCurrenciesOptions(): Promise<SelectOption[]> {
        const data = await this.currencyService.getAllCurrencies();
        return data.map(currency => ({
            value: currency.id,
            label: `${currency.label} (${currency.symbol})`,
        }));
    }
}
