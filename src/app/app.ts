import {Component, inject, signal, ViewChild} from '@angular/core';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {
    LucideCalculator,
    LucideChartColumnIncreasing,
    LucideHouse,
    LucideList,
    LucideMoon,
    LucidePlus,
    LucideSettings,
    LucideSun,
    LucideTarget
} from '@lucide/angular';
import {ButtonComponent} from './components/button/button.component';
import {ModalComponent} from './components/modal/modal.component';
import {TransactionUpdateComponent} from './features/transactions/transaction-update.component';
import {ModalService} from './components/modal/modal.service';
import {AuthStateService} from './core/auth/auth-state.service';
import {SelectComponent} from './components/select/select.component';
import {PeriodService} from './core/period.service';
import {ThemeService} from './core/theme.service';
import {SwUpdate} from '@angular/service-worker';
import {CalculatorComponent} from './components/calculator/calculator.component';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, LucideMoon, ButtonComponent, RouterLink, LucidePlus, LucideHouse, RouterLinkActive, LucideList, LucideTarget, LucideChartColumnIncreasing, LucideSettings, ModalComponent, TransactionUpdateComponent, SelectComponent, LucideSun, CalculatorComponent, LucideCalculator],
    templateUrl: './app.html',
})
export class App {
    private update = inject(SwUpdate);
    protected readonly title = signal('budget');
    protected readonly authState = inject(AuthStateService);
    protected modalService = inject(ModalService);
    protected periodService = inject(PeriodService);
    protected themeService = inject(ThemeService);

    @ViewChild('calculator') calculator!: CalculatorComponent;

    hasUpdate = signal(false);

    selectedMonth = this.periodService.selectedMonth;
    monthOptions = this.periodService.monthOptions;

    links = [
        {icon: 'lucideHome', path: '', label: 'Tableau de bord', shortLabel: 'Accueil'},
        {icon: 'lucideList', path: 'transactions', label: 'Transactions', shortLabel: 'Transac.'},
        {icon: 'lucideTarget', path: 'objectifs', label: 'Objectifs', shortLabel: 'Objectifs'},
        {icon: 'lucideChartColumnIncreasing', path: 'vue-annuelle', label: 'Vue annuelle', shortLabel: 'Année'},
        {icon: 'lucideSettings', path: 'parametres', label: 'Paramètres', shortLabel: 'Paramètres'},
    ];

    constructor() {
        this.update.versionUpdates.subscribe(event => {
            if (event.type === 'VERSION_READY') {
                this.hasUpdate.set(true);
            }
        });

        setInterval(() => {
            void this.update.checkForUpdate();
        }, 60000);
    }

    applyUpdate() {
        this.update.activateUpdate().then(() => location.reload());
    }
}
