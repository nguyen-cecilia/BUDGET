import {Component, effect, inject, signal} from '@angular/core';
import {AuthStateService} from '../../core/auth/auth-state.service';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import positiveNumber from '../../core/validators';
import {FORM_ERRORS, creationError, deletionError} from '../../core/form-errors.service';
import {ModalService} from '../../components/modal/modal.service';
import {SubscriptionService} from './subscription.service';
import {Subscription} from './subscription.model';
import {ButtonComponent} from '../../components/button/button.component';
import {LucideLoaderCircle, LucideSave, LucideTrash2} from '@lucide/angular';
import {SelectOption} from '../../components/select/select.component';
import {TransactionOptionsService} from '../transactions/transaction-options.service';
import {AccountService} from '../accounts/account.service';
import {CategoryService} from '../categories/category.service';
import {CurrencyService} from '../currencies/currency.service';
import {FieldErrorComponent} from '../../components/form-error/field-error.component';
import {FormErrorComponent} from '../../components/form-error/form-error.component';
import {RefreshService} from '../../core/refresh.service';
import {DatePickerComponent} from '../../components/datepicker/datepicker.component';

@Component({
    selector: 'app-subscription-update',
    imports: [
        FormsModule,
        ReactiveFormsModule,
        ButtonComponent,
        LucideLoaderCircle,
        LucideSave,
        LucideTrash2,
        FieldErrorComponent,
        FormErrorComponent,
        DatePickerComponent
    ],
    templateUrl: './subscription-update.component.html',
})
export class SubscriptionUpdate {
    private authState = inject(AuthStateService);
    private fb = inject(FormBuilder);
    private subscriptionService = inject(SubscriptionService);
    private optionsService = inject(TransactionOptionsService);
    private accountService = inject(AccountService);
    private categoryService = inject(CategoryService);
    private currencyService = inject(CurrencyService);
    private refreshService = inject(RefreshService);
    protected modalService = inject(ModalService);

    subscriptionForm: FormGroup;

    errorMessage = signal<string | null>(null);
    isSubmitting = signal(false);
    currenciesOptions = signal<SelectOption[]>([]);
    accountsOptions = signal<SelectOption[]>([]);
    categoriesOptions = signal<SelectOption[]>([]);
    confirmDelete = signal(false);
    isDeleting = signal(false);

    constructor() {
        this.subscriptionForm = this.fb.group({
            label: ['', [Validators.required]],
            amount: ['', [Validators.required, positiveNumber]],
            currencyId: ['', [Validators.required]],
            isActive: [true],
            accountId: ['', [Validators.required]],
            categoryId: [''],
            frequency: ['monthly'],
            nextPaymentDate: ['', [Validators.required]],
        });

        this.subscriptionForm.get('frequency')?.valueChanges.subscribe(freq => {
            this.subscriptionForm.patchValue({nextPaymentDate: this.subscriptionService.computeNextDateFrom('today', freq)});
        });

        effect(() => {
            const editing = this.modalService.subscription.editing();
            if (editing) {
                this.fillForm(editing);
            } else {
                this.resetForm();
                this.confirmDelete.set(false);
            }
        });

        effect(() => {
            if (!this.authState.isLoading()) {
                const userId = this.authState.getCurrentUser()?.id;
                if (userId) {
                    this.refreshService.trigger();
                    const key = this.refreshService.lastKey();
                    if (!key || ['account', 'category', 'currency'].includes(key)) {
                        this.initOptions(userId);
                    }
                }
            }
        });
    }

    async submitSubscription() {
        if (this.subscriptionForm.invalid) {
            this.errorMessage.set(FORM_ERRORS.REQUIRED);
            return;
        }

        this.isSubmitting.set(true);
        this.errorMessage.set(null);

        try {
            const userId = this.authState.getCurrentUser()?.id;
            if (!userId) {
                throw new Error('Utilisateur non authentifié');
            }

            const editing = this.modalService.subscription.editing();
            const fv = this.subscriptionForm.getRawValue();

            const payload = {
                label: fv.label || '',
                amount: parseFloat(fv.amount),
                currency_id: String(fv.currencyId),
                is_active: fv.isActive,
                account_id: fv.accountId,
                category_id: fv.categoryId || null,
                frequency: fv.frequency,
                next_payment_date: fv.nextPaymentDate,
            };

            if (editing) {
                await this.subscriptionService.updateSubscription(editing.id, payload);
            } else {
                await this.subscriptionService.createSubscription(userId, payload);
            }

            this.refreshService.refresh('subscription');

            this.resetForm();

            this.modalService.subscription.close();
        } catch (error) {
            console.error('Erreur lors de la création de l\'abonnement:', error);
            this.errorMessage.set(creationError('l\'abonnement'));
        } finally {
            this.isSubmitting.set(false);
        }
    }

    async deleteSubscription(): Promise<void> {
        const editing = this.modalService.subscription.editing();
        if (!editing) return;

        this.isDeleting.set(true);

        try {
            await this.subscriptionService.deleteSubscription(editing.id, editing.user_id);

            this.refreshService.refresh('subscription');

            this.modalService.subscription.close();
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            this.errorMessage.set(deletionError());
        } finally {
            this.isDeleting.set(false);
        }
    }

    private async initOptions(userId: string) {
        try {
            const [currencies, accounts, categories] = await Promise.all([
                this.optionsService.getCurrenciesOptions(userId),
                this.optionsService.getAccountsOptions(userId, false),
                this.optionsService.getCategoriesOptions(userId, false, true),
            ]);

            this.currenciesOptions.set(currencies);
            this.accountsOptions.set(accounts);
            this.categoriesOptions.set(categories);

            if (currencies.length > 0 && !this.subscriptionForm.get('currencyId')?.value) {
                this.subscriptionForm.get('currencyId')?.setValue(String(currencies[0].value));
            }
            if (accounts.length > 0 && !this.subscriptionForm.get('accountId')?.value) {
                this.subscriptionForm.get('accountId')?.setValue(String(accounts[0].value));
            }
            if (categories.length > 0 && !this.subscriptionForm.get('categoryId')?.value) {
                this.subscriptionForm.get('categoryId')?.setValue(String(categories[0].value));
            }
        } catch (error) {
            console.error('Erreur lors du chargement des options:', error);
        }
    }

    private fillForm(subscription: Subscription): void {
        this.subscriptionForm.patchValue({
            label: subscription.label,
            amount: subscription.amount,
            currencyId: String(subscription.currency_id),
            isActive: subscription.is_active,
            accountId: subscription.account_id,
            categoryId: subscription.category_id ?? '',
            frequency: subscription.frequency,
            nextPaymentDate: subscription.next_payment_date,
        });
    }

    private resetForm(): void {
        this.subscriptionForm.reset({
            label: '',
            amount: '',
            currencyId: this.currenciesOptions().length > 0 ? String(this.currenciesOptions()[0].value) : '',
            isActive: true,
            accountId: this.accountsOptions().length > 0 ? String(this.accountsOptions()[0].value) : '',
            categoryId: this.categoriesOptions().length > 0 ? String(this.categoriesOptions()[0].value) : '',
            frequency: 'monthly',
            nextPaymentDate: this.subscriptionService.computeNextDateFrom('today', 'monthly'),
        });
    }
}
