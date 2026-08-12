import {Component, inject, Input} from '@angular/core';
import {CurrencyPipe, DatePipe} from '@angular/common';
import {LucideArrowDownLeft, LucideArrowUpRight, LucideSparkles} from '@lucide/angular';
import {Transaction} from './transaction.model';
import {ColorService} from '../../core/color.service';
import {ModalService} from '../../components/modal/modal.service';
import {CurrencyService} from '../currencies/currency.service';

@Component({
    selector: 'app-transaction-item',
    imports: [
        CurrencyPipe,
        DatePipe,
        LucideArrowDownLeft,
        LucideArrowUpRight,
        LucideSparkles
    ],
    template: `
        <div
            class="flex items-center justify-between gap-4 rounded px-2 py-4 cursor-pointer transition-all hover:bg-beige-light"
            (click)="modalService.transaction.openEdit(transaction)"
            (keydown.enter)="modalService.transaction.openEdit(transaction)"
            (keydown.space)="modalService.transaction.openEdit(transaction)"
            tabindex="0"
            role="button"
        >
            <div class="flex items-center gap-6">
                <div
                    class="aspect-square border rounded-full p-3 {{ colorService.getBackground(transaction.category?.color ?? 'grayMid') }}">
                    @if (transaction.type === 'income') {
                        <svg lucideArrowDownLeft [size]="20"></svg>
                    } @else {
                        <svg lucideArrowUpRight [size]="20"></svg>
                    }
                </div>
                <div>
                    <div class="flex items-center gap-1.5">
                        <h3>{{ transaction.label }}</h3>
                        @if (transaction.is_subscription) {
                            <svg lucideSparkles [size]="20"></svg>
                        }
                    </div>
                    <p class="text-sm text-gray">
                        {{ transaction.account.label }} ·
                        <span
                            class="font-semibold underline decoration-2 underline-offset-3 {{ colorService.getDecoration(transaction.category?.color ?? 'gray') }}"
                        >
                            {{ transaction.category?.label ?? 'Sans catégorie' }}
                        </span>
                        @if (hasDate) {
                            · {{ transaction.date|date:'dd/MM/yyyy' }}
                        }
                        @if (transaction.tags && transaction.tags.length > 0) {
                            · {{ transaction.tags.map(tag => '#' + tag.label).join(', ') }}
                        }
                    </p>
                </div>
            </div>
            <div class="text-right">
                <p class="font-display text-md">{{ transaction.type === 'expense' ? '-' : '+' }}{{ transaction.amount|currency:transaction.currency.code }}</p>
                @if (transaction.currency.code !== currencyService.defaultCurrency()) {
                    <p class="text-sm text-gray">≈ {{ transaction.type === 'expense' ? '-' : '+' }}{{ currencyService.convertToDefault(transaction.amount, transaction.currency.code)|currency:currencyService.defaultCurrency() }}</p>
                }
            </div>
        </div>
    `,
})
export class TransactionItemComponent {
    @Input({required: true}) transaction!: Transaction;
    @Input() hasDate = false;

    protected colorService = inject(ColorService);
    protected modalService = inject(ModalService);
    protected currencyService = inject(CurrencyService);
}
