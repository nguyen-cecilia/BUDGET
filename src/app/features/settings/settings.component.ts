import {Component, effect, inject, signal, untracked} from '@angular/core';
import {
    LucideCoins,
    LucideHouse,
    LucideKey,
    LucideLandmark,
    LucideLayers,
    LucideLogOut,
    LucidePencil,
    LucidePlus,
    LucideRotateCcw,
    LucideSave,
    LucideLoaderCircle,
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
import {AuthStateService} from '../../core/auth/auth-state.service';
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
import {RefreshService} from '../../core/refresh.service';
import {Router} from '@angular/router';
import {AuthService} from '../../core/auth/auth.service';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {FormErrorComponent} from '../../components/form-error/form-error.component';
import {FieldErrorComponent} from '../../components/form-error/field-error.component';
import {PreferencesService} from '../../core/preferences.service';
import {MasonryGridComponent} from '../../components/masonry-grid/masonry-grid.component';
import {AccountBalanceService} from '../accounts/account-balance.service';
import {AccountBalanceWithAccount} from '../accounts/account-balance.model';
import {MonthNavigatorComponent} from '../../components/month-navigator/month-navigator.component';

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
        LoadingComponent,
        LucideLogOut,
        FormErrorComponent,
        LucideKey,
        ReactiveFormsModule,
        FieldErrorComponent,
        LucideHouse,
        LucideRotateCcw,
        MasonryGridComponent,
        LucideSave,
        LucideLoaderCircle,
        MonthNavigatorComponent,
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
    private authService = inject(AuthService);
    private router = inject(Router);
    private refreshService = inject(RefreshService);
    private fb = inject(FormBuilder);
    private accountBalanceService = inject(AccountBalanceService);
    protected subscriptionService = inject(SubscriptionService);
    protected currencyService = inject(CurrencyService);
    protected modalService = inject(ModalService);
    protected periodService = inject(PeriodService);
    protected colorService = inject(ColorService);
    protected preferencesService = inject(PreferencesService);

    selectedMonth = this.periodService.selectedMonth;
    monthOptions = this.periodService.monthOptions;
    now = new Date();

    isLoading = signal(false);
    isDeleting = signal(false);
    isSavingBalances = signal(false);
    currencies = signal<UserCurrencies[]>([]);
    subscriptions = signal<Subscription[]>([]);
    accounts = signal<Account[]>([]);
    tags = signal<Tag[]>([]);
    categories = signal<Category[]>([]);
    balanceMonth = signal<number>(new Date().getMonth() + 1);
    balanceYear = signal<number>(new Date().getFullYear());
    accountBalances = signal<AccountBalanceWithAccount[]>([]);
    balanceValues = signal<Record<string, number>>({});

    passwordForm: FormGroup;
    passwordMessage = signal<{text: string; type: 'error' | 'success'} | null>(null);
    isSubmittingPassword = signal(false);

    constructor() {
        this.passwordForm = this.fb.group({
            newPassword: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]],
        });

        effect(() => {
            this.refreshService.trigger();
            const key = this.refreshService.lastKey();
            void untracked(async () => {
                const userId = this.authState.getCurrentUser()?.id;
                if (userId && (!key || key !== 'goal')) {
                    void this.loadSettings(userId);
                }
            });
        });

        effect(() => {
            this.balanceMonth();
            this.balanceYear();
            void untracked(async () => {
                const userId = this.authState.getCurrentUser()?.id;
                if (userId && !this.isLoading()) {
                    await this.loadBalances();
                }
            });
        });
    }

    onMonthChange(month: number): void {
        this.balanceMonth.set(month);
    }

    onYearChange(year: number): void {
        this.balanceYear.set(year);
    }

    getBalance(accountId: string): number {
        return this.balanceValues()[accountId] ?? 0;
    }

    setBalance(accountId: string, event: Event): void {
        const input = event.target as HTMLInputElement;
        const value = parseFloat(input.value) || 0;
        this.balanceValues.update(v => ({...v, [accountId]: value}));
    }

    async submitBalances(): Promise<void> {
        const userId = this.authState.getCurrentUser()?.id;
        if (!userId) return;

        this.isSavingBalances.set(true);
        try {
            const year = this.balanceYear();
            const month = this.balanceMonth();
            const activeAccounts = this.accounts().filter(a => a.is_active);

            for (const account of activeAccounts) {
                const balance = this.balanceValues()[account.id] ?? 0;
                await this.accountBalanceService.upsertBalance(userId, account.id, year, month, balance);
            }

            this.refreshService.refresh('balance');
        } finally {
            this.isSavingBalances.set(false);
        }
    }

    async updatePassword(): Promise<void> {
        this.passwordMessage.set(null);
        const {newPassword, confirmPassword} = this.passwordForm.value;

        if (newPassword !== confirmPassword) {
            this.passwordMessage.set({text: 'Les mots de passe ne correspondent pas.', type: 'error'});
            return;
        }

        this.isSubmittingPassword.set(true);
        const {error} = await this.authService.updatePassword(newPassword);

        if (error) {
            this.passwordMessage.set({text: error.message || 'Erreur lors de la mise à jour.', type: 'error'});
        } else {
            this.passwordMessage.set({text: 'Mot de passe mis à jour avec succès.', type: 'success'});
            this.passwordForm.reset();
        }
        this.isSubmittingPassword.set(false);
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
                    this.refreshService.refresh('transaction');
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
                    this.refreshService.refresh('tag');
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
                    this.refreshService.refresh('subscription');
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
                    this.refreshService.refresh('category');
                } finally {
                    this.isDeleting.set(false);
                }
            },
        });
    }

    deleteAllData(): void {
        this.confirmDelete({
            title: 'Supprimer toutes les données',
            message: 'Cette action supprime définitivement (presque) toutes les données : transactions, catégories, comptes, abonnements, tags, objectifs d\'épargne et soldes. Opération irréversible.',
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
                    await this.accountBalanceService.deleteAllBalances(userId);
                    await this.accountService.deleteAllAccounts(userId);

                    this.refreshService.refresh('transaction');
                } finally {
                    this.isDeleting.set(false);
                }
            },
        });
    }

    async logout(): Promise<void> {
        await this.authService.signOut();
        await this.router.navigate(['connexion']);
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

            await this.loadBalances();
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres:', error);
        } finally {
            this.isLoading.set(false);
        }
    }

    private async loadBalances(): Promise<void> {
        const userId = this.authState.getCurrentUser()?.id;
        if (!userId) return;

        const balances = await this.accountBalanceService.getBalancesForMonth(
            userId,
            this.balanceYear(),
            this.balanceMonth(),
        );
        this.accountBalances.set(balances);

        const values: Record<string, number> = {};
        for (const b of balances) {
            values[b.account_id] = b.balance;
        }
        this.balanceValues.set(values);
    }

    private confirmDelete(payload: ConfirmPayload): void {
        this.modalService.confirm.open(payload);
    }
}
