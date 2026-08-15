import {Component, effect, inject, signal} from '@angular/core';
import {AuthStateService} from '../auth/auth-state.service';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import positiveNumber from '../../core/validators';
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

@Component({
    selector: 'app-subscription-update',
    imports: [
        FormsModule,
        ReactiveFormsModule,
        ButtonComponent,
        LucideLoaderCircle,
        LucideSave,
        LucideTrash2
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
    protected modalService = inject(ModalService);

    subscriptionForm: FormGroup;

    errorMessage = signal<string | null>(null);
    isSubmitting = signal(false);
    currenciesOptions = signal<SelectOption[]>([]);
    accountsOptions = signal<SelectOption[]>([]);
    categoriesOptions = signal<SelectOption[]>([]);

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
            this.subscriptionForm.patchValue({nextPaymentDate: this.subscriptionService.computeNextDate(freq)});
        });

        effect(() => {
            const editing = this.modalService.subscription.editing();
            if (editing) {
                this.fillForm(editing);
            } else {
                this.resetForm();
            }
        });

        effect(() => {
            if (!this.authState.isLoading()) {
                const userId = this.authState.getCurrentUser()?.id;
                if (userId) {
                    this.accountService.accountRefreshTrigger();
                    this.categoryService.categoryRefreshTrigger();
                    this.currencyService.currencyRefreshTrigger();
                    this.initOptions(userId);
                }
            }
        });
    }

    async submitSubscription() {
        if (this.subscriptionForm.invalid) {
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

            this.subscriptionService.subscriptionRefreshTrigger.set(
                !this.subscriptionService.subscriptionRefreshTrigger()
            );

            this.resetForm();

            this.modalService.subscription.close();
        } catch (error) {
            console.error('Erreur lors de la création de l\'abonnement:', error);
            this.errorMessage.set('Erreur lors de la création de l\'abonnement');
        } finally {
            this.isSubmitting.set(false);
        }
    }

    async deleteSubscription(): Promise<void> {
        const editing = this.modalService.subscription.editing();
        if (!editing) return;

        const confirmed = confirm('Supprimer cet abonnement ?');
        if (!confirmed) return;

        this.isSubmitting.set(true);

        try {
            await this.subscriptionService.deleteSubscription(editing.id, editing.user_id);

            this.subscriptionService.subscriptionRefreshTrigger.set(
                !this.subscriptionService.subscriptionRefreshTrigger()
            );

            this.modalService.subscription.close();
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            this.errorMessage.set('Erreur lors de la suppression');
        } finally {
            this.isSubmitting.set(false);
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
            nextPaymentDate: this.subscriptionService.computeNextDate('monthly'),
        });
    }
}
