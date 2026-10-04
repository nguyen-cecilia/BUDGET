import {Component, computed, inject, signal} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {
    LucideCircleMinus,
    LucideCirclePlus,
    LucideLoaderCircle,
    LucideSave,
    LucideTriangleAlert
} from '@lucide/angular';
import {ButtonComponent} from '../../components/button/button.component';
import {SelectOption} from '../../components/select/select.component';
import {AuthStateService} from '../../core/auth/auth-state.service';
import {TransactionOptionsService} from './transaction-options.service';
import {TransactionService} from './transaction.service';
import {TagService} from '../tags/tag.service';
import {ModalService} from '../../components/modal/modal.service';
import {RefreshService} from '../../core/refresh.service';
import {DatePickerComponent} from '../../components/datepicker/datepicker.component';
import {FormErrorComponent} from '../../components/form-error/form-error.component';
import {TagsInputComponent} from '../../components/tags-input/tags-input.component';
import {DateService} from '../../core/date.service';
import {TransactionType} from './transaction.model';

type BulkField = 'type' | 'amount' | 'currency' | 'account' | 'label' | 'category' | 'date' | 'tags';

@Component({
    selector: 'app-transaction-bulk-update',
    imports: [
        ReactiveFormsModule,
        LucideSave,
        LucideLoaderCircle,
        LucideCircleMinus,
        LucideCirclePlus,
        LucideTriangleAlert,
        ButtonComponent,
        DatePickerComponent,
        FormErrorComponent,
        TagsInputComponent,
    ],
    templateUrl: './transaction-bulk-update.component.html',
})
export class TransactionBulkUpdateComponent {
    private authState = inject(AuthStateService);
    private fb = inject(FormBuilder);
    private optionsService = inject(TransactionOptionsService);
    private transactionService = inject(TransactionService);
    private tagService = inject(TagService);
    private refreshService = inject(RefreshService);
    private dateService = inject(DateService);
    protected modalService = inject(ModalService);

    form: FormGroup;

    currenciesOptions = signal<SelectOption[]>([]);
    accountsOptions = signal<SelectOption[]>([]);
    categoriesOptions = signal<SelectOption[]>([]);
    tagsOptions = signal<SelectOption[]>([]);
    selectedTags = signal<SelectOption[]>([]);
    newTags = signal<string[]>([]);

    isSubmitting = signal(false);
    errorMessage = signal<string | null>(null);

    enabled = signal<Record<BulkField, boolean>>({
        type: false,
        amount: false,
        currency: false,
        account: false,
        label: false,
        category: false,
        date: false,
        tags: false,
    });

    ids = computed(() => this.modalService.bulkTransaction.editing()?.ids ?? []);

    constructor() {
        const nowLocal = this.dateService.nowLocalInputValue();

        this.form = this.fb.group({
            type: ['expense'],
            amount: [''],
            amountCurrency: [''],
            account: [''],
            label: [''],
            category: [''],
            date: [nowLocal],
        });

        void this.initOptions();
    }

    isEnabled(field: BulkField): boolean {
        return this.enabled()[field];
    }

    toggle(field: BulkField): void {
        this.enabled.update(state => ({...state, [field]: !state[field]}));
    }

    cancel(): void {
        this.modalService.bulkTransaction.close();
    }

    async submit(): Promise<void> {
        const ids = this.ids();
        const userId = this.authState.getCurrentUser()?.id;
        if (ids.length === 0 || !userId) return;

        const state = this.enabled();
        if (!Object.values(state).some(Boolean)) {
            this.errorMessage.set('Sélectionnez au moins un champ à modifier.');
            return;
        }

        const fv = this.form.value;
        const patch: {
            type?: TransactionType;
            amount?: number;
            amount_currency_id?: string;
            account_id?: string;
            category_id?: string | null;
            date?: string;
            label?: string;
        } = {};

        if (state.type) patch.type = fv.type;
        if (state.amount) {
            const amount = parseFloat(fv.amount);
            if (isNaN(amount)) {
                this.errorMessage.set('Le montant est invalide.');
                return;
            }
            patch.amount = amount;
        }
        if (state.currency) patch.amount_currency_id = fv.amountCurrency;
        if (state.account) patch.account_id = fv.account;
        if (state.category) patch.category_id = fv.category || null;
        if (state.date) patch.date = fv.date;
        if (state.label) patch.label = fv.label;

        this.isSubmitting.set(true);
        this.errorMessage.set(null);

        try {
            if (Object.keys(patch).length > 0) {
                await this.transactionService.updateTransactionsBulk(ids, userId, patch);
            }

            if (state.tags) {
                const tagIds = await this.tagService.resolveTagIds(
                    userId,
                    this.selectedTags().map(t => t.value),
                    this.newTags(),
                );
                await this.transactionService.updateTransactionTagsBulk(ids, tagIds);
            }

            this.modalService.bulkTransaction.editing()?.onSuccess?.();
            this.refreshService.refresh('transaction');
            this.modalService.bulkTransaction.close();
        } catch (error) {
            console.error('Erreur lors de la modification groupée:', error);
            this.errorMessage.set('Erreur lors de la modification groupée des transactions.');
        } finally {
            this.isSubmitting.set(false);
        }
    }

    private async initOptions(): Promise<void> {
        const userId = this.authState.getCurrentUser()?.id;
        if (!userId) return;

        try {
            const {currencies, accounts, categories, tags} = await this.optionsService.getFormOptions(userId);

            this.currenciesOptions.set(currencies);
            this.accountsOptions.set(accounts);
            this.categoriesOptions.set(categories);
            this.tagsOptions.set(tags);

            if (currencies.length > 0) this.form.get('amountCurrency')?.setValue(currencies[0].value);
            if (accounts.length > 0) this.form.get('account')?.setValue(accounts[0].value);
            if (categories.length > 0) this.form.get('category')?.setValue(categories[0].value);
        } catch (error) {
            console.error('Erreur lors du chargement des options:', error);
        }
    }
}
