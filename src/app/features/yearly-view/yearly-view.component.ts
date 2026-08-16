import {Component, computed, effect, inject, signal} from '@angular/core';
import {LucideEqual, LucideEqualApproximately, LucideTrendingDown, LucideTrendingUp} from '@lucide/angular';
import {CurrencyService} from '../currencies/currency.service';
import {TransactionService} from '../transactions/transaction.service';
import {SelectComponent, SelectOption} from '../../components/select/select.component';
import {Transaction} from '../transactions/transaction.model';
import {ColorService} from '../../core/color.service';
import {AuthStateService} from '../auth/auth-state.service';
import {CurrencyPipe} from '@angular/common';
import {BarChartComponent} from '../../components/chart/bar-chart.component';

const MONTH_LABELS = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];
const MONTH_SHORT = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
    'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
];

@Component({
    selector: 'app-yearly-view',
    imports: [
        LucideTrendingUp,
        LucideTrendingDown,
        LucideEqual,
        LucideEqualApproximately,
        SelectComponent,
        CurrencyPipe,
        BarChartComponent
    ],
    templateUrl: './yearly-view.component.html',
})
export class YearlyViewComponent {
    private authState = inject(AuthStateService);
    private transactionService = inject(TransactionService);
    protected currencyService = inject(CurrencyService);
    protected colorService = inject(ColorService);

    isLoading = signal(false);
    transactions = signal<Transaction[]>([]);
    selectedYear = signal<number>(new Date().getFullYear());
    yearOptions = signal<SelectOption[]>([]);

    constructor() {
        const currentYear = new Date().getFullYear();
        this.yearOptions.set([{value: currentYear, label: String(currentYear)}]);

        effect(() => {
            this.transactionService.transactionRefreshTrigger();
            this.currencyService.currencyRefreshTrigger();
            const year = this.selectedYear();
            const userId = this.authState.getCurrentUser()?.id;
            if (userId) this.loadData(userId, year);
        });
    }

    setYear(value: string | number): void {
        this.selectedYear.set(Number(value));
    }

    monthlyData = computed(() => {
        const months = MONTH_LABELS.map((label, index) => ({
            index,
            label,
            income: 0,
            expense: 0,
            net: 0,
        }));

        for (const t of this.transactions()) {
            if (!this.currencyService.canConvert(t.currency.code)) continue;

            const amount = this.currencyService.convertToDefault(t.amount, t.currency.code);
            const month = new Date(t.date).getMonth();

            if (t.type === 'income') {
                months[month].income += amount;
            } else {
                months[month].expense += amount;
            }
        }

        for (const m of months) {
            m.net = m.income - m.expense;
        }

        return months;
    });

    totalIncome = computed(() => this.monthlyData().reduce((sum, m) => sum + m.income, 0));

    totalExpense = computed(() => this.monthlyData().reduce((sum, m) => sum + m.expense, 0));

    annualNet = computed(() => this.totalIncome() - this.totalExpense());

    monthlyAverage = computed(() => this.annualNet() / 12);

    barLabels = computed(() => MONTH_SHORT);

    barMonthLabels = computed(() => MONTH_LABELS);

    barDatasets = computed(() => [
        {
            label: 'Revenus',
            data: this.monthlyData().map(m => m.income),
            backgroundColor: this.colorService.getHex('green'),
        },
        {
            label: 'Dépenses',
            data: this.monthlyData().map(m => m.expense),
            backgroundColor: this.colorService.getHex('pink'),
        },
    ]);

    extremeMonths = computed<{best: number; worst: number} | null>(() => {
        const months = this.monthlyData();
        if (months.length === 0) return null;

        let bestIndex = 0;
        let worstIndex = 0;

        for (let i = 1; i < months.length; i++) {
            if (months[i].net > months[bestIndex].net) bestIndex = i;
            if (months[i].net < months[worstIndex].net) worstIndex = i;
        }

        if (months[bestIndex].net === months[worstIndex].net) return null;

        return {best: bestIndex, worst: worstIndex};
    });

    private async loadData(userId: string, year: number) {
        this.isLoading.set(true);
        try {
            const [transactions, firstYear] = await Promise.all([
                this.transactionService.getTransactionsByYear(userId, year),
                this.transactionService.getFirstTransactionYear(userId),
            ]);

            this.transactions.set(transactions);

            if (firstYear != null) {
                const currentYear = new Date().getFullYear();
                const years: SelectOption[] = [];
                for (let y = currentYear; y >= firstYear; y--) {
                    years.push({value: y, label: String(y)});
                }
                this.yearOptions.set(years);
            }
            await this.currencyService.loadDefaultCurrency(userId);
        } catch (error) {
            console.error('Erreur lors du chargement de la vue annuelle:', error);
        } finally {
            this.isLoading.set(false);
        }
    }
}
