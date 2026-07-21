import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ModalService {
    editModalOpen = signal(false);

    openEditModal(): void {
        this.editModalOpen.set(true);
    }

    closeEditModal(): void {
        this.editModalOpen.set(false);
    }
}
