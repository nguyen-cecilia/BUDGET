import {Component, computed, effect, inject, Input, signal} from '@angular/core';
import {TagService} from './tag.service';
import {AuthStateService} from '../auth/auth-state.service';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ButtonComponent} from '../../components/button/button.component';
import {LucideLoaderCircle, LucidePlus, LucideSave, LucideTrash2} from '@lucide/angular';
import {Tag} from './tag.model';
import {ModalService} from '../../components/modal/modal.service';

@Component({
    selector: 'app-tag-update',
    imports: [
        ReactiveFormsModule,
        ButtonComponent,
        LucidePlus,
        LucideLoaderCircle,
        LucideTrash2,
        LucideSave
    ],
    templateUrl: './tag-update.component.html',
    host: {
        class: 'block',
    }
})
export class TagUpdateComponent {
    private authState = inject(AuthStateService);
    private fb = inject(FormBuilder);
    private tagService = inject(TagService);
    protected modalService = inject(ModalService);

    tagForm: FormGroup;

    errorMessage = signal<string | null>(null);
    isSubmitting = signal(false);

    @Input() createOnly = false;

    constructor() {
        this.tagForm = this.fb.group({
            label: ['', [Validators.required]],
        });

        effect(() => {
            const editing = this.editingTag();
            if (editing) {
                this.fillForm(editing);
            } else {
                this.resetForm();
            }
        });
    }

    editingTag = computed(() => this.createOnly ? null : this.modalService.tag.editing());

    async submitTag() {
        if (this.tagForm.invalid) {
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

            const editing = this.editingTag();
            const fv = this.tagForm.value;

            if (editing) {
                // Modification du tag
                await this.tagService.updateTag(editing.id, userId, {
                    label: fv.label || '',
                });

                this.modalService.tag.close();
            } else {
                // Création du tag
                await this.tagService.createTag(userId, {
                    label: fv.label || '',
                });
            }

            this.tagService.tagRefreshTrigger.set(
                !this.tagService.tagRefreshTrigger()
            );

            this.resetForm();
        } catch (error) {
            console.error('Erreur lors de la création du tag:', error);
            this.errorMessage.set('Erreur lors de la création du tag');
        } finally {
            this.isSubmitting.set(false);
        }
    }

    async deleteTag(): Promise<void> {
        const editing = this.editingTag();
        if (!editing) return;

        const confirmed = confirm('Supprimer cette transaction ?');
        if (!confirmed) return;

        this.isSubmitting.set(true);

        try {
            await this.tagService.deleteTag(editing.id, editing.user_id);

            this.tagService.tagRefreshTrigger.set(
                !this.tagService.tagRefreshTrigger()
            );

            this.modalService.tag.close();
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            this.errorMessage.set('Erreur lors de la suppression');
        } finally {
            this.isSubmitting.set(false);
        }
    }

    private fillForm(tag: Tag): void {
        this.tagForm.patchValue({
            label: tag.label,
        });
    }

    private resetForm(): void {
        this.tagForm.reset({
            label: '',
        });
    }
}
