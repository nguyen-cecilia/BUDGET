import {Injectable} from '@angular/core';

export type CategoryType =
    'all'
    | 'house'
    | 'health'
    | 'work'
    | 'shopping'
    | 'grocery'
    | 'eatout'
    | 'transportation'
    | 'leisure'
    | 'gifts'
    ;

interface CategoryConfig {
    color: string;
    label: string;
    icon?: string;
}

@Injectable({
    providedIn: 'root'
})
export class CategoryColorService {
    private readonly categoryMap: Record<CategoryType, CategoryConfig> = {
        all: {color: 'bg-gray/15', label: 'Tous'},
        house: {color: 'bg-purple/30 hover:bg-purple/50', label: 'Maison'},
        health: {color: 'bg-blue-dark/30 hover:bg-blue-dark/50', label: 'Santé'},
        work: {color: 'bg-blue/30 hover:bg-blue/50', label: 'Professionnel'},
        grocery: {color: 'bg-green/30 hover:bg-green/50', label: 'Courses'},
        transportation: {color: 'bg-green-yellow/30 hover:bg-green-yellow/50', label: 'Transport'},
        shopping: {color: 'bg-yellow/30 hover:bg-yellow/50', label: 'Shopping'},
        eatout: {color: 'bg-orange/30 hover:bg-orange/50', label: 'Restaurant'},
        leisure: {color: 'bg-pink/30 hover:bg-pink/50', label: 'Loisirs'},
        gifts: {color: 'bg-pink-darker/30 hover:bg-pink-darker/50', label: 'Cadeaux'},
    };

    getColor(category: CategoryType | null): string {
        if (!category) {
            return '';
        }

        return this.categoryMap[category]?.color ?? 'bg-gray/50';
    }

    getLabel(category: CategoryType | null): string {
        if (!category) {
            return '';
        }

        return this.categoryMap[category]?.label ?? category;
    }

    getConfig(category: CategoryType): CategoryConfig {
        return this.categoryMap[category];
    }
}
