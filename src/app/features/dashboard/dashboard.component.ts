import {Component, computed, effect, inject, signal} from '@angular/core';
import {
    LucideArrowRight,
    LucideAstroid,
    LucideCalendarDays,
    LucideChartPie,
    LucideCheck,
    LucideLayers,
    LucidePartyPopper,
    LucidePiggyBank,
    LucideSnail,
    LucideSparkles,
    LucideTag,
    LucideWallet,
    LucideX,
    LucideZap
} from '@lucide/angular';
import {ButtonComponent} from '../../components/button/button.component';
import {RouterLink} from '@angular/router';
import {DonutChartComponent} from '../../components/chart/donut-chart.component';
import {AuthStateService} from '../auth/auth-state.service';
import {TransactionService} from '../transactions/transaction.service';
import {SubscriptionService} from '../subscriptions/subscription.service';
import {MonthService} from '../month/month.service';
import {Transaction, TransactionsByMonth} from '../transactions/transaction.model';
import {Subscription} from '../subscriptions/subscription.model';
import {CurrencyPipe, DatePipe, DecimalPipe} from '@angular/common';
import {ColorService} from '../../core/color.service';
import {TransactionItemComponent} from '../transactions/transaction-item.component';
import {CurrencyService} from '../currencies/currency.service';
import {SavingsGoalService} from '../saving-goals/savings-goal.service';
import {SavingsGoal} from '../saving-goals/savings-goal.model';
import {CategoryType} from '../categories/category.model';

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
        DonutChartComponent,
        CurrencyPipe,
        DatePipe,
        DecimalPipe,
        TransactionItemComponent,
        LucideSparkles,
        LucideCheck,
        LucideX,
        LucideCalendarDays,
        LucidePartyPopper,
        LucideSnail,
        LucidePiggyBank,
        LucideChartPie,
    ],
    templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
    private authState = inject(AuthStateService);
    private transactionService = inject(TransactionService);
    private subscriptionService = inject(SubscriptionService);
    private goalService = inject(SavingsGoalService);
    protected currencyService = inject(CurrencyService);
    protected monthService = inject(MonthService);
    protected colorService = inject(ColorService);

    isLoading = signal(false);
    transactionsByMonth = signal<TransactionsByMonth | null>(null);
    subscriptions = signal<Subscription[]>([]);
    upcomingTransactions = signal<Transaction[]>([]);
    savingsGoals = signal<SavingsGoal[]>([]);
    protected defaultCurrency = this.currencyService.defaultCurrency;

    totalExpenses = computed(() =>
        this.transactionsByMonth()?.transactionsByDay
            .flatMap(d => d.transactions)
            .filter(t => t.type === 'expense')
            .filter(t => this.isPastOrToday(t.date))
            .filter(t => this.currencyService.canConvert(t.currency.code))
            .reduce((sum, t) => sum + this.currencyService.convertToDefault(t.amount, t.currency.code), 0) ?? 0
    );

    totalIncomes = computed(() =>
        this.transactionsByMonth()?.transactionsByDay
            .flatMap(d => d.transactions)
            .filter(t => t.type === 'income')
            .filter(t => this.isPastOrToday(t.date))
            .filter(t => this.currencyService.canConvert(t.currency.code))
            .reduce((sum, t) => sum + this.currencyService.convertToDefault(t.amount, t.currency.code), 0) ?? 0
    );

    balance = computed(() => this.totalIncomes() - this.totalExpenses());

    transactionCount = computed(() =>
        this.transactionsByMonth()?.count ?? 0
    );

    subscriptionTotal = computed(() =>
        this.subscriptions()
            .filter(s => this.currencyService.canConvert(s.currency.code))
            .reduce(
                (sum, s) =>
                    sum + this.currencyService.convertToDefault(this.monthlyEquivalent(s), s.currency.code),
                0
            )
    );

    remainingToPay = computed(() =>
        (this.transactionsByMonth()?.transactionsByDay
            .flatMap(d => d.transactions) ?? [])
            .filter(t => t.type === 'expense')
            .filter(t => this.isFuture(t.date))
            .filter(t => this.currencyService.canConvert(t.currency.code))
            .reduce((sum, t) => sum + this.currencyService.convertToDefault(t.amount, t.currency.code), 0)
    );

    expensesRatio = computed(() =>
        this.totalIncomes() > 0
            ? Math.round((this.totalExpenses() / this.totalIncomes()) * 100)
            : 0
    );

    recentTransactions = computed(() =>
        (this.transactionsByMonth()?.transactionsByDay
            .flatMap(d => d.transactions) ?? [])
            .filter(t => this.isPastOrToday(t.date))
            .slice(0, 6)
    );

    subscriptionStatus = computed(() => {
        const subs = this.subscriptions();
        const transactions = this.transactionsByMonth()?.transactionsByDay
            .flatMap(d => d.transactions) ?? [];

        return subs
            .map(sub => {
                const linked = transactions.filter(t => t.subscription_id === sub.id);
                const paidThisMonth = linked.length > 0;
                const lastTx = paidThisMonth ? linked[0] : undefined;
                const isPast = lastTx ? this.isPastOrToday(lastTx.date) : false;

                return {
                    ...sub,
                    last_payment_date: lastTx?.date,
                    checked: isPast && paidThisMonth,
                };
            })
            .sort((a, b) => Number(a.checked) - Number(b.checked));
    });

    upcomingDebits = computed(() => {
        const days = new Map<string, {
            date: Date;
            items: { label: string; amount: number; isSubscription: boolean }[]
        }>();

        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            days.set(this.formatDayKey(date), {date, items: []});
        }

        for (const t of this.upcomingTransactions()) {
            if (t.is_subscription) continue;
            const bucket = days.get(String(t.date).slice(0, 10));
            if (!bucket || !this.currencyService.canConvert(t.currency.code)) continue;
            bucket.items.push({
                label: t.label,
                amount: this.currencyService.convertToDefault(t.amount, t.currency.code),
                isSubscription: false,
            });
        }

        const todayKey = this.formatDayKey(new Date());

        for (const sub of this.subscriptions()) {
            if (!sub.is_active) continue;
            if (!this.currencyService.canConvert(sub.currency.code)) continue;

            const paidToday = this.upcomingTransactions().some(
                t => t.subscription_id === sub.id && String(t.date).slice(0, 10) === todayKey
            );

            const targetKey = paidToday ? todayKey : String(sub.next_payment_date).slice(0, 10);
            const bucket = days.get(targetKey);
            if (!bucket) continue;

            bucket.items.push({
                label: sub.label,
                amount: this.currencyService.convertToDefault(sub.amount, sub.currency.code),
                isSubscription: true,
            });
        }

        return Array.from(days.values()).map(({date, items}) => ({
            key: this.formatDayKey(date),
            dayLabel: this.formatDayLabel(date),
            dayNumber: date.getDate(),
            items,
        }));
    });

    budgetData = computed(() => {
        const transactions = this.transactionsByMonth()?.transactionsByDay
            .flatMap(d => d.transactions) ?? [];

        const income = transactions
            .filter(t => t.type === 'income')
            .filter(t => this.currencyService.canConvert(t.currency.code))
            .reduce((sum, t) => sum + this.currencyService.convertToDefault(t.amount, t.currency.code), 0);

        const expenseByType = (type: CategoryType) =>
            transactions
                .filter(t => t.type === 'expense')
                .filter(t => t.category?.type === type)
                .filter(t => this.currencyService.canConvert(t.currency.code))
                .reduce((sum, t) => sum + this.currencyService.convertToDefault(t.amount, t.currency.code), 0);

        const categoriesByType = (type: CategoryType): string[] => {
            const labels = new Set<string>();
            for (const t of transactions) {
                if (t.type !== 'expense') continue;
                if (t.category?.type !== type) continue;
                labels.add(t.category.label);
            }
            return Array.from(labels).sort((a, b) => a.localeCompare(b, 'fr'));
        };

        const needs = expenseByType('need');
        const wants = expenseByType('want');
        const savings = income - needs - wants;

        const buckets = [
            {key: 'needs', label: 'Besoins', percent: 50, allocated: income * 0.5, spent: needs, bg: 'bg-blue', categories: categoriesByType('need')},
            {key: 'wants', label: 'Envies', percent: 30, allocated: income * 0.3, spent: wants, bg: 'bg-pink', categories: categoriesByType('want')},
            {key: 'savings', label: 'Épargne', percent: 20, allocated: income * 0.2, spent: savings, bg: 'bg-green', categories: []},
        ].map(bucket => {
            const progress = bucket.allocated > 0
                ? Math.max(0, Math.round((bucket.spent / bucket.allocated) * 100))
                : 0;

            return {
                ...bucket,
                progress,
                barWidth: Math.min(100, progress),
            };
        });

        return {income, buckets};
    });

    // TODO: Mettre en amount dans la légende du graphique
    // TODO: Bug au premier chargement de la page ?
    categoriesData = computed(() => {
        const transactions = this.transactionsByMonth()?.transactionsByDay
            .flatMap(d => d.transactions) ?? [];

        const map = new Map<string, { label: string; color: string; total: number }>();

        for (const t of transactions.filter(t => t.type === 'expense')) {
            if (!this.currencyService.canConvert(t.currency.code)) continue;

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
            if (!this.currencyService.canConvert(t.currency.code)) continue;

            for (const tag of t.tags ?? []) {
                map.set(tag.label, (map.get(tag.label) ?? 0) + this.currencyService.convertToDefault(t.amount, t.currency.code));
            }
        }

        const tags = Array.from(map.entries())
            .map(([label, total]) => ({label, total}))
            .sort((a, b) => b.total - a.total);

        return {tags, maxTotal: tags[0]?.total ?? 0};
    });

    goalRatio(goal: SavingsGoal): number {
        return goal.target_amount > 0 && goal.current_amount > 0
            ? Math.round((goal.current_amount / goal.target_amount) * 100)
            : 0;
    }

    constructor() {
        effect(() => {
            this.transactionService.transactionRefreshTrigger();
            this.currencyService.currencyRefreshTrigger();
            this.monthService.selectedMonth();
            this.monthService.selectedYear();
            const userId = this.authState.getCurrentUser()?.id;
            if (userId) this.loadData(userId);
        });
    }

    private async loadData(userId: string) {
        this.isLoading.set(true);

        const monthIndex = this.monthService.getMonth();
        const year = this.monthService.getYear();

        const [transactions, subs, upcoming, goals] = await Promise.all([
            this.transactionService.getTransactionsByMonth(userId, monthIndex, year),
            this.subscriptionService.getAllSubscriptionsByUser(userId),
            this.transactionService.getUpcomingTransactions(userId),
            this.goalService.getRecentSavingsGoals(userId, 3),
        ]);

        this.transactionsByMonth.set(transactions);
        this.subscriptions.set(subs);
        this.upcomingTransactions.set(upcoming);
        this.savingsGoals.set(goals);
        await this.currencyService.loadDefaultCurrency(userId);

        this.isLoading.set(false);
    }

    private monthlyEquivalent(sub: Subscription): number {
        switch (sub.frequency) {
            case 'daily':
                return sub.amount * (365 / 12);
            case 'weekly':
                return sub.amount * (52 / 12);
            case 'monthly':
                return sub.amount;
            case 'yearly':
                return sub.amount / 12;
            default:
                return sub.amount;
        }
    }

    private formatDayKey(date: Date): string {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    private formatDayLabel(date: Date): string {
        const label = new Intl.DateTimeFormat('fr-FR', {weekday: 'short'}).format(date);
        return label.charAt(0).toUpperCase() + label.slice(1);
    }

    private isPastOrToday(dateStr: string): boolean {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return date <= today;
    }

    private isFuture(dateStr: string): boolean {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return date > today;
    }
}
