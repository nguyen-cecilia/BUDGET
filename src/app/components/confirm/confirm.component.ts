import {LucideTrash2} from '@lucide/angular';
import {Component, inject, signal} from '@angular/core';
import {ButtonComponent} from '../button/button.component';
import {ModalService} from '../modal/modal.service';

export interface ConfirmPayload {
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
}

@Component({
    selector: 'app-confirm',
    imports: [
        ButtonComponent,
        LucideTrash2
    ],
    templateUrl: './confirm.component.html',
})
export class ConfirmComponent {
    protected modalService = inject(ModalService);
    isConfirming = signal(false);

    cancel(): void {
        this.modalService.confirm.close();
    }

    async confirm(): Promise<void> {
        const payload = this.modalService.confirm.editing();
        if (!payload) return;
        this.isConfirming.set(true);
        try {
            await payload.onConfirm();
        } finally {
            this.isConfirming.set(false);
            this.modalService.confirm.close();
        }
    }
}
