import {Component, effect, inject, OnInit, signal} from '@angular/core';
import {
    LucideCoins,
    LucideLandmark,
    LucidePencil,
    LucidePlus,
    LucideSparkles,
    LucideTag,
    LucideWallet,
} from '@lucide/angular';
import {ButtonComponent} from '../../components/button/button.component';
import {BadgeComponent} from '../../components/badge/badge.component';
import {SelectComponent} from '../../components/select/select.component';
import {MonthService} from '../month/month.service';
import {ModalComponent} from '../../components/modal/modal.component';
import {AccountUpdateComponent} from '../accounts/account-update.component';
import {ModalService} from '../../components/modal/modal.service';
import {AccountService} from '../accounts/account.service';
import {Account} from '../accounts/account.model';
import {AuthStateService} from '../auth/auth-state.service';
import {TagService} from '../tags/tag.service';
import {Tag} from '../tags/tag.model';
import {TagUpdateComponent} from '../tags/tag-update.component';
import {CategoryUpdateComponent} from '../categories/category-update.component';
import {CategoryService} from '../categories/category.service';
import {Category} from '../categories/category.model';
import {ColorService} from '../../core/color.service';

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
        LucideLandmark,
        SelectComponent,
        ModalComponent,
        AccountUpdateComponent,
        TagUpdateComponent,
        CategoryUpdateComponent
    ],
    templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
    private authState = inject(AuthStateService);
    private accountService = inject(AccountService);
    private tagService = inject(TagService);
    private categoryService = inject(CategoryService);
    protected modalService = inject(ModalService);
    protected monthService = inject(MonthService);
    protected colorService = inject(ColorService);

    selectedMonth = this.monthService.selectedMonth;
    monthOptions = this.monthService.monthOptions;

    isLoading = signal(false);
    accounts = signal<Account[]>([]);
    tags = signal<Tag[]>([]);
    categories = signal<Category[]>([]);

    constructor() {
        effect(() => {
            this.accountService.accountRefreshTrigger();
            this.tagService.tagRefreshTrigger();
            this.categoryService.categoryRefreshTrigger();
            const userId = this.authState.getCurrentUser()?.id;
            if (userId) {
                this.getCategories(userId);
                this.getTags(userId);
                this.getAccounts(userId);
            }
        });
    }

    ngOnInit() {
        this.isLoading.set(true);
        const userId = this.authState.getCurrentUser()?.id;

        if (!userId) {
            console.error('Utilisateur non authentifié');
            return;
        }

        this.getAccounts(userId);
        this.isLoading.set(false);
    }

    private getCategories(userId: string) {
        this.categoryService.getAllCategoriesByUser(userId).then(
            (data) => {
                this.categories.set(data);
            },
            (error) => {
                console.error('Erreur lors du chargement:', error);
            }
        );
    }

    private getTags(userId: string) {
        this.tagService.getAllTagsByUser(userId).then(
            (data) => {
                this.tags.set(data);
            },
            (error) => {
                console.error('Erreur lors du chargement:', error);
            }
        );
    }

    private getAccounts(userId: string) {
        this.accountService.getAllAccountsByUser(userId, true).then(
            (data) => {
                this.accounts.set(data);
            },
            (error) => {
                console.error('Erreur lors du chargement:', error);
            }
        );
    }
}
