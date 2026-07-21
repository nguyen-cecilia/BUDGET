import {Injectable} from '@angular/core';

interface ColorConfig {
    background: string;
    color: string;
    icon?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ColorService {
    private readonly colorMap: Record<string, ColorConfig> = {
        gray: {background: 'bg-gray', color: 'text-gray'},
        purple: {background: 'bg-purple', color: 'text-purple'},
        blueDark: {background: 'bg-blue-dark', color: 'text-blue-dark'},
        blue: {background: 'bg-blue', color: 'text-blue'},
        green: {background: 'bg-green', color: 'text-green'},
        greenYellow: {background: 'bg-green-yellow', color: 'text-green-yellow'},
        yellow: {background: 'bg-yellow', color: 'text-yellow'},
        orange: {background: 'bg-orange', color: 'text-orange'},
        pink: {background: 'bg-pink', color: 'text-pink'},
        pinkDark: {background: 'bg-pink-darker', color: 'text-pink-darker'},
    };

    getBackground(color: string | null): string {
        if (!color) {
            return '';
        }

        return this.colorMap[color]?.background ?? '';
    }

    getColor(color: string | null): string {
        if (!color) {
            return '';
        }

        return this.colorMap[color]?.color ?? '';
    }

    getConfig(color: string): ColorConfig {
        return this.colorMap[color];
    }
}
