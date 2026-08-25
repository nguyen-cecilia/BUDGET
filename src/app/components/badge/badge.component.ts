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
        const base = 'flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-muted cursor-pointer transition-all';

        const variants = {
            primary: 'bg-base hover:bg-green dark:hover:text-surface',
            secondary: 'bg-yellow dark:text-surface hover:bg-pink',
            outline: 'border border-muted/25 hover:border-muted/50',
        };

        return `${base} ${variants[this.variant]}`;
    }
}
