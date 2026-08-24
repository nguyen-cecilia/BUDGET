import {Component, computed, effect, inject, Input, signal} from '@angular/core';
import {ButtonComponent} from '../../components/button/button.component';
import {LucideLoaderCircle, LucidePlus, LucideSave, LucideTrash2} from '@lucide/angular';
import {AuthStateService} from '../../core/auth/auth-state.service';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {CategoryService} from './category.service';
import {ModalService} from '../../components/modal/modal.service';
import {Category} from './category.model';
import {FORM_ERRORS, creationError, deletionError} from '../../core/form-errors.service';
import {ColorPickerComponent} from '../../components/color-picker/color-picker.component';
import {SelectComponent, SelectOption} from '../../components/select/select.component';
import {BadgeComponent} from '../../components/badge/badge.component';
import {FieldErrorComponent} from '../../components/form-error/field-error.component';
import {FormErrorComponent} from '../../components/form-error/form-error.component';

@Component({
    selector: 'app-category-update',
    imports: [
        ButtonComponent,
        LucidePlus,
        ReactiveFormsModule,
        LucideLoaderCircle,
        LucideTrash2,
        LucideSave,
        ColorPickerComponent,
        SelectComponent,
        BadgeComponent,
        FieldErrorComponent,
        FormErrorComponent
    ],
    templateUrl: './category-update.component.html',
    host: {
        class: 'block',
    }
})
export class CategoryUpdateComponent {
    private authState = inject(AuthStateService);
    private fb = inject(FormBuilder);
    private categoryService = inject(CategoryService);
    protected modalService = inject(ModalService);

    categoryForm: FormGroup;

    errorMessage = signal<string | null>(null);
    isSubmitting = signal(false);
    selectedColor = signal<string>('gray');
    confirmDelete = signal(false);
    isDeleting = signal(false);
    reassignTo = signal<string | number>('');
    reassignOptions = signal<SelectOption[]>([]);
    typeOptions = [{value: 'need', label: 'Besoin'}, {value: 'want', label: 'Envie'}];

    @Input() createOnly = false;

    constructor() {
        this.categoryForm = this.fb.group({
            label: ['', [Validators.required]],
            color: ['gray', [Validators.required]],
            type: ['need'],
        });

        this.selectedColor.set(this.categoryForm.get('color')?.value ?? 'gray');
        this.categoryForm.get('color')?.valueChanges.subscribe(v => this.selectedColor.set(v ?? 'grayMid'));

        effect(() => {
            const editing = this.editingCategory();
            if (editing) {
                this.fillForm(editing);
                this.loadReassignOptions(editing);
            } else {
                this.resetForm();
                this.confirmDelete.set(false);
            }
        });
    }

    editingCategory = computed(() => this.createOnly ? null : this.modalService.category.editing());

    selectColor(color: string): void {
        this.categoryForm.get('color')?.setValue(color);
    }

    async submitCategory() {
        if (this.categoryForm.invalid) {
            this.errorMessage.set(FORM_ERRORS.REQUIRED);
            return;
        }

        this.isSubmitting.set(true);
        this.errorMessage.set(null);

        try {
            const userId = this.authState.getCurrentUser()?.id;
            if (!userId) {
                throw new Error('Utilisateur non authentifié');
            }

            const editing = this.editingCategory();
            const fv = this.categoryForm.value;

            const payload = {
                label: fv.label || '',
                color: fv.color || '',
                type: fv.type || null,
            }

            if (editing) {
                // Modification de la catégorie
                await this.categoryService.updateCategory(editing.id, userId, payload);

                this.modalService.category.close();
            } else {
                // Création de la catégorie
                await this.categoryService.createCategory(userId, payload);
            }

            this.categoryService.categoryRefreshTrigger.set(
                !this.categoryService.categoryRefreshTrigger()
            );

            this.resetForm();
        } catch (error) {
            console.error('Erreur lors de la création da la catégorie:', error);
            this.errorMessage.set(creationError('de la catégorie'));
        } finally {
            this.isSubmitting.set(false);
        }
    }

    async deleteCategory(): Promise<void> {
        const editing = this.editingCategory();
        if (!editing) return;

        this.isDeleting.set(true);
        this.errorMessage.set(null);

        try {
            const userId = this.authState.getCurrentUser()?.id;
            if (!userId) throw new Error('Utilisateur non authentifié');

            await this.categoryService.deleteCategory(userId, editing.id, String(this.reassignTo()) || null);

            this.categoryService.categoryRefreshTrigger.set(
                !this.categoryService.categoryRefreshTrigger()
            );

            this.modalService.category.close();
        } catch (error) {
            console.error('Erreur lors de la suppression de la catégorie:', error);
            this.errorMessage.set(deletionError());
        } finally {
            this.isDeleting.set(false);
        }
    }

    private fillForm(category: Category): void {
        this.categoryForm.patchValue({
            label: category.label,
            color: category.color,
            type: category.type,
        });
    }

    private resetForm(): void {
        this.categoryForm.reset({
            label: '',
            color: 'gray',
            type: 'need',
        });
    }

    private async loadReassignOptions(editing: Category): Promise<void> {
        try {
            const userId = this.authState.getCurrentUser()?.id;
            if (!userId) return;

            const categories = await this.categoryService.getAllCategoriesByUser(userId);
            const options: SelectOption[] = categories
                .filter(c => c.id !== editing.id)
                .map(c => ({value: c.id, label: c.label}));

            options.unshift({value: '', label: 'Aucune (Sans catégorie)'});

            this.reassignOptions.set(options);
        } catch (error) {
            console.error('Erreur lors du chargement des catégories:', error);
        }
    }
}
