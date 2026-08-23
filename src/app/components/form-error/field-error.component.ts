import {Component, input} from '@angular/core';
import {AbstractControl} from '@angular/forms';

@Component({
    selector: 'app-field-error',
    template: `
        @for (entry of activeMessages(); track entry.key) {
            <span class="block text-red text-xs">{{ entry.message }}</span>
        }
    `,
})
export class FieldErrorComponent {
    control = input.required<AbstractControl>();
    messages = input<Record<string, string>>({});

    show(): boolean {
        const control = this.control();
        return control.invalid && (control.dirty || control.touched);
    }

    activeMessages(): { key: string; message: string }[] {
        if (!this.show()) return [];
        return Object.keys(this.control().errors ?? {}).map(key => ({
            key,
            message: this.messages()[key] ?? 'Champ invalide.',
        }));
    }
}
