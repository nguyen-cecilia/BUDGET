import {Component, computed, effect, inject, signal} from '@angular/core';
import {ButtonComponent} from '../../components/button/button.component';
import {LucideLoaderCircle, LucideSave} from '@lucide/angular';
import {ModalService} from '../../components/modal/modal.service';
import {AuthStateService} from '../../core/auth/auth-state.service';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {AccountService} from './account.service';
import {Account} from './account.model';
import {FORM_ERRORS, creationError} from '../../core/form-errors.service';
import {FieldErrorComponent} from '../../components/form-error/field-error.component';
import {FormErrorComponent} from '../../components/form-error/form-error.component';
import {RefreshService} from '../../core/refresh.service';
import {CurrencyService} from '../currencies/currency.service';
import {UserCurrencies} from '../currencies/currency.model';
import {SelectComponent, SelectOption} from '../../components/select/select.component';

@Component({
    selector: 'app-account-update',
    imports: [
        ButtonComponent,
        LucideLoaderCircle,
        LucideSave,
        FormsModule,
        ReactiveFormsModule,
        FieldErrorComponent,
        FormErrorComponent,
        SelectComponent,
    ],
    templateUrl: './account-update.component.html',
})
export class AccountUpdateComponent {
    private authState = inject(AuthStateService);
    private fb = inject(FormBuilder);
    private accountService = inject(AccountService);
    private refreshService = inject(RefreshService);
    protected modalService = inject(ModalService);
    private currencyService = inject(CurrencyService);

    accountForm: FormGroup;

    errorMessage = signal<string | null>(null);
    isSubmitting = signal(false);
    accounts = signal<Account[]>([])
    currencies = signal<UserCurrencies[]>([]);
    selectedCurrency = signal<string | number>('');

    currencyOptions = computed<SelectOption[]>(() =>
        this.currencies().map(c => ({
            value: c.currency_id,
            label: `${c.label} (${c.symbol})`,
        }))
    );

    constructor() {
        this.accountForm = this.fb.group({
            label: ['', [Validators.required]],
            isDefault: [false],
            isActive: [true],
            currencyId: [''],
        });

        effect(() => {
            const editing = this.modalService.account.editing();
            if (editing) {
                this.fillForm(editing);
            } else {
                this.resetForm();
            }
        });

        effect(() => {
            if (this.modalService.account.isOpen()) {
                const userId = this.authState.getCurrentUser()?.id;
                if (userId) {
                    this.accountService.getAllAccountsByUser(userId, true)
                        .then(data => this.accounts.set(data));
                    this.currencyService.getUserCurrencies(userId)
                        .then(data => this.currencies.set(data));
                }
            }
        });

        this.accountForm.get('isActive')?.valueChanges.subscribe(() => this.updateIsDefaultState());

        effect(() => {
            this.hasAnotherDefault();
            this.updateIsDefaultState();
        });
    }

    hasAnotherDefault = computed(() => {
        const editing = this.modalService.account.editing();
        return this.accounts().some(a => a.is_default && a.id !== editing?.id);
    });

    async submitAccount() {
        if (this.accountForm.invalid) {
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

            const editing = this.modalService.account.editing();
            const fv = this.accountForm.getRawValue();

            const payload = {
                label: fv.label || '',
                is_default: fv.isDefault,
                is_active: fv.isActive,
                currency_id: this.selectedCurrency() ? String(this.selectedCurrency()) : null,
            }

            if (editing) {
                // Modification du compte
                await this.accountService.updateAccount(editing.id, userId, payload);
            } else {
                // Création du compte
                await this.accountService.createAccount(userId, payload);
            }

            this.refreshService.refresh('account');

            this.resetForm();

            this.modalService.account.close();
        } catch (error) {
            console.error('Erreur lors de la création du compte:', error);
            this.errorMessage.set(creationError('le compte'));
        } finally {
            this.isSubmitting.set(false);
        }
    }

    private fillForm(account: Account): void {
        this.selectedCurrency.set(account.currency_id ?? '');
        this.accountForm.patchValue({
            label: account.label,
            isDefault: account.is_default,
            isActive: account.is_active,
            currencyId: account.currency_id ?? '',
        });
    }

    private resetForm(): void {
        this.selectedCurrency.set('');
        this.accountForm.reset({
            label: '',
            isDefault: false,
            isActive: true,
            currencyId: '',
        });
    }

    private updateIsDefaultState(): void {
        const isActiveValue = this.accountForm.get('isActive')?.value ?? true;
        const control = this.accountForm.get('isDefault');

        if (this.hasAnotherDefault() || !isActiveValue) {
            if (!isActiveValue) {
                control?.setValue(false, {emitEvent: false});
            }
            control?.disable();
        } else {
            control?.enable();
        }
    }
}
