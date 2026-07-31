import {Component} from '@angular/core';
import {LucidePlus} from '@lucide/angular';
import {ButtonComponent} from '../../components/button/button.component';
import {BadgeComponent} from '../../components/badge/badge.component';

@Component({
    selector: 'app-style-guide',
    imports: [ButtonComponent, BadgeComponent, LucidePlus],
    templateUrl: './style-guide.component.html',
})
export class StyleGuideComponent {
    colors = [
        'bg-purple', 'bg-blue', 'bg-blue-dark', 'bg-green', 'bg-green-yellow',
        'bg-yellow', 'bg-beige', 'bg-orange', 'bg-pink', 'bg-pink-dark',
        'bg-pink-darker', 'bg-red', 'bg-brown', 'bg-gray', 'bg-black-dark',
    ];

    textSizes = ['text-xxs', 'text-xs', 'text-sm', 'text-base', 'text-md', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
    buttonVariants = ['primary', 'secondary', 'tertiary', 'outline', 'sidebar', 'invalid'] as const;
    buttonShapes = ['pill', 'bigPill', 'round', 'roundSmall'] as const;
    badgeVariants = ['primary', 'secondary', 'outline'] as const;
    radii = ['rounded-xxs', 'rounded-xs', 'rounded-sm', 'rounded-default', 'rounded-full'] as const;
}
