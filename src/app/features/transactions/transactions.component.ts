import {Component, effect, inject, OnInit, signal} from '@angular/core';
import {LucideArrowDownLeft, LucideArrowUpRight, LucideSearch} from '@lucide/angular';
import {BadgeComponent} from '../../components/badge/badge.component';
import {ModalService} from '../../components/modal/modal.service';
import {TransactionsByMonth} from './transaction.model';
import {TransactionService} from './transaction.service';
import {CurrencyPipe, DatePipe} from '@angular/common';
import {CategoryService} from '../categories/category.service';
import {TagService} from '../tags/tag.service';
import {Tag} from '../tags/tag.model';
import {AccountService} from '../accounts/account.service';
import {SelectComponent, SelectOption} from '../../components/select/select.component';
import {ColorService} from '../../core/color.service';
import {AuthStateService} from '../auth/auth-state.service';
import {MonthService} from '../month/month.service';

@Component({
    selector: 'app-transactions',
    imports: [
        LucideSearch,
        BadgeComponent,
        LucideArrowUpRight,
        LucideArrowDownLeft,
        DatePipe,
        CurrencyPipe,
        SelectComponent
    ],
    templateUrl: './transactions.component.html',
})
export class TransactionsComponent implements OnInit {
    private authState = inject(AuthStateService);
    private categoryService = inject(CategoryService);
    private accountService = inject(AccountService);
    private tagService = inject(TagService);
    private transactionService = inject(TransactionService);
    protected modalService = inject(ModalService);
    protected colorService = inject(ColorService);
    protected monthService = inject(MonthService);

    isLoading = signal(false);
    tags = signal<Tag[]>([]);
    transactionsByMonth = signal<TransactionsByMonth>({month: '', count: 0, transactionsByDay: []});
    selectedType = signal<string | number>('all');
    selectedAccount = signal<string | number>('all');
    selectedCategory = signal<string | number>('all');
    accountOptions = signal<SelectOption[]>([]);
    categoryOptions = signal<SelectOption[]>([]);

    constructor() {
        effect(() => {
            const userId = this.authState.getCurrentUser()?.id;
            if (userId) {
                this.getTransactions(userId);
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

        this.getCategories(userId);
        this.getAccounts(userId);
        this.getTags(userId);
        this.getTransactions(userId);
        this.isLoading.set(false);
    }

    private getCategories(userId: string) {
        this.categoryService.getAllCategoriesByUser(userId).then(
            (data) => {
                const options: SelectOption[] = [
                    { value: 'all', label: 'Tout' },
                    ...data.map(category => ({
                        value: category.id,
                        label: category.label
                    }))
                ];
                this.categoryOptions.set(options);
            },
            (error) => {
                console.error('Erreur lors du chargement:', error);
            }
        );
    }

    private getAccounts(userId: string) {
        this.accountService.getAllAccountsByUser(userId).then(
            (data) => {
                const options: SelectOption[] = [
                    { value: 'all', label: 'Tout' },
                    ...data.map(account => ({
                        value: account.id,
                        label: account.label
                    }))
                ];
                this.accountOptions.set(options);
            },
            (error) => {
                console.error('Erreur lors du chargement:', error);
            }
        );
    }

    private getTags(userId: string) {
        this.tagService.getAllTagsByUser(userId).then(
            (data) => {
                this.tags.set(data);
            },
            (error) => {
                console.error('Erreur lors du chargement:', error);
            }
        );
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
