import {Component, computed, effect, inject, signal} from '@angular/core';
import {
    LucideArrowRight,
    LucideAstroid,
    LucideCheck,
    LucideLayers,
    LucideSparkles,
    LucideTag,
    LucideWallet,
    LucideX,
    LucideZap
} from '@lucide/angular';
import {ButtonComponent} from '../../components/button/button.component';
import {RouterLink} from '@angular/router';
import {PieChartComponent} from '../../components/chart/chart.component';
import {AuthStateService} from '../auth/auth-state.service';
import {TransactionService} from '../transactions/transaction.service';
import {SubscriptionService} from '../subscriptions/subscription.service';
import {MonthService} from '../month/month.service';
import {TransactionsByMonth} from '../transactions/transaction.model';
import {Subscription} from '../subscriptions/subscription.model';
import {CurrencyPipe, DatePipe, DecimalPipe} from '@angular/common';
import {ColorService} from '../../core/color.service';
import {TransactionItemComponent} from '../transactions/transaction-item.component';
import {CurrencyService} from '../currencies/currency.service';

@Component({
    selector: 'app-dashboard',
    imports: [
        LucideAstroid,
        LucideZap,
        LucideArrowRight,
        ButtonComponent,
        RouterLink,
        LucideLayers,
        LucideTag,
        LucideWallet,
        PieChartComponent,
        CurrencyPipe,
        DatePipe,
        DecimalPipe,
        TransactionItemComponent,
        LucideSparkles,
        LucideCheck,
        LucideX,
    ],
    templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
    private authState = inject(AuthStateService);
    private transactionService = inject(TransactionService);
    private subscriptionService = inject(SubscriptionService);
    private currencyService = inject(CurrencyService);
    protected monthService = inject(MonthService);
    protected colorService = inject(ColorService);

    isLoading = signal(false);
    transactionsByMonth = signal<TransactionsByMonth | null>(null);
    subscriptions = signal<Subscription[]>([]);
    protected defaultCurrency = this.currencyService.defaultCurrency;

    totalExpenses = computed(() =>
        this.transactionsByMonth()?.transactionsByDay
            .flatMap(d => d.transactions)
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + this.currencyService.convertToDefault(t.amount, t.currency.code), 0) ?? 0
    );

    totalIncomes = computed(() =>
        this.transactionsByMonth()?.transactionsByDay
            .flatMap(d => d.transactions)
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + this.currencyService.convertToDefault(t.amount, t.currency.code), 0) ?? 0
    );

    balance = computed(() => this.totalIncomes() - this.totalExpenses());

    transactionCount = computed(() =>
        this.transactionsByMonth()?.count ?? 0
    );

    subscriptionTotal = computed(() =>
        this.transactionsByMonth()?.transactionsByDay
            .flatMap(d => d.transactions)
            .filter(t => t.is_subscription)
            .reduce((sum, t) => sum + this.currencyService.convertToDefault(t.amount, t.currency.code), 0) ?? 0
    );

    expensesRatio = computed(() =>
        this.totalIncomes() > 0
            ? Math.round((this.totalExpenses() / this.totalIncomes()) * 100)
            : 0
    );

    recentTransactions = computed(() =>
        (this.transactionsByMonth()?.transactionsByDay
            .flatMap(d => d.transactions) ?? [])
            .slice(0, 6)
    );

    subscriptionStatus = computed(() => {
        const subs = this.subscriptions();
        const transactions = this.transactionsByMonth()?.transactionsByDay
            .flatMap(d => d.transactions) ?? [];

        return subs.map(sub => {
            const linked = transactions.filter(t => t.subscription_id === sub.id);
            const paidThisMonth = linked.length > 0;
            const lastTx = paidThisMonth ? linked[0] : undefined;
            const isPast = lastTx ? new Date(lastTx.date) < new Date() : false;

            return {
                ...sub,
                amount: lastTx?.amount ?? 0,
                lastTransactionDate: lastTx?.date,
                currency: lastTx?.currency?.code ?? this.currencyService.defaultCurrency(),
                checked: isPast && paidThisMonth,
            };
        });
    });

    categoriesData = computed(() => {
        const transactions = this.transactionsByMonth()?.transactionsByDay
            .flatMap(d => d.transactions) ?? [];

        const map = new Map<string, { label: string; color: string; total: number }>();

        for (const t of transactions.filter(t => t.type === 'expense')) {
            const label = t.category?.label ?? 'Sans catégorie';
            const color = t.category?.color ?? 'grayMid';
            const key = t.category_id ?? 'none';
            const convertedAmount = this.currencyService.convertToDefault(t.amount, t.currency.code);

            const existing = map.get(key);
            if (existing) existing.total += convertedAmount;
            else map.set(key, {label, color, total: convertedAmount});
        }

        const categories = Array.from(map.values()).sort((a, b) => b.total - a.total);
        const grandTotal = categories.reduce((sum, c) => sum + c.total, 0);

        return {
            categories,
            grandTotal,
            pieLabels: categories.map(c => c.label),
            pieData: categories.map(c => c.total),
            pieColors: categories.map(c => this.colorService.getHex(c.color))
        };
    });

    tagsData = computed(() => {
        const transactions = this.transactionsByMonth()?.transactionsByDay
            .flatMap(d => d.transactions) ?? [];

        const map = new Map<string, number>();

        for (const t of transactions.filter(t => t.type === 'expense')) {
            for (const tag of t.tags ?? []) {
                map.set(tag.label, (map.get(tag.label) ?? 0) + this.currencyService.convertToDefault(t.amount, t.currency.code));
            }
        }

        const tags = Array.from(map.entries())
            .map(([label, total]) => ({label, total}))
            .sort((a, b) => b.total - a.total);

        return {tags, maxTotal: tags[0]?.total ?? 0};
    });

    constructor() {
        effect(() => {
            this.transactionService.transactionRefreshTrigger();
            this.currencyService.currencyRefreshTrigger();
            const userId = this.authState.getCurrentUser()?.id;
            if (userId) this.loadData(userId);
        });
    }

    private async loadData(userId: string) {
        this.isLoading.set(true);

        const monthIndex = this.monthService.getCurrentMonth();
        const year = this.monthService.getCurrentYear();

        const [transactions, subs] = await Promise.all([
            this.transactionService.getTransactionsByMonth(userId, monthIndex, year),
            this.subscriptionService.getAllSubscriptionsByUser(userId),
        ]);

        this.transactionsByMonth.set(transactions);
        this.subscriptions.set(subs);
        await this.currencyService.loadDefaultCurrency(userId);

        this.isLoading.set(false);
    }
}
