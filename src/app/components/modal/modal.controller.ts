import {signal} from '@angular/core';

export class ModalController<T> {
    readonly isOpen = signal(false);
    readonly editing = signal<T | null>(null);

    openCreate(): void {
        this.editing.set(null);
        this.isOpen.set(true);
    }

    openEdit(item: T): void {
        this.editing.set(item);
        this.isOpen.set(true);
    }

    close(): void {
        this.editing.set(null);
        this.isOpen.set(false);
    }
}
