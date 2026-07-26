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
        const base = 'flex items-center gap-2 leading-4 transition-all cursor-pointer';

        const variants = {
            primary: 'bg-black-dark text-beige-light hover:bg-black-dark/80 font-medium text-sm justify-center',
            secondary: 'bg-pink border border-black-dark shadow-sm font-bold text-md hover:bg-pink-dark hover:scale-102',
            tertiary: 'bg-green-yellow hover:bg-green-yellow/80 font-medium text-sm justify-center',
            outline: 'bg-beige-lighter border border-gray-light shadow-sm shadow-black-dark/5 font-medium text-sm hover:scale-105',
            sidebar: 'text-gray font-bold hover:bg-blue/50',
            invalid: 'bg-red text-white hover:bg-red/80 font-medium text-sm justify-center'
        };

        const shapes = {
            pill: 'rounded-full p-2.5',
            bigPill: 'rounded-full p-4',
            round: 'rounded-full p-2',
            roundSmall: 'rounded-full p-1',
        };

        return `${base} ${variants[this.variant]} ${shapes[this.shape]}`;
    }
}
