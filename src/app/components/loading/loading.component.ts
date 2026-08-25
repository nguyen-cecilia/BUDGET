import {Component, Input} from '@angular/core';

@Component({
    selector: 'app-loading',
    template: `
        <div class="flex flex-col items-center justify-center gap-3 py-12 text-muted">
            <div class="fill-yellow">
                <svg viewBox="0 0 100 100" class="size-15 animate-spin">
                    <polygon
                        points="100,50 78.53,59.27 90.45,79.39 67.63,74.27 65.45,97.55 50,80 34.55,97.55 32.37,74.27 9.55,79.39 21.47,59.27 0,50 21.47,40.73 9.55,20.61 32.37,25.73 34.55,2.45 50,20 65.45,2.45 67.63,25.73 90.45,20.61 78.53,40.73"
                        stroke-width="1"
                        class="stroke-ink"
                    />
                </svg>
            </div>
            @if (label) {
                <p>{{ label }}</p>
            }
        </div>
    `,
})
export class LoadingComponent {
    @Input() label = 'Chargement en cours...';
}
