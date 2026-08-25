import {Component, Input} from '@angular/core';

@Component({
    selector: 'button[app-button], a[app-button]',
    template: `
        <ng-content/>
    `,
    host: {
        '[class]': 'classes()',
        '[attr.type]': 'type',
        '[attr.disabled]': 'disabled ? "" : null',
    },
})
export class ButtonComponent {
    @Input() type: 'button' | 'submit' | 'reset' = 'button';
    @Input() disabled = false;
    @Input() variant: 'primary' | 'secondary' | 'tertiary' | 'outline' | 'sidebar' | 'invalid' = 'primary';
    @Input() shape: 'pill' | 'bigPill' | 'round' | 'roundSmall' = 'pill';

    classes(): string {
        const base = 'flex items-center gap-2 leading-4 text-sm transition-all cursor-pointer hover:scale-103 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100';

        const variants = {
            primary: 'bg-ink text-base hover:bg-ink/80 font-medium justify-center',
            secondary: 'bg-pink border border-ink shadow-sm hover:bg-pink-dark dark:text-surface dark:border-surface',
            tertiary: 'bg-green-yellow dark:text-surface hover:bg-green-yellow/80 dark:hover:text-ink font-medium justify-center',
            outline: 'bg-surface border border-line shadow-sm shadow-ink/5 font-medium',
            sidebar: 'text-muted hover:bg-blue/50',
            invalid: 'bg-red text-white hover:bg-red/80 font-medium justify-center'
        };

        const shapes = {
            pill: 'rounded-full py-2.5 px-3.5',
            bigPill: 'rounded-full py-4 px-5',
            round: 'rounded-full p-2',
            roundSmall: 'rounded-full p-1',
        };

        return `${base} ${variants[this.variant]} ${shapes[this.shape]}`;
    }
}
