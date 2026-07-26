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
    @Input() onClose?: () => void;

    open(): void {
        this.isOpen.set(true);
    }

    close(): void {
        if (this.onClose) {
            this.onClose();
        } else {
            this.isOpen.set(false);
        }
    }
}
