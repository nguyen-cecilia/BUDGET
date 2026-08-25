import {effect, Injectable, signal} from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    private readonly STORAGE_KEY = 'theme';
    isDark = signal<boolean>(this.loadInitial());

    constructor() {
        effect(() => {
            const dark = this.isDark();
            document.documentElement.classList.toggle('dark', dark);
            localStorage.setItem(this.STORAGE_KEY, dark ? 'dark' : 'light');
        });
    }

    toggle(): void {
        this.isDark.update(v => !v);
    }

    private loadInitial(): boolean {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) return stored === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
}
