import {Component} from '@angular/core';
import {
    LucideArrowRight,
    LucideArrowUpRight,
    LucideAstroid,
    LucideCalendar, LucideLayers, LucideTag, LucideWallet,
    LucideZap
} from '@lucide/angular';
import {ButtonComponent} from '../../components/button/button.component';
import {RouterLink} from '@angular/router';
import {PieChartComponent} from '../../components/chart/chart.component';

@Component({
    selector: 'app-dashboard',
    imports: [
        LucideAstroid,
        LucideZap,
        LucideArrowRight,
        ButtonComponent,
        LucideCalendar,
        RouterLink,
        LucideArrowUpRight,
        LucideLayers,
        LucideTag,
        LucideWallet,
        PieChartComponent,
    ],
    templateUrl: './dashboard.component.html',
})
export class DashboardComponent {

}
