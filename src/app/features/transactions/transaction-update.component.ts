import {Component, computed, effect, inject, signal, untracked} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {BadgeComponent} from '../../components/badge/badge.component';
import {LucideLoaderCircle, LucidePlus, LucideSave, LucideTrash2, LucideX} from '@lucide/angular';
import {ButtonComponent} from '../../components/button/button.component';
import {SelectOption} from '../../components/select/select.component';
import {AuthStateService} from '../auth/auth-state.service';
import {TransactionOptionsService} from './transaction-options.service';
import {TransactionService} from './transaction.service';
import {ModalService} from '../../components/modal/modal.service';
import {TagService} from '../tags/tag.service';
import {SubscriptionService} from '../subscriptions/subscription.service';
import positiveNumber from '../../core/validators';
import {Transaction} from './transaction.model';
import {AccountService} from '../accounts/account.service';
import {CategoryService} from '../categories/category.service';
import {CurrencyService} from '../currencies/currency.service';
import {Subscription} from '../subscriptions/subscription.model';

@Component({
    selector: 'app-update-transaction',
    imports: [
        ReactiveFormsModule,
        BadgeComponent,
        LucideX,
        LucideSave,
        ButtonComponent,
        LucideLoaderCircle,
        LucidePlus,
        LucideTrash2,
    ],
    templateUrl: './transaction-update.component.html',
})
export class TransactionUpdateComponent {
    private authState = inject(AuthStateService);
    private fb = inject(FormBuilder);
    private optionsService = inject(TransactionOptionsService);
    private transactionService = inject(TransactionService);
    private accountService = inject(AccountService);
    private categoryService = inject(CategoryService);
    private currencyService = inject(CurrencyService);
    private tagService = inject(TagService);
    private subscriptionService = inject(SubscriptionService);
    protected modalService = inject(ModalService);

    transactionForm: FormGroup;

    errorMessage = signal<string | null>(null);
    isSubmitting = signal(false);
    mode = signal<'transaction' | 'subscription'>('transaction');
    subscriptions = signal<Subscription[]>([]);
    currenciesOptions = signal<SelectOption[]>([]);
    accountsOptions = signal<SelectOption[]>([]);
    categoriesOptions = signal<SelectOption[]>([]);
    tagsOptions = signal<SelectOption[]>([]);
    selectedTags = signal<SelectOption[]>([]);
    newTags = signal<string[]>([]);
    bulkMode = signal(false);
    addedCount = signal(0);

    constructor() {
        const now = new Date();
        const nowLocal = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);

        this.transactionForm = this.fb.group({
            type: ['expense', [Validators.required]],
            amount: ['', [Validators.required, positiveNumber]],
            amountCurrency: ['', [Validators.required]],
            label: ['', [Validators.required]],
            date: [nowLocal, [Validators.required]],
            account: ['', [Validators.required]],
            category: [''],
            subscriptionFrequency: ['monthly'],
            subscriptionNextDate: [this.subscriptionService.computeNextDate('monthly')],
            selectedSubscriptionId: [''],
        });

        this.transactionForm.get('subscriptionFrequency')?.valueChanges.subscribe(freq => {
            this.transactionForm.patchValue({subscriptionNextDate: this.subscriptionService.computeNextDate(freq)});
        });

        effect(() => {
            if (!this.authState.isLoading()) {
                const userId = this.authState.getCurrentUser()?.id;
                if (userId) {
                    this.accountService.accountRefreshTrigger();
                    this.tagService.tagRefreshTrigger();
                    this.categoryService.categoryRefreshTrigger();
                    this.currencyService.currencyRefreshTrigger();
                    this.subscriptionService.subscriptionRefreshTrigger();
                    this.initOptions(userId);
                }
            }
        });

        effect(() => {
            const editing = this.modalService.transaction.editing();
            untracked(() => {
                if (editing) {
                    this.fillForm(editing);
                } else {
                    this.resetForm();
                }
            });
        });

