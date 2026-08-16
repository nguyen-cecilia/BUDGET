import {Component, effect, inject, signal} from '@angular/core';
import {AuthStateService} from '../auth/auth-state.service';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ModalService} from '../../components/modal/modal.service';
import {SavingsGoalService} from './savings-goal.service';
import {SavingsGoal} from './savings-goal.model';
import {ButtonComponent} from '../../components/button/button.component';
import {LucideLoaderCircle, LucideSave, LucideTrash2} from '@lucide/angular';
import {nonNegativeNumber} from '../../core/validators';
import {SelectOption} from '../../components/select/select.component';
import {TransactionOptionsService} from '../transactions/transaction-options.service';

@Component({
    selector: 'app-saving-goals-update',
    imports: [
        ButtonComponent,
        LucideLoaderCircle,
        LucideSave,
        ReactiveFormsModule,
        LucideTrash2
    ],
    templateUrl: './saving-goals-update.component.html',
})
export class SavingGoalsUpdateComponent {
    private authState = inject(AuthStateService);
    private fb = inject(FormBuilder);
    private goalService = inject(SavingsGoalService);
    private optionsService = inject(TransactionOptionsService);
    protected modalService = inject(ModalService);

    goalForm: FormGroup;

    errorMessage = signal<string | null>(null);
    isSubmitting = signal(false);
    currenciesOptions = signal<SelectOption[]>([]);

    constructor() {
        this.goalForm = this.fb.group({
            label: ['', [Validators.required]],
            targetAmount: ['', [Validators.required, nonNegativeNumber]],
            currentAmount: ['', [nonNegativeNumber]],
            amountPerMonth: ['', [Validators.required, nonNegativeNumber]],
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
            }
        });
    }

    async submitSavingsGoal() {
        if (this.goalForm.invalid) {
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

            const editing = this.modalService.goal.editing();
            const fv = this.goalForm.getRawValue();

            const payload = {
                label: fv.label || '',
                target_amount: parseFloat(fv.targetAmount),
                current_amount: parseFloat(fv.currentAmount) || 0,
                amount_per_month: parseFloat(fv.amountPerMonth),
                currency_id: fv.currencyId,
            };

            if (editing) {
                // Modification de l'objectif
                await this.goalService.updateSavingsGoal(editing.id, userId, payload);
            } else {
                // Création de l'objectif
                await this.goalService.createSavingsGoal(userId, payload);
            }

            this.goalService.goalRefreshTrigger.set(
                !this.goalService.goalRefreshTrigger()
            );

            this.resetForm();

            this.modalService.goal.close();
        } catch (error) {
            console.error('Erreur lors de la création de l\'objectif:', error);
            this.errorMessage.set('Erreur lors de la création de l\'objectif');
        } finally {
            this.isSubmitting.set(false);
        }
    }

    async deleteSavingsGoal(): Promise<void> {
        const editing = this.modalService.goal.editing();
        if (!editing) return;

        const confirmed = confirm('Supprimer cet objectif d\'épargne ?');
        if (!confirmed) return;

        this.isSubmitting.set(true);

        try {
            await this.goalService.deleteSavingsGoal(editing.id, editing.user_id);

            this.goalService.goalRefreshTrigger.set(
                !this.goalService.goalRefreshTrigger()
            );

            this.modalService.goal.close();
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            this.errorMessage.set('Erreur lors de la suppression');
        } finally {
            this.isSubmitting.set(false);
        }
    }

    private fillForm(goal: SavingsGoal): void {
        this.goalForm.patchValue({
            label: goal.label,
            targetAmount: goal.target_amount,
            currentAmount: goal.current_amount,
            amountPerMonth: goal.amount_per_month,
            currencyId: goal.currency_id,
        });
    }

    private resetForm(): void {
        const currencies = this.currenciesOptions();

        this.goalForm.reset({
            label: '',
            targetAmount: '',
            currentAmount: '',
            amountPerMonth: '',
            currencyId: currencies.length > 0 ? currencies[0].value : '',
        });
    }

    private async initOptions(userId: string) {
        try {
            const [currencies] = await Promise.all([
                this.optionsService.getCurrenciesOptions(userId),
            ]);

            this.currenciesOptions.set(currencies);

            if (currencies.length > 0) {
                this.goalForm.get('currencyId')?.setValue(currencies[0].value);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des options:', error);
        }
    }
}
