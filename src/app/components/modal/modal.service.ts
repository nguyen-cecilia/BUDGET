import {Injectable, signal} from '@angular/core';
import {Transaction} from '../../features/transactions/transaction.model';

@Injectable({
    providedIn: 'root'
})
export class ModalService {
    editModalOpen = signal(false);
    editingTransaction = signal<Transaction | null>(null);

    openCreateModal(): void {
        this.editingTransaction.set(null);
        this.editModalOpen.set(true);
    }

    openEditModal(transaction: Transaction): void {
        this.editingTransaction.set(transaction);
        this.editModalOpen.set(true);
    }

    closeEditModal(): void {
        this.editingTransaction.set(null);
        this.editModalOpen.set(false);
    }
}
