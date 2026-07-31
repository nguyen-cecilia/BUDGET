import {Component, inject, signal} from '@angular/core';
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
import {TransactionUpdateComponent} from './features/transactions/transaction-update.component';
import {ModalService} from './components/modal/modal.service';
import {AuthStateService} from './features/auth/auth-state.service';
import {SelectComponent} from './components/select/select.component';
import {MonthService} from './features/month/month.service';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, LucideMoon, ButtonComponent, RouterLink, LucidePlus, LucideHouse, RouterLinkActive, LucideList, LucideTarget, LucideChartColumnIncreasing, LucideSettings, ModalComponent, TransactionUpdateComponent, SelectComponent],
    templateUrl: './app.html',
})
export class App {
    protected readonly title = signal('budget');
    protected readonly authState = inject(AuthStateService);
    protected modalService = inject(ModalService);
    protected monthService = inject(MonthService);

    selectedMonth = this.monthService.selectedMonth;
    monthOptions = this.monthService.monthOptions;

    links = [
        {icon: 'lucideHome', path: '', label: 'Tableau de bord', shortLabel: 'Accueil'},
        {icon: 'lucideList', path: 'transactions', label: 'Transactions', shortLabel: 'Transactions'},
        {icon: 'lucideTarget', path: 'objectifs', label: 'Objectifs', shortLabel: 'Objectifs'},
        {icon: 'lucideChartColumnIncreasing', path: 'vue-annuelle', label: 'Vue annuelle', shortLabel: 'Année'},
        {icon: 'lucideSettings', path: 'parametres', label: 'Paramètres', shortLabel: 'Paramètres'},
    ];
}
