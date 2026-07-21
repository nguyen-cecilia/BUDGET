import {Component} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {BadgeComponent} from '../../components/badge/badge.component';
import {LucideX} from '@lucide/angular';

@Component({
    selector: 'app-update-transaction',
    imports: [
        ReactiveFormsModule,
        BadgeComponent,
        LucideX
    ],
    templateUrl: './update-transaction.component.html',
})
export class UpdateTransactionComponent {

}
