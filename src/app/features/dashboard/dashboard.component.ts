import {Component, computed, effect, inject, signal, untracked} from '@angular/core';
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
import {AuthStateService} from '../../core/auth/auth-state.service';
import {TransactionService} from '../transactions/transaction.service';
import {SubscriptionService} from '../subscriptions/subscription.service';
import {PeriodService} from '../../core/period.service';
import {Transaction, TransactionsByMonth} from '../transactions/transaction.model';
import {Subscription} from '../subscriptions/subscription.model';
import {CurrencyPipe, DatePipe, DecimalPipe} from '@angular/common';
import {ColorService} from '../../core/color.service';
import {TransactionItemComponent} from '../transactions/transaction-item.component';
import {CurrencyService} from '../currencies/currency.service';
import {SavingsGoalService} from '../saving-goals/savings-goal.service';
import {SavingsGoal} from '../saving-goals/savings-goal.model';
import {CategoryType} from '../categories/category.model';
import {DateService} from '../../core/date.service';
import {LoadingComponent} from '../../components/loading/loading.component';
import {RefreshService} from '../../core/refresh.service';

const RECENT_TRANSACTIONS_NUMBER = 6;

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
        LoadingComponent,
    ],
    templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
    private authState = inject(AuthStateService);
    private transactionService = inject(TransactionService);
    private subscriptionService = inject(SubscriptionService);
    private goalService = inject(SavingsGoalService);
    private dateService = inject(DateService);
    private refreshService = inject(RefreshService);
    protected currencyService = inject(CurrencyService);
    protected periodService = inject(PeriodService);
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
            .filter(t => this.dateService.isPastOrToday(t.date))
            .filter(t => this.currencyService.canConvert(t.currency.code))
            .reduce((sum, t) => sum + this.currencyService.convertToDefault(t.amount, t.currency.code), 0) ?? 0
    );

    totalIncomes = computed(() =>
        this.transactionsByMonth()?.transactionsByDay
            .flatMap(d => d.transactions)
            .filter(t => t.type === 'income')
            .filter(t => this.dateService.isPastOrToday(t.date))
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
                (sum, sub) =>
                    sum + this.currencyService.convertToDefault(this.subscriptionService.monthlyEquivalent(sub), sub.currency.code),
                0
            )
    );

    remainingToPay = computed(() => {
        const futureExpenses = (this.transactionsByMonth()?.transactionsByDay
            .flatMap(d => d.transactions) ?? [])
            .filter(t => t.type === 'expense')
            .filter(t => this.dateService.isFuture(t.date))
            .filter(t => this.currencyService.canConvert(t.currency.code))
            .reduce((sum, t) => sum + this.currencyService.convertToDefault(t.amount, t.currency.code), 0);

        const monthEnd = this.dateService.formatDateToString(
            new Date(this.periodService.getYear(), this.periodService.getMonth() + 1, 0)
        );

        const unpaidSubscriptions = this.subscriptionsStatus()
            .filter(s => s.is_active && !s.checked)
            .filter(s => String(s.next_payment_date).slice(0, 10) <= monthEnd)
            .filter(s => this.currencyService.canConvert(s.currency.code))
            .reduce((sum, s) =>
                sum + this.currencyService.convertToDefault(
                    this.subscriptionService.monthlyEquivalent(s), s.currency.code
                ), 0);

        return futureExpenses + unpaidSubscriptions;
    });

    expensesRatio = computed(() =>
        this.totalIncomes() > 0
            ? Math.round((this.totalExpenses() / this.totalIncomes()) * 100)
            : 0
    );

    recentTransactions = computed(() =>
        (this.transactionsByMonth()?.transactionsByDay
            .flatMap(d => d.transactions) ?? [])
            .filter(t => this.dateService.isPastOrToday(t.date))
            .slice(0, RECENT_TRANSACTIONS_NUMBER)
    );

    subscriptionsStatus = computed(() => {
        const subscriptions = this.subscriptions();
        const transactions = this.transactionsByMonth()?.transactionsByDay
            .flatMap(d => d.transactions) ?? [];

        return subscriptions
            .map(s => {
                const linked = transactions.filter(t => t.subscription_id === s.id);
                const paidThisMonth = linked.length > 0;
                const lastTransaction = paidThisMonth ? linked[0] : null;
                const isPast = lastTransaction ? this.dateService.isPastOrToday(lastTransaction.date) : false;

                return {
                    ...s,
                    last_payment_date: lastTransaction?.date,
                    checked: isPast && paidThisMonth,
                };
            })
            .sort((a, b) => Number(a.checked) - Number(b.checked));
    });

    upcomingPayments = computed(() => {
        const days = new Map<string, {
            date: Date;
            items: { label: string; amount: number; isSubscription: boolean }[]
        }>();

        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            days.set(this.dateService.formatDateToString(date), {date, items: []});
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

        const todayKey = this.dateService.formatDateToString(new Date());

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
            dateString: this.dateService.formatDateToString(date),
            dayLabel: this.dateService.formatWeekdayLabel(date),
            dayNumber: date.getDate(),
            items,
        }));
    });

    budget = computed(() => {
        const transactions = this.transactionsByMonth()?.transactionsByDay
            .flatMap(d => d.transactions) ?? [];

        const income = transactions
            .filter(t => t.type === 'income')
            .filter(t => this.currencyService.canConvert(t.currency.code))
            .reduce((sum, t) => sum + this.currencyService.convertToDefault(t.amount, t.currency.code), 0);

        const expensesByType = (type: CategoryType) =>
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

        const needs = expensesByType('need');
        const wants = expensesByType('want');
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

    categoriesData = computed(() => {
        const transactions = this.transactionsByMonth()?.transactionsByDay
            .flatMap(d => d.transactions) ?? [];

        const map = new Map<string, { label: string; color: string; total: number }>();

        for (const t of transactions.filter(t => t.type === 'expense')) {
            if (!this.currencyService.canConvert(t.currency.code)) continue;

            const label = t.category?.label ?? 'Sans catégorie';
            const color = t.category?.color ?? 'grayLight';
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
            donutLabels: categories.map(c => c.label),
            donutData: categories.map(c => c.total),
            donutColors: categories.map(c => this.colorService.getHex(c.color))
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
            this.refreshService.trigger();
            this.periodService.selectedMonth();
            this.periodService.selectedYear();
            const key = this.refreshService.lastKey();
            untracked(() => {
                const userId = this.authState.getCurrentUser()?.id;
                if (userId && (!key || key === 'transaction' || key === 'currency')) {
                    this.loadDashboard(userId);
                }
            });
        });
    }

    private async loadDashboard(userId: string) {
        this.isLoading.set(true);

        const monthIndex = this.periodService.getMonth();
        const year = this.periodService.getYear();

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
}
