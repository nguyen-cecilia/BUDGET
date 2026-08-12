import {Component, computed, effect, inject, Input, signal} from '@angular/core';
import {ButtonComponent} from '../../components/button/button.component';
import {LucideLoaderCircle, LucidePlus, LucideSave, LucideTrash2} from '@lucide/angular';
import {AuthStateService} from '../auth/auth-state.service';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {CategoryService} from './category.service';
import {ModalService} from '../../components/modal/modal.service';
import {Category} from './category.model';
import {ColorPickerComponent} from '../../components/color-picker/color-picker.component';
import {SelectComponent, SelectOption} from '../../components/select/select.component';

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
        SelectComponent
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
    showDelete = signal(false);
    isDeleting = signal(false);
    reassignTo = signal<string | number>('');
    reassignOptions = signal<SelectOption[]>([]);

    @Input() createOnly = false;

    constructor() {
        this.categoryForm = this.fb.group({
            label: ['', [Validators.required]],
            color: ['gray', [Validators.required]],
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
                this.showDelete.set(false);
            }
        });
    }

    editingCategory = computed(() => this.createOnly ? null : this.modalService.category.editing());

    selectColor(color: string): void {
        this.categoryForm.get('color')?.setValue(color);
    }

    startDelete(): void {
        this.showDelete.set(true);
    }

    cancelDelete(): void {
        this.showDelete.set(false);
    }

    async submitCategory() {
        if (this.categoryForm.invalid) {
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

            const editing = this.editingCategory();
            const fv = this.categoryForm.value;

            if (editing) {
                // Modification de la catégorie
                await this.categoryService.updateCategory(editing.id, userId, {
                    label: fv.label || '',
                    color: fv.color || '',
                });

                this.modalService.category.close();
            } else {
                // Création de la catégorie
                await this.categoryService.createCategory(userId, {
                    label: fv.label || '',
                    color: fv.color || '',
                });
            }

            this.categoryService.categoryRefreshTrigger.set(
                !this.categoryService.categoryRefreshTrigger()
            );

            this.resetForm();
        } catch (error) {
            console.error('Erreur lors de la création da la catégorie:', error);
            this.errorMessage.set('Erreur lors de la création de la catégorie');
        } finally {
            this.isSubmitting.set(false);
        }
    }

    async confirmDelete(): Promise<void> {
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
            this.errorMessage.set('Erreur lors de la suppression de la catégorie');
        } finally {
            this.isDeleting.set(false);
        }
    }

    private fillForm(category: Category): void {
        this.categoryForm.patchValue({
            label: category.label,
            color: category.color,
        });
    }

    private resetForm(): void {
        this.categoryForm.reset({
            label: '',
            color: 'gray',
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
