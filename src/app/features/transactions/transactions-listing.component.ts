import {Component, effect, inject, OnInit, signal} from '@angular/core';
import {LucideArrowDownLeft, LucideArrowUpRight, LucideSearch, LucideSparkles} from '@lucide/angular';
import {BadgeComponent} from '../../components/badge/badge.component';
import {ModalService} from '../../components/modal/modal.service';
import {TransactionsByMonth} from './transaction.model';
import {TransactionService} from './transaction.service';
import {CurrencyPipe, DatePipe} from '@angular/common';
import {SelectComponent, SelectOption} from '../../components/select/select.component';
import {ColorService} from '../../core/color.service';
import {AuthStateService} from '../auth/auth-state.service';
import {MonthService} from '../month/month.service';
import {TransactionOptionsService} from './transaction-options.service';

@Component({
    selector: 'app-transactions',
    imports: [
        LucideSearch,
        BadgeComponent,
        LucideArrowUpRight,
        LucideArrowDownLeft,
        LucideSparkles,
        DatePipe,
        CurrencyPipe,
        SelectComponent
    ],
    templateUrl: './transactions-listing.component.html',
})
export class TransactionsListingComponent implements OnInit {
    private authState = inject(AuthStateService);
    private transactionService = inject(TransactionService);
    private optionsService = inject(TransactionOptionsService);
    protected modalService = inject(ModalService);
    protected colorService = inject(ColorService);
    protected monthService = inject(MonthService);

    isLoading = signal(false);
    transactionsByMonth = signal<TransactionsByMonth>({month: '', count: 0, transactionsByDay: []});
    selectedType = signal<string | number>('all');
    selectedAccount = signal<string | number>('all');
    selectedCategory = signal<string | number>('all');
    accountsFilters = signal<SelectOption[]>([]);
    categoriesFilters = signal<SelectOption[]>([]);
    tagsFilters = signal<SelectOption[]>([]);

    constructor() {
        effect(() => {
            this.transactionService.transactionRefreshTrigger();
            const userId = this.authState.getCurrentUser()?.id;
            if (userId) {
                this.getTransactions(userId);
                this.getFilters(userId);
            }
        });
    }

    ngOnInit() {
        this.isLoading.set(true);
        const userId = this.authState.getCurrentUser()?.id;

        if (!userId) {
            console.error('Utilisateur non authentifié');
            return;
        }

        this.getFilters(userId);
        this.getTransactions(userId);
        this.isLoading.set(false);
    }

    private async getFilters(userId: string) {
        try {
            const [accounts, categories, tags] = await Promise.all([
                this.optionsService.getAccountsOptions(userId, true),
                this.optionsService.getCategoriesOptions(userId, true),
                this.optionsService.getTagsOptions(userId),
            ]);

            this.accountsFilters.set(accounts);
            this.categoriesFilters.set(categories);
            this.tagsFilters.set(tags);
        } catch (error) {
            console.error('Erreur lors du chargement des options:', error);
        }
    }

    private getTransactions(userId: string) {
        const monthIndex = this.monthService.getMonth();
        const year = this.monthService.getYear();

        this.transactionService.getTransactionsByMonth(userId, monthIndex, year).then(
            (data) => {
                this.transactionsByMonth.set(data);
            },
            (error) => {
                console.error('Erreur lors du chargement:', error);
            }
        );
    }
}
