import {Component, inject} from '@angular/core';
import {
    LucideCoins,
    LucideLandmark,
    LucidePencil,
    LucidePlus,
    LucideSparkles,
    LucideTag,
    LucideTrash2,
    LucideWallet,
} from '@lucide/angular';
import {ButtonComponent} from '../../components/button/button.component';
import {BadgeComponent} from '../../components/badge/badge.component';
import {SelectComponent} from '../../components/select/select.component';
import {MonthService} from '../month/month.service';

@Component({
    selector: 'app-settings',
    imports: [
        LucideCoins,
        ButtonComponent,
        LucidePlus,
        LucidePencil,
        LucideSparkles,
        LucideWallet,
        LucideTag,
        BadgeComponent,
        LucideTrash2,
        LucideLandmark,
        SelectComponent
    ],
    templateUrl: './settings.component.html',
})
export class SettingsComponent {
    protected monthService = inject(MonthService);

    selectedMonth = this.monthService.selectedMonth;
    monthOptions = this.monthService.monthOptions;
}
