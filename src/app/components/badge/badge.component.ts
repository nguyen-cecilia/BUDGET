import {Component, Input} from '@angular/core';

@Component({
    selector: 'button[app-badge], a[app-badge], div[app-badge]',
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
    @Input() type: 'button' | 'submit' | 'reset' = 'button';
    @Input() disabled = false;
    @Input() variant: 'primary' | 'secondary' | 'outline' = 'primary';

    classes(): string {
        const base = 'flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-gray cursor-pointer transition-all';

        const variants = {
            primary: 'bg-beige-light hover:bg-green',
            secondary: 'bg-yellow hover:bg-pink',
            outline: 'border border-gray/25 hover:border-gray/50',
        };

        return `${base} ${variants[this.variant]}`;
    }
}
