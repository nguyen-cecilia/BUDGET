import {Component, effect, inject, signal} from '@angular/core';
import {ButtonComponent} from '../../components/button/button.component';
import {LucideFrown, LucidePencil, LucidePiggyBank, LucidePlus} from '@lucide/angular';
import {AuthStateService} from '../auth/auth-state.service';
import {SavingsGoalService} from './savings-goal.service';
import {CurrencyService} from '../currencies/currency.service';
import {SavingsGoal} from './savings-goal.model';
import {ModalComponent} from '../../components/modal/modal.component';
import {SavingGoalsUpdateComponent} from './saving-goals-update.component';
import {ModalService} from '../../components/modal/modal.service';
import {CurrencyPipe} from '@angular/common';

@Component({
    selector: 'app-saving-goals',
    imports: [
        ButtonComponent,
        LucidePlus,
        LucidePencil,
        LucidePiggyBank,
        LucideFrown,
        ModalComponent,
        SavingGoalsUpdateComponent,
        CurrencyPipe
    ],
    templateUrl: './savings-goals-listing.component.html',
})
export class SavingsGoalsListingComponent {
    private authState = inject(AuthStateService);
    private goalService = inject(SavingsGoalService);
    protected currencyService = inject(CurrencyService);
    protected modalService = inject(ModalService);

    isLoading = signal(false);
    savingsGoals = signal<SavingsGoal[]>([]);
    isAdding = signal<string | null>(null);

    constructor() {
        effect(() => {
            this.goalService.goalRefreshTrigger();
            this.currencyService.currencyRefreshTrigger();
            const userId = this.authState.getCurrentUser()?.id;
            if (userId) this.getSavingsGoals(userId);
        });
    }

    goalRatio(goal: SavingsGoal) {
        return goal.target_amount > 0 && goal.current_amount > 0
            ? Math.round((goal.current_amount / goal.target_amount) * 100)
            : 0;
    }

    async addAmountToSavingsGoal(goal: SavingsGoal) {
        const userId = this.authState.getCurrentUser()?.id;
        if (!userId || goal.amount_per_month <= 0) return;
        if (this.isAdding()) return;
        if (goal.current_amount >= goal.target_amount) return;

        const newCurrentAmount = Math.min(
            Math.round((goal.current_amount + goal.amount_per_month) * 100) / 100,
            goal.target_amount
        );

        this.isAdding.set(goal.id);

        try {
            await this.goalService.updateSavingsGoal(goal.id, userId, {
                label: goal.label,
                target_amount: goal.target_amount,
                current_amount: newCurrentAmount,
                amount_per_month: goal.amount_per_month,
                currency_id: goal.currency_id,
            });

            this.savingsGoals.update(goals =>
                goals.map(g => g.id === goal.id ? {...g, current_amount: newCurrentAmount} : g)
            );
        } catch (error) {
            console.error('Erreur lors de l\'ajout du montant:', error);
        } finally {
            this.isAdding.set(null);
        }
    }

    private async getSavingsGoals(userId: string) {
        this.isLoading.set(true);

        const [goals] = await Promise.all([
            this.goalService.getAllSavingsGoalsByUser(userId),
        ]);

        this.savingsGoals.set(goals);

        this.isLoading.set(false);
    }
}
