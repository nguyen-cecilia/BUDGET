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
import {AuthService} from './features/auth/auth.service';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, LucideMoon, ButtonComponent, RouterLink, LucidePlus, LucideHouse, RouterLinkActive, LucideList, LucideTarget, LucideChartColumnIncreasing, LucideSettings],
    templateUrl: './app.html',
})
export class App {
    protected readonly title = signal('budget');
    protected authService = inject(AuthService);

    links = [
        {icon: 'lucideHome', path: '', label: 'Tableau de bord', shortLabel: 'Accueil'},
        {icon: 'lucideList', path: 'transactions', label: 'Transactions', shortLabel: 'Transactions'},
        {icon: 'lucideTarget', path: 'objectifs', label: 'Objectifs', shortLabel: 'Objectifs'},
        {icon: 'lucideChartColumnIncreasing', path: 'vue-annuelle', label: 'Vue annuelle', shortLabel: 'Année'},
        {icon: 'lucideSettings', path: 'parametres', label: 'Paramètres', shortLabel: 'Paramètres'},
    ]
}
