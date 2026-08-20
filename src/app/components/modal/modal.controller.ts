import {signal} from '@angular/core';

export class ModalController<T> {
    readonly isOpen = signal(false);
    readonly editing = signal<T | null>(null);
    readonly bulk = signal(false);

    openCreate(): void {
        this.editing.set(null);
        this.bulk.set(false);
        this.isOpen.set(true);
    }

    openCreateBulk(): void {
        this.editing.set(null);
        this.bulk.set(true);
        this.isOpen.set(true);
    }

    openEdit(item: T): void {
        this.editing.set(item);
        this.bulk.set(false);
        this.isOpen.set(true);
    }

    open(data?: T): void {
        this.editing.set(data ?? null);
        this.isOpen.set(true);
    }

    close(): void {
        this.editing.set(null);
        this.bulk.set(false);
        this.isOpen.set(false);
    }
}
