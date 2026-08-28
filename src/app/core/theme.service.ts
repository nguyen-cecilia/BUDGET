import {effect, Injectable, signal} from '@angular/core';

const THEME_COLOR_DARK = '#181825';
const THEME_COLOR_LIGHT = '#faf4e4';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    private readonly STORAGE_KEY = 'theme';
    isDark = signal<boolean>(this.loadInitial());

    private readonly themeColorMeta: HTMLMetaElement;

    constructor() {
        document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.remove());
        const meta = document.createElement('meta');
        meta.name = 'theme-color';
        document.head.appendChild(meta);
        this.themeColorMeta = meta;

        effect(() => {
            const dark = this.isDark();
            document.documentElement.classList.toggle('dark', dark);
            localStorage.setItem(this.STORAGE_KEY, dark ? 'dark' : 'light');
            this.themeColorMeta.content = dark ? THEME_COLOR_DARK : THEME_COLOR_LIGHT;
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
