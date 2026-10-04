import {Component, EventEmitter, inject, Input, Output, signal} from '@angular/core';
import {CurrencyPipe, DatePipe} from '@angular/common';
import {LucideArrowDownLeft, LucideArrowUpRight, LucideCopy, LucideLoaderCircle, LucideSparkles} from '@lucide/angular';
import {Transaction} from './transaction.model';
import {ColorService} from '../../core/color.service';
import {ModalService} from '../../components/modal/modal.service';
import {CurrencyService} from '../currencies/currency.service';
import {DateService} from '../../core/date.service';
import {AuthStateService} from '../../core/auth/auth-state.service';
import {TransactionService} from './transaction.service';
import {RefreshService} from '../../core/refresh.service';
import {ButtonComponent} from '../../components/button/button.component';

@Component({
    selector: 'app-transaction-item',
    imports: [
        CurrencyPipe,
        DatePipe,
        LucideArrowDownLeft,
        LucideArrowUpRight,
        LucideSparkles,
        LucideCopy,
        LucideLoaderCircle,
        ButtonComponent
    ],
    templateUrl: './transaction-item.component.html',
    host: {
        'class': 'block',
    }
})
export class TransactionItemComponent {
    @Input({required: true}) transaction!: Transaction;
    @Input() hasDate = false;
    @Input() isSelected = false;
    @Input() showCheckbox = false;
    @Output() selectionChange = new EventEmitter<void>();

    protected colorService = inject(ColorService);
    protected modalService = inject(ModalService);
    protected currencyService = inject(CurrencyService);
    protected dateService = inject(DateService);
    protected authState = inject(AuthStateService);
    protected transactionService = inject(TransactionService);
    protected refreshService = inject(RefreshService);

    isDuplicating = signal(false);

    async duplicate(event: Event): Promise<void> {
        event.stopPropagation();
        const userId = this.authState.getCurrentUser()?.id;
        if (!userId || this.isDuplicating()) return;

        this.isDuplicating.set(true);
        try {
            const created = await this.transactionService.createTransaction(userId, {
                type: this.transaction.type,
                amount: this.transaction.amount,
                amount_currency_id: this.transaction.amount_currency_id,
                label: `${this.transaction.label} copie`,
                date: this.transaction.date,
                account_id: this.transaction.account_id,
                category_id: this.transaction.category_id ?? undefined,
                is_subscription: false,
                subscription_id: null,
            });

            const tagIds = this.transaction.tags?.map(t => t.id) ?? [];
            if (tagIds.length > 0) {
                await this.transactionService.addTagsToTransaction(created.id, tagIds);
            }

            this.refreshService.refresh('transaction');
        } catch (error) {
            console.error('Erreur lors de la duplication de la transaction:', error);
        } finally {
            this.isDuplicating.set(false);
        }
    }
}
