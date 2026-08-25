import {Component, input} from '@angular/core';

@Component({
    selector: 'app-form-error',
    template: `
        @if (message()) {
            @if (type() === 'success') {
                <div class="text-green bg-green/15 px-3 py-2 border border-green/50 rounded-xs font-medium">{{ message() }}</div>
            } @else {
                <div class="text-red bg-red/15 px-3 py-2 border border-red/50 rounded-xs font-medium">{{ message() }}</div>
            }
        }
    `,
    host: {
        '[class]': `message() ? 'block' : 'hidden'`,
    }
})
export class FormErrorComponent {
    message = input<string | null>(null);
    type = input<'error' | 'success'>('error');
}
