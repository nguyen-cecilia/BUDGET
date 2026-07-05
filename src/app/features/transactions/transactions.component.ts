import {Component} from '@angular/core';
import {LucideArrowDownLeft, LucideArrowUpRight, LucideSearch} from '@lucide/angular';
import {BadgeComponent} from '../../components/badge/badge.component';

@Component({
    selector: 'app-transactions',
    imports: [
        LucideSearch,
        BadgeComponent,
        LucideArrowUpRight,
        LucideArrowDownLeft
    ],
    templateUrl: './transactions.component.html',
})
export class TransactionsComponent {

}
