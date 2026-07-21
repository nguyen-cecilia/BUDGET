import {Component, Input, signal} from '@angular/core';
import {LucideX} from '@lucide/angular';

@Component({
    selector: 'app-modal',
    standalone: true,
    templateUrl: './modal.component.html',
    imports: [
        LucideX
    ]
})
export class ModalComponent {
    @Input() isOpen = signal(false);
    @Input() title = '';

    open(): void {
        this.isOpen.set(true);
    }

    close(): void {
        this.isOpen.set(false);
    }
}
