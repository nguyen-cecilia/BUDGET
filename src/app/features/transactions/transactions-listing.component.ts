import {Component, computed, effect, inject, signal, untracked} from '@angular/core';
import {LucideFrown, LucidePlus, LucideSearch, LucideX} from '@lucide/angular';
import {BadgeComponent} from '../../components/badge/badge.component';
import {TransactionsByMonth} from './transaction.model';
import {TransactionService} from './transaction.service';
import {CurrencyPipe, DatePipe} from '@angular/common';
import {SelectComponent, SelectOption} from '../../components/select/select.component';
import {AuthStateService} from '../../core/auth/auth-state.service';
import {PeriodService} from '../../core/period.service';
import {TransactionOptionsService} from './transaction-options.service';
import {ButtonComponent} from '../../components/button/button.component';
import {TransactionItemComponent} from './transaction-item.component';
import {CurrencyService} from '../currencies/currency.service';
import {ModalService} from '../../components/modal/modal.service';
import {LoadingComponent} from '../../components/loading/loading.component';
import {RefreshService} from '../../core/refresh.service';

@Component({
    selector: 'app-transactions',
    imports: [
        LucideSearch,
        BadgeComponent,
        DatePipe,
        CurrencyPipe,
        SelectComponent,
        LucideFrown,
        LucideX,
        ButtonComponent,
        TransactionItemComponent,
        LucidePlus,
        LoadingComponent,
    ],
    templateUrl: './transactions-listing.component.html',
})
export class TransactionsListingComponent {
    private authState = inject(AuthStateService);
    private transactionService = inject(TransactionService);
    private currencyService = inject(CurrencyService);
    private optionsService = inject(TransactionOptionsService);
    private refreshService = inject(RefreshService);
    protected modalService = inject(ModalService);
    protected periodService = inject(PeriodService);
    protected defaultCurrency = this.currencyService.defaultCurrency;

    isLoading = signal(false);
    transactionsByMonth = signal<TransactionsByMonth>({month: '', count: 0, transactionsByDay: []});
    selectedType = signal<string | number>('all');
    selectedAccount = signal<string | number>('all');
    selectedCategory = signal<string | number>('all');
    selectedTags = signal<Set<string>>(new Set());
    selectedSubscription = signal(false);
    accountsFilters = signal<SelectOption[]>([]);
    categoriesFilters = signal<SelectOption[]>([]);
    tagsFilters = signal<SelectOption[]>([]);
    searchQuery = signal('');

    constructor() {
        effect(() => {
            this.refreshService.trigger();
            this.periodService.selectedMonth();
            this.periodService.selectedYear();
            const key = this.refreshService.lastKey();
            untracked(() => {
                const userId = this.authState.getCurrentUser()?.id;
                if (userId && (!key || key === 'transaction' || key === 'currency')) {
                    void this.loadList(userId);
                }
            });
        });
    }

    filteredTransactions = computed(() => {
        const data = this.transactionsByMonth();
        const query = this.searchQuery().toLowerCase();
        const type = this.selectedType();
        const account = this.selectedAccount();
        const category = this.selectedCategory();
        const tags = this.selectedTags();
        const subscription = this.selectedSubscription();

        const filteredDays = data.transactionsByDay
            .map(day => ({
                ...day,
                transactions: day.transactions.filter(t => {
                    if (query && !t.label.toLowerCase().includes(query)) return false;
                    if (type !== 'all' && t.type !== type) return false;
                    if (account !== 'all' && t.account_id !== account) return false;
                    if (category !== 'all' && t.category_id !== category) return false;
                    if (tags.size > 0) {
                        const transactionTags = new Set((t.tags || []).map(tag => String(tag.id)));
                        const hasAny = Array.from(tags).some(id => transactionTags.has(id));
                        if (!hasAny) return false;
                    }
                    return !(subscription && !t.is_subscription);
                })
            }))
            .filter(day => day.transactions.length > 0);

        const totalCount = filteredDays.reduce((sum, d) => sum + d.transactions.length, 0);
        return {...data, count: totalCount, transactionsByDay: filteredDays};
    });

    convertedDayTotals = computed(() => {
        const totals = new Map<string, number>();
        for (const day of this.transactionsByMonth().transactionsByDay) {
            totals.set(day.date, day.transactions.reduce((acc, t) => {
                if (!this.currencyService.canConvert(t.currency.code)) return acc;
                return acc + this.currencyService.convertToDefault(
                    t.type === 'expense' ? -t.amount : t.amount,
                    t.currency.code
                );
            }, 0));
        }
        return totals;
    });

    dayTotal(date: string): number {
        return this.convertedDayTotals().get(date) ?? 0;
    }

    toggleTag(value: string | number): void {
        this.selectedTags.update(set => {
            const next = new Set(set);
            const id = String(value);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    isSelected(value: string | number): boolean {
        return this.selectedTags().has(String(value));
    }

    clearSelectedTags(): void {
        this.selectedTags.set(new Set());
    }

    private async loadList(userId: string): Promise<void> {
        this.isLoading.set(true);

        const monthIndex = this.periodService.getMonth();
        const year = this.periodService.getYear();

        try {
            const [transactions, accounts, categories, tags] = await Promise.all([
                this.transactionService.getTransactionsByMonth(userId, monthIndex, year),
                this.optionsService.getAccountsOptions(userId, true),
                this.optionsService.getCategoriesOptions(userId, true, true),
                this.optionsService.getTagsOptions(userId),
            ]);

            this.transactionsByMonth.set(transactions);
            this.accountsFilters.set(accounts);
            this.categoriesFilters.set(categories);
            this.tagsFilters.set(tags);
        } finally {
            this.isLoading.set(false);
        }
    }
}
