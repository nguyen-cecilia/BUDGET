import {Component, inject, Input} from '@angular/core';
import {CategoryColorService, CategoryType} from '../../core/category-color.service';

@Component({
    selector: 'button[app-badge], a[app-badge]',
    template: `
        <ng-content/>
    `,
    host: {
        '[class]': 'classes()',
        '[attr.type]': 'type',
        '[attr.disabled]': 'disabled ? "" : null',
    },
})
export class BadgeComponent {
    private categoryColorService = inject(CategoryColorService);

    @Input() type: 'button' | 'submit' | 'reset' = 'button';
    @Input() disabled = false;
    @Input() variant: 'primary' | 'outline' = 'primary';
    @Input() category: CategoryType | null = null;

    classes(): string {
        const base = 'rounded-full px-3 py-1 text-xs font-bold text-gray cursor-pointer transition-all';

        const variants = {
            primary: '',
            outline: 'border border-gray/25 hover:border-gray/50',
        };

        return `${base} ${variants[this.variant]} ${this.categoryColorService.getColor(this.category)}`;
    }
}
