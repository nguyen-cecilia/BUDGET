import {Component, computed, effect, inject, signal} from '@angular/core';
import {AuthStateService} from '../auth/auth-state.service';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {ModalService} from '../../components/modal/modal.service';
import {CurrencyService} from './currency.service';
import {Currency, UserCurrencies} from './currency.model';
import {SelectComponent, SelectOption} from '../../components/select/select.component';
import {ButtonComponent} from '../../components/button/button.component';
import {LucideLoaderCircle, LucideSave, LucideTrash2} from '@lucide/angular';
import {FORM_ERRORS, creationError, deletionError} from '../../core/form-errors.service';
import {FormErrorComponent} from '../../components/form-error/form-error.component';

@Component({
    selector: 'app-currency-update',
    imports: [
        FormsModule,
        ReactiveFormsModule,
        SelectComponent,
        ButtonComponent,
        LucideTrash2,
        LucideLoaderCircle,
        LucideSave,
        FormErrorComponent
    ],
    templateUrl: './currency-update.component.html',
})
export class CurrencyUpdateComponent {
    private authState = inject(AuthStateService);
    private fb = inject(FormBuilder);
    private currencyService = inject(CurrencyService);
    protected modalService = inject(ModalService);

    currencyForm: FormGroup;

    errorMessage = signal<string | null>(null);
    isSubmitting = signal(false);
    allCurrencies = signal<Currency[]>([]);
    userCurrencies = signal<UserCurrencies[]>([]);
    selectedCurrency = signal<string | number>('');
    confirmDelete = signal(false);
    isDeleting = signal(false);

    constructor() {
        this.currencyForm = this.fb.group({
            currencyId: ['', [Validators.required]],
            isDefault: [false],
        });

        effect(() => {
            if (this.modalService.currency.isOpen()) {
                const userId = this.authState.getCurrentUser()?.id;
                if (userId) {
                    this.currencyService.getAllCurrencies().then(data => this.allCurrencies.set(data));
                    this.currencyService.getUserCurrencies(userId).then(data => this.userCurrencies.set(data));
                }
            }
        });

        effect(() => {
            const editing = this.modalService.currency.editing();
            if (editing) {
                this.fillForm(editing);
            } else {
                this.resetForm();
                this.confirmDelete.set(false);
            }
        });

        effect(() => {
            this.hasAnotherDefault();
            this.updateIsDefaultState();
        });
    }

    availableCurrencies = computed<SelectOption[]>(() => {
        const attached = new Set(this.userCurrencies().map(c => c.currency_id));
        const editing = this.modalService.currency.editing();
        return this.allCurrencies()
            .filter(c => !attached.has(c.id) || c.id === editing?.currency_id)
            .map(c => ({value: c.id, label: `${c.label} (${c.symbol})`}));
    });

    hasAnotherDefault = computed(() => {
        const editing = this.modalService.currency.editing();
        return this.userCurrencies().some(c => c.is_default && c.currency_id !== editing?.currency_id && c.user_id === editing?.user_id);
    });

    async submitCurrency() {
        this.currencyForm.get('currencyId')?.setValue(String(this.selectedCurrency()));

        if (this.currencyForm.invalid) {
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

            const editing = this.modalService.currency.editing();
            const fv = this.currencyForm.getRawValue();

            if (editing) {
                // Modification de la devise
                await this.currencyService.updateUserCurrency(editing.currency_id, userId, fv.isDefault);
            } else {
                // Ajout de la devise
                await this.currencyService.createUserCurrency(userId, fv.currencyId, fv.isDefault || this.userCurrencies().length === 0);
            }

            this.currencyService.currencyRefreshTrigger.set(
                !this.currencyService.currencyRefreshTrigger()
            );

            this.selectedCurrency.set('');
            this.resetForm();
            this.modalService.currency.close();
        } catch (error) {
            console.error('Erreur lors de la création de la devise:', error);
            this.errorMessage.set(creationError('de la devise'));
        } finally {
            this.isSubmitting.set(false);
        }
    }

    async removeCurrency(): Promise<void> {
        const editing = this.modalService.currency.editing();
        if (!editing) return;

        this.isDeleting.set(true);

        try {
            const userId = this.authState.getCurrentUser()?.id;
            if (!userId) throw new Error('Utilisateur non authentifié');

            await this.currencyService.deleteUserCurrency(editing.currency_id, userId);

            this.currencyService.currencyRefreshTrigger.set(
                !this.currencyService.currencyRefreshTrigger()
            );

            this.modalService.currency.close();
        } catch (error) {
            console.error('Erreur lors de la suppression de la devise:', error);
            this.errorMessage.set(deletionError());
        } finally {
            this.isDeleting.set(false);
        }
    }

    private fillForm(currency: UserCurrencies): void {
        this.selectedCurrency.set(currency.currency_id);
        this.currencyForm.patchValue({
            currencyId: currency.currency_id,
            isDefault: currency.is_default,
        });
    }

    private resetForm(): void {
        this.selectedCurrency.set('');
        this.currencyForm.reset({
            currencyId: '',
            isDefault: false,
        });
    }

    private updateIsDefaultState(): void {
        const control = this.currencyForm.get('isDefault');
        if (this.hasAnotherDefault()) {
            control?.setValue(false, {emitEvent: false});
            control?.disable();
        } else {
            control?.enable();
        }
    }
}
