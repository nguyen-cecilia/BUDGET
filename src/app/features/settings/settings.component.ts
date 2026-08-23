import {Component, effect, inject, signal} from '@angular/core';
import {
    LucideCoins,
    LucideLandmark,
    LucideLayers,
    LucidePencil,
    LucidePlus,
    LucideSkull,
    LucideSparkles,
    LucideTag,
    LucideTrash2,
    LucideTriangleAlert,
} from '@lucide/angular';
import {ButtonComponent} from '../../components/button/button.component';
import {BadgeComponent} from '../../components/badge/badge.component';
import {SelectComponent} from '../../components/select/select.component';
import {PeriodService} from '../../core/period.service';
import {ModalComponent} from '../../components/modal/modal.component';
import {AccountUpdateComponent} from '../accounts/account-update.component';
import {ModalService} from '../../components/modal/modal.service';
import {AccountService} from '../accounts/account.service';
import {Account} from '../accounts/account.model';
import {AuthStateService} from '../auth/auth-state.service';
import {TagService} from '../tags/tag.service';
import {Tag} from '../tags/tag.model';
import {TagUpdateComponent} from '../tags/tag-update.component';
import {CategoryUpdateComponent} from '../categories/category-update.component';
import {CategoryService} from '../categories/category.service';
import {Category} from '../categories/category.model';
import {ColorService} from '../../core/color.service';
import {CurrencyService} from '../currencies/currency.service';
import {UserCurrencies} from '../currencies/currency.model';
import {CurrencyUpdateComponent} from '../currencies/currency-update.component';
import {SubscriptionService} from '../subscriptions/subscription.service';
import {Subscription} from '../subscriptions/subscription.model';
import {CurrencyPipe, DatePipe} from '@angular/common';
import {SubscriptionUpdate} from '../subscriptions/subscription-update.component';
import {ConfirmComponent, ConfirmPayload} from '../../components/confirm/confirm.component';
import {SavingsGoalService} from '../saving-goals/savings-goal.service';
import {TransactionService} from '../transactions/transaction.service';
import {LoadingComponent} from '../../components/loading/loading.component';

@Component({
    selector: 'app-settings',
    imports: [
        LucideCoins,
        ButtonComponent,
        LucidePlus,
        LucidePencil,
        LucideSparkles,
        LucideTag,
        BadgeComponent,
        LucideLandmark,
        SelectComponent,
        ModalComponent,
        AccountUpdateComponent,
        TagUpdateComponent,
        CategoryUpdateComponent,
        CurrencyUpdateComponent,
        CurrencyPipe,
        DatePipe,
        SubscriptionUpdate,
        LucideSkull,
        LucideTrash2,
        LucideLayers,
        LucideTriangleAlert,
        ConfirmComponent,
        LoadingComponent
    ],
    templateUrl: './settings.component.html',
})
export class SettingsComponent {
    private authState = inject(AuthStateService);
    private accountService = inject(AccountService);
    private tagService = inject(TagService);
    private categoryService = inject(CategoryService);
    private transactionService = inject(TransactionService);
    private savingsGoalService = inject(SavingsGoalService);
    protected subscriptionService = inject(SubscriptionService);
    protected currencyService = inject(CurrencyService);
    protected modalService = inject(ModalService);
    protected periodService = inject(PeriodService);
    protected colorService = inject(ColorService);

    selectedMonth = this.periodService.selectedMonth;
    monthOptions = this.periodService.monthOptions;

    isLoading = signal(false);
    isDeleting = signal(false);
    currencies = signal<UserCurrencies[]>([]);
    subscriptions = signal<Subscription[]>([]);
    accounts = signal<Account[]>([]);
    tags = signal<Tag[]>([]);
    categories = signal<Category[]>([]);

    constructor() {
        effect(() => {
            this.currencyService.currencyRefreshTrigger();
            this.subscriptionService.subscriptionRefreshTrigger();
            this.accountService.accountRefreshTrigger();
            this.tagService.tagRefreshTrigger();
            this.categoryService.categoryRefreshTrigger();
            const userId = this.authState.getCurrentUser()?.id;
            if (userId) {
                void this.loadSettings(userId);
            }
        });
    }

    deleteAllTransactions(): void {
        this.confirmDelete({
            title: 'Supprimer toutes les transactions',
            message: 'Cette action supprime définitivement toutes les transactions. Opération irréversible.',
            onConfirm: async () => {
                const userId = this.authState.getCurrentUser()?.id;
                if (!userId) return;
                this.isDeleting.set(true);
                try {
                    await this.transactionService.deleteAllTransactions(userId);
                    this.transactionService.transactionRefreshTrigger.set(!this.transactionService.transactionRefreshTrigger());
                } finally {
                    this.isDeleting.set(false);
                }
            },
        });
    }