        effect(() => {
            this.modalService.transaction.isOpen();
            this.modalService.transaction.bulk();
            this.bulkMode.set(
                this.modalService.transaction.isOpen() && this.modalService.transaction.bulk()
            );
            if (!this.modalService.transaction.isOpen()) {
                this.addedCount.set(0);
            }
        });
    }

    availableTagsOptions = computed(() =>
        this.tagsOptions().filter(
            tag => !this.selectedTags().some(t => t.value === tag.value)
        )
    );

    addNewTag(input: HTMLInputElement): void {
        const rawValue = input.value.trim();
        if (!rawValue) return;

        const value = rawValue.charAt(0).toUpperCase() + rawValue.slice(1);

        const existsInOptions = this.tagsOptions().some(
            t => t.label.toLowerCase() === value.toLowerCase()
        );
        const existsInSelected = this.selectedTags().some(
            t => t.label.toLowerCase() === value.toLowerCase()
        );
        const existsInNew = this.newTags().some(
            t => t.toLowerCase() === value.toLowerCase()
        );

        if (existsInOptions || existsInSelected || existsInNew) return;

        this.newTags.update(tags => [...tags, value]);
        input.value = '';
    }

    addExistingTag(tag: SelectOption): void {
        const isTagAlreadySelected = this.selectedTags().some(t => t.label === tag.label);

        if (!isTagAlreadySelected) {
            this.selectedTags.set([...this.selectedTags(), tag]);
        }
    }

    removeTag(tagLabel: string | number): void {
        this.selectedTags.set(
            this.selectedTags().filter(tag => tag.label !== tagLabel)
        );

        this.newTags.set(
            this.newTags().filter(tag => tag !== tagLabel)
        );
    }

    setMode(mode: 'transaction' | 'subscription'): void {
        this.mode.set(mode);
        if (mode === 'subscription') {
            this.bulkMode.set(false);
            this.transactionForm.get('type')?.setValue('expense');
            if (this.transactionForm.get('selectedSubscriptionId')?.value) {
                this.onSubscriptionChange();
            }
        }
    }

    onSubscriptionChange(): void {
        const subId = this.transactionForm.get('selectedSubscriptionId')?.value;
        const sub = this.subscriptions().find(s => s.id == subId);
        if (sub) this.applySubscription(sub);
    }

    async submitTransaction() {
        if (this.transactionForm.invalid) {
            this.errorMessage.set('Veuillez remplir tous les champs obligatoires');
            return;
        }

        this.isSubmitting.set(true);
        this.errorMessage.set(null);

        try {
            const userId = this.authState.getCurrentUser()?.id;
            if (!userId) {
                throw new Error('Utilisateur non authentifié');
            }

            const editing = this.modalService.transaction.editing();
            const fv = this.transactionForm.value;

            if (this.mode() === 'subscription' && !fv.selectedSubscriptionId) {
                this.errorMessage.set('Veuillez choisir un abonnement');
                return;
            }

            let subscriptionId: string | null = null;

            if (this.mode() === 'subscription') {
                const sub = await this.subscriptionService.getSubscriptionById(fv.selectedSubscriptionId);

                const subscriptionChanged =
                    parseFloat(fv.amount) !== sub.amount ||
                    String(fv.amountCurrency) !== sub.currency_id ||
                    fv.account !== sub.account_id ||
                    (fv.category || null) !== sub.category_id ||
                    fv.subscriptionFrequency !== sub.frequency ||
                    fv.subscriptionNextDate !== sub.next_payment_date;

                if (subscriptionChanged) {
                    await this.subscriptionService.updateSubscription(sub.id, {
                        amount: parseFloat(fv.amount),
                        currency_id: String(fv.amountCurrency),
                        account_id: fv.account,
                        category_id: fv.category || null,
                        frequency: fv.subscriptionFrequency,
                        next_payment_date: fv.subscriptionNextDate,
                        label: fv.label,
                    });
                }

                subscriptionId = sub.id;
            }

            const payload = {
                type: this.mode() === 'subscription' ? 'expense' : fv.type,
                amount: parseFloat(fv.amount),
                amount_currency_id: fv.amountCurrency,
                label: fv.label || '',
                date: fv.date,
                account_id: fv.account,
                category_id: fv.category || undefined,
                is_subscription: this.mode() === 'subscription',
                subscription_id: subscriptionId,
            };

            if (editing) {
                await this.transactionService.updateTransaction(editing.id, userId, payload);
                await this.transactionService.removeTagsFromTransaction(editing.id);
                await this.handleTags(userId, editing.id);
                this.modalService.transaction.close();
            } else {
                const transaction = await this.transactionService.createTransaction(userId, payload);
                await this.handleTags(userId, transaction.id);

                if (this.bulkMode()) {
                    const kept = {
                        type: this.transactionForm.get('type')?.value,
                        amountCurrency: this.transactionForm.get('amountCurrency')?.value,
                        account: this.transactionForm.get('account')?.value,
                        category: this.transactionForm.get('category')?.value,
                    };
                    this.addedCount.update(c => c + 1);
                    this.resetForm();
                    this.transactionForm.patchValue(kept);
                } else {
                    this.modalService.transaction.close();
                }
            }

            this.transactionService.transactionRefreshTrigger.set(
                !this.transactionService.transactionRefreshTrigger()
            );

            this.resetForm();
        } catch (error) {
            console.error('Erreur lors de la création de la transaction:', error);
            this.errorMessage.set('Erreur lors de la création de la transaction');
        } finally {
            this.isSubmitting.set(false);
        }
    }

    async deleteTransaction(): Promise<void> {
        const editing = this.modalService.transaction.editing();
        if (!editing) return;

        const confirmed = confirm('Supprimer cette transaction ?');
        if (!confirmed) return;

        this.isSubmitting.set(true);

        try {
            await this.transactionService.deleteTransaction(editing.id, editing.user_id);

            this.transactionService.transactionRefreshTrigger.set(
                !this.transactionService.transactionRefreshTrigger()
            );

            this.modalService.transaction.close();
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            this.errorMessage.set('Erreur lors de la suppression');
        } finally {
            this.isSubmitting.set(false);
        }
    }

    private async initOptions(userId: string) {
        try {
            const [currencies, accounts, categories, tags, subscriptions] = await Promise.all([
                this.optionsService.getCurrenciesOptions(userId),
                this.optionsService.getAccountsOptions(userId, false),
                this.optionsService.getCategoriesOptions(userId, false, true),
                this.optionsService.getTagsOptions(userId),
                this.subscriptionService.getAllSubscriptionsByUser(userId),
            ]);

            this.currenciesOptions.set(currencies);
            this.accountsOptions.set(accounts);
            this.categoriesOptions.set(categories);
            this.tagsOptions.set(tags);
            this.subscriptions.set(subscriptions);

            if (currencies.length > 0) {
                this.transactionForm.get('amountCurrency')?.setValue(currencies[0].value);
            }
            if (accounts.length > 0) {
                this.transactionForm.get('account')?.setValue(accounts[0].value);
            }
            if (categories.length > 0) {
                this.transactionForm.get('category')?.setValue(categories[0].value);
            }
            this.selectDefaultSubscription();
        } catch (error) {
            console.error('Erreur lors du chargement des options:', error);
        }
    }

    private async fillForm(transaction: Transaction): Promise<void> {
        this.mode.set(
            transaction.is_subscription && transaction.subscription_id ? 'subscription' : 'transaction'
        );

        if (transaction.is_subscription && transaction.subscription_id) {
            const subscription = await this.subscriptionService
                .getSubscriptionById(transaction.subscription_id);

            this.transactionForm.patchValue({
                type: 'expense',
                amount: subscription.amount,
                amountCurrency: String(subscription.currency_id),
                label: subscription.label,
                date: transaction.date.slice(0, 16),
                account: subscription.account_id,
                category: subscription.category_id ?? '',
                subscriptionFrequency: subscription.frequency,
                subscriptionNextDate: subscription.next_payment_date,
                selectedSubscriptionId: subscription.id,
            });
        } else {
            this.transactionForm.patchValue({
                type: transaction.type,
                amount: transaction.amount,
                amountCurrency: String(transaction.amount_currency_id),
                label: transaction.label,
                date: transaction.date.slice(0, 16),
                account: transaction.account_id,
                category: transaction.category_id ?? '',
            });
        }

        if (transaction.tags) {
            this.selectedTags.set(
                transaction.tags.map(t => ({value: t.id, label: t.label}))
            );
        }
    }

    private resetForm() {
        this.selectedTags.set([]);
        this.newTags.set([]);
        this.mode.set('transaction');

        const now = new Date();
        const nowLocal = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);

        const currencies = this.currenciesOptions();
        const accounts = this.accountsOptions();
        const categories = this.categoriesOptions();

        this.transactionForm.reset({
            type: 'expense',
            amountCurrency: currencies.length > 0 ? currencies[0].value : '',
            date: nowLocal,
            account: accounts.length > 0 ? accounts[0].value : '',
            category: categories.length > 0 ? categories[0].value : '',
            subscriptionFrequency: 'monthly',
            subscriptionNextDate: this.subscriptionService.computeNextDate('monthly'),
            selectedSubscriptionId: '',
        });

        this.selectDefaultSubscription();
    }

    private applySubscription(sub: Subscription): void {
        this.transactionForm.patchValue({
            amount: sub.amount,
            amountCurrency: String(sub.currency_id),
            label: sub.label,
            account: sub.account_id,
            category: sub.category_id ?? '',
            subscriptionFrequency: sub.frequency,
            subscriptionNextDate: sub.next_payment_date,
        });
    }

    private selectDefaultSubscription(): void {
        const subs = this.subscriptions();
        const control = this.transactionForm.get('selectedSubscriptionId');
        if (subs.length === 0 || control?.value) return;
        control?.setValue(subs[0].id);
        if (this.mode() === 'subscription') {
            this.applySubscription(subs[0]);
        }
    }

    private async handleTags(userId: string, transactionId: string) {
        const existingTags = await this.tagService.getAllTagsByUser(userId);

        const newTagIds = await Promise.all(
            this.newTags().map(async (label) => {
                const existing = existingTags.find(
                    t => t.label.toLowerCase() === label.toLowerCase()
                );
                if (existing) return existing.id;
                const created = await this.tagService.createTag(userId, {label});
                return created.id;
            })
        );

        const allTagIds = [
            ...this.selectedTags().map(t => t.value),
            ...newTagIds,
        ];

        if (allTagIds.length > 0) {
            await this.transactionService.addTagsToTransaction(transactionId, allTagIds);
        }
    }
}
