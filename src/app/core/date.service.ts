import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class DateService {
    static readonly MONTHS = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    static readonly MONTHS_SHORT = [
        'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
        'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
    ];

    /**
     * @param date
     * @return La date au format YYYY-MM-DD
     */
    formatDateToString(date: Date): string {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    /**
     * @param date
     * @return Le label du jour de la semaine en version courte (ex : Lun.)
     */
    formatWeekdayLabel(date: Date): string {
        const label = new Intl.DateTimeFormat('fr-FR', {weekday: 'short'}).format(date);
        return label.charAt(0).toUpperCase() + label.slice(1);
    }

    isPastOrToday(dateStr: string): boolean {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return date <= today;
    }

    isFuture(dateStr: string): boolean {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return date > today;
    }
}
