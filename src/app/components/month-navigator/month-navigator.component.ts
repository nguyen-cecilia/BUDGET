import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ButtonComponent} from '../button/button.component';
import {LucideChevronLeft, LucideChevronRight} from '@lucide/angular';

@Component({
    selector: 'app-month-navigator',
    standalone: true,
    imports: [ButtonComponent, LucideChevronLeft, LucideChevronRight],
    template: `
        <div class="flex items-center gap-2">
            <button
                app-button
                shape="round"
                variant="outline"
                [disabled]="!canGoPrev"
                (click)="prev()"
            >
                <svg lucideChevronLeft [size]="16"></svg>
            </button>
            <span class="text-sm font-semibold min-w-32 text-center">{{ label }}</span>
            <button
                app-button
                shape="round"
                variant="outline"
                [disabled]="!canGoNext"
                (click)="next()"
            >
                <svg lucideChevronRight [size]="16"></svg>
            </button>
        </div>
    `,
})
export class MonthNavigatorComponent {
    @Input() month = new Date().getMonth();
    @Input() year = new Date().getFullYear();
    @Input() minMonth?: { month: number; year: number };
    @Input() maxMonth?: { month: number; year: number };

    @Output() monthChange = new EventEmitter<number>();
    @Output() yearChange = new EventEmitter<number>();

    get label(): string {
        const date = new Date(this.year, this.month - 1, 1);
        const formatted = new Intl.DateTimeFormat('fr-FR', {
            month: 'long',
            year: 'numeric',
        }).format(date);
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }

    get canGoPrev(): boolean {
        if (!this.minMonth) return true;
        return this.month > this.minMonth.month || this.year > this.minMonth.year;
    }

    get canGoNext(): boolean {
        if (!this.maxMonth) return true;
        return this.month < this.maxMonth.month || this.year < this.maxMonth.year;
    }

    prev(): void {
        if (!this.canGoPrev) return;
        const newMonth = this.month === 0 ? 11 : this.month - 1;
        const newYear = this.month === 0 ? this.year - 1 : this.year;
        this.monthChange.emit(newMonth);
        this.yearChange.emit(newYear);
    }

    next(): void {
        if (!this.canGoNext) return;
        const newMonth = this.month === 11 ? 0 : this.month + 1;
        const newYear = this.month === 11 ? this.year + 1 : this.year;
        this.monthChange.emit(newMonth);
        this.yearChange.emit(newYear);
    }
}
