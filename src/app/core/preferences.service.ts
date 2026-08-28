import {effect, Injectable, signal} from '@angular/core';

@Injectable({providedIn: 'root'})
export class PreferencesService {
    private readonly STORAGE_KEY = 'includeFutureTransactions';

    includeFutureTransactions = signal<boolean>(this.loadInitial());

    constructor() {
        effect(() => {
            localStorage.setItem(this.STORAGE_KEY, String(this.includeFutureTransactions()));
        });
    }

    toggle(): void {
        this.includeFutureTransactions.update(v => !v);
    }

    private loadInitial(): boolean {
        return localStorage.getItem(this.STORAGE_KEY) === 'true';
    }
}
