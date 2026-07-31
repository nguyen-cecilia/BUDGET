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
        const base = 'flex items-center gap-2 leading-4 text-sm transition-all cursor-pointer hover:scale-103';

        const variants = {
            primary: 'bg-black-dark text-beige-light hover:bg-black-dark/80 font-medium justify-center',
            secondary: 'bg-pink border border-black-dark shadow-sm hover:bg-pink-dark ',
            tertiary: 'bg-green-yellow hover:bg-green-yellow/80 font-medium justify-center',
            outline: 'bg-beige-lighter border border-gray-light shadow-sm shadow-black-dark/5 font-medium',
            sidebar: 'text-gray hover:bg-blue/50',
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