    deleteAllTags(): void {
        this.confirmDelete({
            title: 'Supprimer tous les tags',
            message: 'Cette action supprime définitivement tous les tags et retire leurs liens des transactions.',
            onConfirm: async () => {
                const userId = this.authState.getCurrentUser()?.id;
                if (!userId) return;
                this.isDeleting.set(true);
                try {
                    await this.tagService.deleteAllTags(userId);
                    this.tagService.tagRefreshTrigger.set(!this.tagService.tagRefreshTrigger());
                } finally {
                    this.isDeleting.set(false);
                }
            },
        });
    }

    deleteAllSubscriptions(): void {
        this.confirmDelete({
            title: 'Supprimer tous les abonnements',
            message: 'Cette action supprime définitivement tous les abonnements. Les transactions liées sont conservées mais perdent leur lien.',
            onConfirm: async () => {
                const userId = this.authState.getCurrentUser()?.id;
                if (!userId) return;
                this.isDeleting.set(true);
                try {
                    await this.subscriptionService.deleteAllSubscriptions(userId);
                    this.subscriptionService.subscriptionRefreshTrigger.set(!this.subscriptionService.subscriptionRefreshTrigger());
                } finally {
                    this.isDeleting.set(false);
                }
            },
        });
    }

    deleteAllCategories(): void {
        this.confirmDelete({
            title: 'Supprimer toutes les catégories',
            message: 'Cette action supprime définitivement toutes les catégories. Les transactions et abonnements passeront « Sans catégorie ».',
            onConfirm: async () => {
                const userId = this.authState.getCurrentUser()?.id;
                if (!userId) return;
                this.isDeleting.set(true);
                try {
                    await this.categoryService.deleteAllCategories(userId);
                    this.categoryService.categoryRefreshTrigger.set(!this.categoryService.categoryRefreshTrigger());
                } finally {
                    this.isDeleting.set(false);
                }
            },
        });
    }

    deleteAllData(): void {
        this.confirmDelete({
            title: 'Supprimer toutes les données',
            message: 'Cette action supprime définitivement (presque) toutes les données : transactions, catégories, comptes, abonnements, tags et objectifs d\'épargne. Opération irréversible.',
            onConfirm: async () => {
                const userId = this.authState.getCurrentUser()?.id;
                if (!userId) return;
                this.isDeleting.set(true);
                try {
                    await this.transactionService.deleteAllTransactions(userId);
                    await this.subscriptionService.deleteAllSubscriptions(userId);
                    await this.savingsGoalService.deleteAllSavingsGoals(userId);
                    await this.categoryService.deleteAllCategories(userId);
                    await this.tagService.deleteAllTags(userId);
                    await this.accountService.deleteAllAccounts(userId);

                    this.transactionService.transactionRefreshTrigger.set(!this.transactionService.transactionRefreshTrigger());
                    this.subscriptionService.subscriptionRefreshTrigger.set(!this.subscriptionService.subscriptionRefreshTrigger());
                    this.tagService.tagRefreshTrigger.set(!this.tagService.tagRefreshTrigger());
                    this.categoryService.categoryRefreshTrigger.set(!this.categoryService.categoryRefreshTrigger());
                    this.accountService.accountRefreshTrigger.set(!this.accountService.accountRefreshTrigger());
                    this.currencyService.currencyRefreshTrigger.set(!this.currencyService.currencyRefreshTrigger());
                } finally {
                    this.isDeleting.set(false);
                }
            },
        });
    }

    private async loadSettings(userId: string): Promise<void> {
        this.isLoading.set(true);
        try {
            const [currencies, subscriptions, categories, tags, accounts] = await Promise.all([
                this.currencyService.getUserCurrencies(userId),
                this.subscriptionService.getAllSubscriptionsByUser(userId, true),
                this.categoryService.getAllCategoriesByUser(userId),
                this.tagService.getAllTagsByUser(userId),
                this.accountService.getAllAccountsByUser(userId, true),
            ]);

            this.currencies.set(currencies);
            this.subscriptions.set(subscriptions);
            this.categories.set(categories);
            this.tags.set(tags);
            this.accounts.set(accounts);
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres:', error);
        } finally {
            this.isLoading.set(false);
        }
    }

    private confirmDelete(payload: ConfirmPayload): void {
        this.modalService.confirm.open(payload);
    }
}
