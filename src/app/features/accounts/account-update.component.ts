import {Component, computed, effect, inject, signal} from '@angular/core';
import {ButtonComponent} from '../../components/button/button.component';
import {LucideLoaderCircle, LucideSave} from '@lucide/angular';
import {ModalService} from '../../components/modal/modal.service';
import {AuthStateService} from '../auth/auth-state.service';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {AccountService} from './account.service';
import {Account} from './account.model';

@Component({
    selector: 'app-account-update',
    imports: [
        ButtonComponent,
        LucideLoaderCircle,
        LucideSave,
        FormsModule,
        ReactiveFormsModule
    ],
    templateUrl: './account-update.component.html',
})
export class AccountUpdateComponent {
    private authState = inject(AuthStateService);
    private fb = inject(FormBuilder);
    private accountService = inject(AccountService);
    protected modalService = inject(ModalService);

    accountForm: FormGroup;

    errorMessage = signal<string | null>(null);
    isSubmitting = signal(false);
    accounts = signal<Account[]>([])

    constructor() {
        this.accountForm = this.fb.group({
            label: ['', [Validators.required]],
            isDefault: [false],
            isActive: [true],
        });

        effect(() => {
            const editing = this.modalService.account.editing();
            if (editing) {
                this.fillForm(editing);
            } else {
                this.resetForm();
            }
        });

        effect(() => {
            if (this.modalService.account.isOpen()) {
                const userId = this.authState.getCurrentUser()?.id;
                if (userId) {
                    this.accountService.getAllAccountsByUser(userId, true)
                        .then(data => this.accounts.set(data));
                }
            }
        });

        this.accountForm.get('isActive')?.valueChanges.subscribe(() => this.updateIsDefaultState());

        effect(() => {
            this.hasAnotherDefault();
            this.updateIsDefaultState();
        });
    }

    hasAnotherDefault = computed(() => {
        const editing = this.modalService.account.editing();
        return this.accounts().some(a => a.is_default && a.id !== editing?.id);
    });

    async submitAccount() {
        if (this.accountForm.invalid) {
            this.errorMessage.set('Veuillez remplir tous les champs obligatoires');
            return;
        }

        this.isSubmitting.set(true);
        this.errorMessage.set(null);

        try {
            const userId = this.authState.getCurrentUser()?.id;
            if (!userId) {
                throw new Error('Utilisateur non authentifié');
            }

            const editing = this.modalService.account.editing();
            const fv = this.accountForm.getRawValue();

            if (editing) {
                // Modification du compte
                await this.accountService.updateAccount(editing.id, userId, {
                    label: fv.label || '',
                    is_default: fv.isDefault,
                    is_active: fv.isActive,
                });
            } else {
                // Création du compte
                await this.accountService.createAccount(userId, {
                    label: fv.label || '',
                    is_default: fv.isDefault,
                    is_active: fv.isActive,
                });
            }

            this.accountService.accountRefreshTrigger.set(
                !this.accountService.accountRefreshTrigger()
            );

            this.resetForm();

            this.modalService.account.close();
        } catch (error) {
            console.error('Erreur lors de la création du compte:', error);
            this.errorMessage.set('Erreur lors de la création du compte');
        } finally {
            this.isSubmitting.set(false);
        }
    }

    private fillForm(account: Account): void {
        this.accountForm.patchValue({
            label: account.label,
            isDefault: account.is_default,
            isActive: account.is_active,
        });
    }

    private resetForm(): void {
        this.accountForm.reset({
            label: '',
            isDefault: false,
            isActive: true,
        });
    }

    private updateIsDefaultState(): void {
        const isActiveValue = this.accountForm.get('isActive')?.value ?? true;
        const control = this.accountForm.get('isDefault');

        if (this.hasAnotherDefault() || !isActiveValue) {
            if (!isActiveValue) {
                control?.setValue(false, {emitEvent: false});   // décoche automatiquement
            }
            control?.disable();
        } else {
            control?.enable();
        }
    }
}
