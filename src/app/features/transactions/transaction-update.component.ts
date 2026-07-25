import {Component, computed, effect, EventEmitter, inject, OnInit, Output, signal} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {BadgeComponent} from '../../components/badge/badge.component';
import {LucideLoaderCircle, LucidePlus, LucideSave, LucideX} from '@lucide/angular';
import {ButtonComponent} from '../../components/button/button.component';
import {SelectOption} from '../../components/select/select.component';
import {AuthStateService} from '../auth/auth-state.service';
import {TransactionOptionsService} from './transaction-options.service';
import {TransactionService} from './transaction.service';
import {ModalService} from '../../components/modal/modal.service';
import {TagService} from '../tags/tag.service';

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
    ],
    templateUrl: './transaction-update.component.html',
})
export class TransactionUpdateComponent implements OnInit {
    private authState = inject(AuthStateService);
    private fb = inject(FormBuilder);
    private optionsService = inject(TransactionOptionsService);
    private transactionService = inject(TransactionService);
    private tagService = inject(TagService);
    private modalService = inject(ModalService);

    transactionForm: FormGroup;

    errorMessage = signal<string | null>(null);
    isSubmitting = signal(false);
    isRecurring = signal(false);
    currenciesOptions = signal<SelectOption[]>([]);
    accountsOptions = signal<SelectOption[]>([]);
    categoriesOptions = signal<SelectOption[]>([]);
    tagsOptions = signal<SelectOption[]>([]);
    selectedTags = signal<SelectOption[]>([]);
    newTags = signal<string[]>([]);

    constructor() {
        const now = new Date();
        const nowLocal = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);

        this.transactionForm = this.fb.group({
            type: ['expense', [Validators.required]],
            amount: ['', [Validators.required]],
            amountCurrency: ['', [Validators.required]],
            label: [''],
            date: [nowLocal, [Validators.required]],
            account: ['', [Validators.required]],
            category: [''],
            tags: [''],
            isSubscription: [false],
            subscriptionFrequency: [''],
        });

        effect(() => {
            if (!this.authState.isLoading()) {
                const userId = this.authState.getCurrentUser()?.id;

                if (userId) {
                    this.initOptions(userId);
                }
            }
        });
    }

    ngOnInit() {}

    private async initOptions(userId: string) {
        try {
            const [currencies, accounts, categories, tags] = await Promise.all([
                this.optionsService.getCurrenciesOptions(),
                this.optionsService.getAccountsOptions(userId, false),
                this.optionsService.getCategoriesOptions(userId, false),
                this.optionsService.getTagsOptions(userId),
            ]);

            this.currenciesOptions.set(currencies);
            this.accountsOptions.set(accounts);
            this.categoriesOptions.set(categories);
            this.tagsOptions.set(tags);

            if (currencies.length > 0) {
                this.transactionForm.get('amountCurrency')?.setValue(currencies[0].value);
            }
            if (accounts.length > 0) {
                this.transactionForm.get('account')?.setValue(accounts[0].value);
            }
            if (categories.length > 0) {
                this.transactionForm.get('category')?.setValue(categories[0].value);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des options:', error);
        }
    }

    private resetForm() {
        this.selectedTags.set([]);
        this.newTags.set([]);

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
            tags: '',
            isSubscription: false,
            subscriptionFrequency: '',
        });
    }

    private async handleTags(userId: string, transactionId: string) {
        const existingTags = await this.tagService.getAllTagsByUser(userId);

        const newTagIds = await Promise.all(
            this.newTags().map(async (label) => {
                const existing = existingTags.find(
                    t => t.label.toLowerCase() === label.toLowerCase()
                );
                if (existing) return existing.id;
                const created = await this.tagService.createTag({ label, user_id: userId });
                return created.id;
            })
        );

        const allTagIds = [
            ...this.selectedTags().map(t => t.value),
            ...newTagIds
        ];

        if (allTagIds.length > 0) {
            await this.transactionService.addTagsToTransaction(transactionId, allTagIds);
        }
    }

    availableTagsOptions = computed(() =>
        this.tagsOptions().filter(tag => !this.selectedTags().includes(tag))
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

            const fv = this.transactionForm.value;

            const transaction = await this.transactionService.createTransaction(userId, {
                type: fv.type,
                amount: parseFloat(fv.amount),
                amount_currency_id: fv.amountCurrency,
                label: fv.label || '',
                date: fv.date,
                account_id: fv.account,
                category_id: fv.category || undefined,
                is_subscription: fv.isSubscription,
                subscription_frequency: fv.subscriptionFrequency || undefined,
            });

            await this.handleTags(userId, transaction.id);

            this.transactionService.transactionRefreshTrigger.set(
                !this.transactionService.transactionRefreshTrigger()
            );

            this.resetForm();

            this.modalService.closeEditModal();
        } catch (error) {
            console.error('Erreur lors de la création de la transaction:', error);
            this.errorMessage.set('Erreur lors de la création de la transaction');
        } finally {
            this.isSubmitting.set(false);
        }
    }
}
