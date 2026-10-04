import {Component, computed, input, model} from '@angular/core';
import {LucidePlus, LucideX} from '@lucide/angular';
import {BadgeComponent} from '../badge/badge.component';
import {ButtonComponent} from '../button/button.component';
import {SelectOption} from '../select/select.component';

@Component({
    selector: 'app-tags-input',
    imports: [
        BadgeComponent,
        ButtonComponent,
        LucidePlus,
        LucideX,
    ],
    templateUrl: './tags-input.component.html',
})
export class TagsInputComponent {
    options = input<SelectOption[]>([]);
    selectedTags = model<SelectOption[]>([]);
    newTags = model<string[]>([]);

    availableTagsOptions = computed(() =>
        this.options().filter(tag => !this.selectedTags().some(t => t.value === tag.value))
    );

    addNewTag(input: HTMLInputElement): void {
        const rawValue = input.value.trim();
        if (!rawValue) return;

        const value = rawValue.charAt(0).toUpperCase() + rawValue.slice(1);

        const existsInOptions = this.options().some(
            t => t.label.toLowerCase() === value.toLowerCase()
        );
        const existsInSelected = this.selectedTags().some(
            t => t.label.toLowerCase() === value.toLowerCase()
        );
        const existsInNew = this.newTags().some(
            t => t.toLowerCase() === value.toLowerCase()
        );

        if (existsInOptions || existsInSelected || existsInNew) return;

        this.newTags.update(tags => [...tags, value]);
        input.value = '';
    }

    addExistingTag(tag: SelectOption): void {
        if (!this.selectedTags().some(t => t.value === tag.value)) {
            this.selectedTags.update(tags => [...tags, tag]);
        }
    }

    removeTag(tagLabel: string | number): void {
        this.selectedTags.update(tags => tags.filter(tag => tag.label !== tagLabel));
        this.newTags.update(tags => tags.filter(tag => tag !== tagLabel));
    }
}
