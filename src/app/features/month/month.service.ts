import {Injectable, signal} from '@angular/core';
import {SelectOption} from '../../components/select/select.component';

const MONTHS = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

@Injectable({
    providedIn: 'root'
})
export class MonthService {
    selectedMonth = signal<number>(new Date().getMonth());
    selectedYear = signal<number>(new Date().getFullYear());
    monthOptions = signal<SelectOption[]>([]);

    constructor() {
        this.initializeMonthOptions();
    }

    setMonth(monthIndex: string | number): void {
        this.selectedMonth.set(Number(monthIndex));
    }

    getMonth(): number {
        return this.selectedMonth();
    }

    getCurrentMonth(): number {
        return new Date().getMonth();
    }

    getMonthLabel(): string {
        const date = new Date(this.selectedYear(), this.selectedMonth(), 1);
        const monthLabel = new Intl.DateTimeFormat('fr-FR', {
            month: 'long',
            year: 'numeric',
        }).format(date);

        return (monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1));
    }

    getYear(): number {
        return this.selectedYear();
    }

    getCurrentYear(): number {
        return new Date().getFullYear();
    }

    initializeMonthOptions(): void {
        const currentYear = this.getCurrentYear();
        const currentMonth = this.getCurrentMonth();

        const options: SelectOption[] = MONTHS
            .slice(0, currentMonth + 3)
            .map((month, index) => ({
                value: index,
                label: `${month} ${currentYear}`
            }))
            .reverse();

        this.monthOptions.set(options);
    }
}
