import {Component, effect, inject, signal} from '@angular/core';
import {AuthStateService} from '../../core/auth/auth-state.service';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ModalService} from '../../components/modal/modal.service';
import {SavingsGoalService} from './savings-goal.service';
import {SavingsGoal} from './savings-goal.model';
import {ButtonComponent} from '../../components/button/button.component';
import {LucideLoaderCircle, LucideRotateCcw, LucideSave, LucideTrash2} from '@lucide/angular';
import {nonNegativeNumber} from '../../core/validators';
import {FORM_ERRORS, creationError, deletionError} from '../../core/form-errors.service';
import {SelectOption} from '../../components/select/select.component';
import {TransactionOptionsService} from '../transactions/transaction-options.service';
import {FieldErrorComponent} from '../../components/form-error/field-error.component';
import {FormErrorComponent} from '../../components/form-error/form-error.component';
import {RefreshService} from '../../core/refresh.service';
import {CurrencyPipe} from '@angular/common';
import {CurrencyService} from '../currencies/currency.service';

@Component({
    selector: 'app-saving-goals-update',
    imports: [
        ButtonComponent,
        LucideLoaderCircle,
        LucideSave,
        ReactiveFormsModule,
        LucideTrash2,
        FieldErrorComponent,
        FormErrorComponent,
        CurrencyPipe,
        LucideRotateCcw
    ],
    templateUrl: './saving-goals-update.component.html',
})
export class SavingGoalsUpdateComponent {
    private authState = inject(AuthStateService);
    private fb = inject(FormBuilder);
    private goalService = inject(SavingsGoalService);
    private optionsService = inject(TransactionOptionsService);
    private refreshService = inject(RefreshService);
    private currencyService = inject(CurrencyService);
    protected modalService = inject(ModalService);

    goalForm: FormGroup;

    errorMessage = signal<string | null>(null);
    isSubmitting = signal(false);
    currenciesOptions = signal<SelectOption[]>([]);
    confirmDelete = signal(false);
    isDeleting = signal(false);
    private userCurrencies = signal<{ currency_id: string; code: string }[]>([]);

    resetCurrentAmount(): void {
        this.goalForm.get('currentAmount')?.setValue(0);
    }

    constructor() {
        this.goalForm = this.fb.group({
            label: ['', [Validators.required]],
            targetAmount: ['', [Validators.required, nonNegativeNumber]],
            currentAmount: ['', [nonNegativeNumber]],
            durationMonths: [1, [Validators.required, Validators.min(1)]],
            currencyId: [''],
        });

        effect(() => {
            if (!this.authState.isLoading()) {
                const userId = this.authState.getCurrentUser()?.id;
                if (userId) {
                    this.initOptions(userId);
                }
            }
        });

        effect(() => {
            const editing = this.modalService.goal.editing();
            if (editing) {
                this.fillForm(editing);
            } else {
                this.resetForm();
                this.confirmDelete.set(false);
            }
        });
    }

    get amountPerMonth(): number {
        const target = Number(this.goalForm.get('targetAmount')?.value) || 0;
        const months = Number(this.goalForm.get('durationMonths')?.value) || 1;
        return months > 0 ? Math.round((target / months) * 100) / 100 : 0;
    }

    get selectedCurrencyCode(): string {
        const id = String(this.goalForm?.get('currencyId')?.value);
        return this.userCurrencies().find(c => String(c.currency_id) === id)?.code ?? 'EUR';
    }

    async submitSavingsGoal() {
        if (this.goalForm.invalid) {
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

            const editing = this.modalService.goal.editing();
            const fv = this.goalForm.getRawValue();

            const payload = {
                label: fv.label || '',
                target_amount: parseFloat(fv.targetAmount),
                current_amount: parseFloat(fv.currentAmount) || 0,
                amount_per_month: this.amountPerMonth,
                duration_months: Number(fv.durationMonths),
                currency_id: fv.currencyId,
            };

            if (editing) {
                // Modification de l'objectif
                await this.goalService.updateSavingsGoal(editing.id, userId, payload);
            } else {
                // Création de l'objectif
                await this.goalService.createSavingsGoal(userId, payload);
            }

            this.refreshService.refresh('goal');

            this.resetForm();

            this.modalService.goal.close();
        } catch (error) {
            console.error('Erreur lors de la création de l\'objectif:', error);
            this.errorMessage.set(creationError('de l\'objectif'));
        } finally {
            this.isSubmitting.set(false);
        }
    }

    async deleteSavingsGoal(): Promise<void> {
        const editing = this.modalService.goal.editing();
        if (!editing) return;

        this.isDeleting.set(true);

        try {
            await this.goalService.deleteSavingsGoal(editing.id, editing.user_id);

            this.refreshService.refresh('goal');

            this.modalService.goal.close();
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            this.errorMessage.set(deletionError());
        } finally {
            this.isDeleting.set(false);
        }
    }

    private fillForm(goal: SavingsGoal): void {
        this.goalForm.patchValue({
            label: goal.label,
            targetAmount: goal.target_amount,
            currentAmount: goal.current_amount,
            durationMonths: goal.duration_months,
            currencyId: goal.currency_id,
        });
    }

    private resetForm(): void {
        const currencies = this.currenciesOptions();

        this.goalForm.reset({
            label: '',
            targetAmount: '',
            currentAmount: '',
            durationMonths: 1,
            currencyId: currencies.length > 0 ? currencies[0].value : '',
        });
    }

    private async initOptions(userId: string) {
        try {
            const [currencies] = await Promise.all([
                this.optionsService.getCurrenciesOptions(userId),
            ]);

            this.currenciesOptions.set(currencies);

            const userCurrencies = await this.currencyService.getUserCurrencies(userId);
            this.userCurrencies.set(userCurrencies.map(c => ({ currency_id: c.currency_id, code: c.code })));

            if (currencies.length > 0) {
                this.goalForm.get('currencyId')?.setValue(currencies[0].value);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des options:', error);
        }
    }
}
