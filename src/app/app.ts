import {Component, inject, OnInit, signal} from '@angular/core';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {
    LucideChartColumnIncreasing,
    LucideHouse,
    LucideList,
    LucideMoon,
    LucidePlus, LucideSettings,
    LucideTarget
} from '@lucide/angular';
import {ButtonComponent} from './components/button/button.component';
import {ModalComponent} from './components/modal/modal.component';
import {UpdateTransactionComponent} from './features/transactions/update-transaction.component';
import {ModalService} from './components/modal/modal.service';
import {AuthStateService} from './features/auth/auth-state.service';
import {SelectComponent, SelectOption} from './components/select/select.component';
import {MonthService} from './features/month/month.service';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, LucideMoon, ButtonComponent, RouterLink, LucidePlus, LucideHouse, RouterLinkActive, LucideList, LucideTarget, LucideChartColumnIncreasing, LucideSettings, ModalComponent, UpdateTransactionComponent, SelectComponent],
    templateUrl: './app.html',
})
export class App implements OnInit {
    protected readonly title = signal('budget');
    protected readonly authState = inject(AuthStateService);
    protected modalService = inject(ModalService);
    private monthService = inject(MonthService);

    selectedMonth = this.monthService.selectedMonth;
    monthOptions = signal<SelectOption[]>([]);

    links = [
        {icon: 'lucideHome', path: '', label: 'Tableau de bord', shortLabel: 'Accueil'},
        {icon: 'lucideList', path: 'transactions', label: 'Transactions', shortLabel: 'Transactions'},
        {icon: 'lucideTarget', path: 'objectifs', label: 'Objectifs', shortLabel: 'Objectifs'},
        {icon: 'lucideChartColumnIncreasing', path: 'vue-annuelle', label: 'Vue annuelle', shortLabel: 'Année'},
        {icon: 'lucideSettings', path: 'parametres', label: 'Paramètres', shortLabel: 'Paramètres'},
    ];

    ngOnInit() {
        this.initializeMonthOptions();
    }

    private initializeMonthOptions(): void {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();

        const months = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];

        const options: SelectOption[] = months
            .slice(0, currentMonth + 1)
            .map((month, index) => ({
                value: index,
                label: `${month} ${currentYear}`
            }));

        this.monthOptions.set(options);
    }

    onMonthChange(monthIndex: string | number): void {
        this.monthService.setMonth(Number(monthIndex));
    }
}
