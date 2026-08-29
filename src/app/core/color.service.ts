import {Injectable} from '@angular/core';

interface ColorConfig {
    background: string;
    backgroundLighter: string;
    decoration: string;
    color: string;
    icon?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ColorService {
    private readonly colorMap: Record<string, ColorConfig> = {
        grayLight: {
            background: 'bg-gray-light',
            backgroundLighter: 'bg-gray-light/70',
            decoration: 'decoration-gray-light',
            color: 'text-gray-light',
        },
        gray: {
            background: 'bg-gray',
            backgroundLighter: 'bg-gray/30',
            decoration: 'decoration-gray',
            color: 'text-gray',
        },
        purple: {
            background: 'bg-purple',
            backgroundLighter: 'bg-purple/30',
            decoration: 'decoration-purple',
            color: 'text-purple',
        },
        blueDark: {
            background: 'bg-blue-dark',
            backgroundLighter: 'bg-blue-dark/30',
            decoration: 'decoration-blue-dark',
            color: 'text-blue-dark',
        },
        blue: {
            background: 'bg-blue',
            backgroundLighter: 'bg-blue/30',
            decoration: 'decoration-blue',
            color: 'text-blue',
        },
        teal: {
            background: 'bg-teal',
            backgroundLighter: 'bg-teal/30',
            decoration: 'decoration-teal',
            color: 'text-teal',
        },
        green: {
            background: 'bg-green',
            backgroundLighter: 'bg-green/30',
            decoration: 'decoration-green',
            color: 'text-green',
        },
        greenYellow: {
            background: 'bg-green-yellow',
            backgroundLighter: 'bg-green-yellow/30',
            decoration: 'decoration-green-yellow',
            color: 'text-green-yellow',
        },
        yellow: {
            background: 'bg-yellow',
            backgroundLighter: 'bg-yellow/30',
            decoration: 'decoration-yellow',
            color: 'text-yellow',
        },
        orange: {
            background: 'bg-orange',
            backgroundLighter: 'bg-orange/30',
            decoration: 'decoration-orange',
            color: 'text-orange',
        },
        pink: {
            background: 'bg-pink',
            backgroundLighter: 'bg-pink/30',
            decoration: 'decoration-pink',
            color: 'text-pink',
        },
        pinkDarker: {
            background: 'bg-pink-darker',
            backgroundLighter: 'bg-pink-darker/30',
            decoration: 'decoration-pink-darker',
            color: 'text-pink-darker',
        },
        brown: {
            background: 'bg-brown',
            backgroundLighter: 'bg-brown/30',
            decoration: 'decoration-brown',
            color: 'text-brown',
        }
    };

    getBackground(color: string | null): string {
        if (!color) {
            return '';
        }

        return this.colorMap[color]?.background ?? '';
    }

    getBackgroundLighter(color: string | null): string {
        if (!color) {
            return '';
        }

        return this.colorMap[color]?.backgroundLighter ?? '';
    }

    getDecoration(color: string | null): string {
        if (!color) {
            return '';
        }

        return this.colorMap[color]?.decoration ?? '';
    }

    getColor(color: string | null): string {
        if (!color) {
            return '';
        }

        return this.colorMap[color]?.color ?? '';
    }

    private static toCssVar(color: string): string {
        return `--color-${color.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    }

    getHex(color: string | null): string {
        if (!color) return '#95a2b6';

        const value = getComputedStyle(document.documentElement)
            .getPropertyValue(ColorService.toCssVar(color))
            .trim();

        return value || '#95a2b6';
    }

    getConfig(color: string): ColorConfig {
        return this.colorMap[color];
    }

    getAvailableColors(): string[] {
        return Object.keys(this.colorMap).filter(color => color !== 'grayLight');
    }
}
