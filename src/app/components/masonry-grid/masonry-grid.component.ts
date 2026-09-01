import {AfterViewInit, Component, ElementRef, inject, Input, OnDestroy} from '@angular/core';
import Masonry from 'masonry-layout';

@Component({
    selector: 'app-masonry-grid',
    template: `
        <ng-content></ng-content>
    `,
    host: {
        'class': 'block w-full',
    },
})
export class MasonryGridComponent implements AfterViewInit, OnDestroy {
    @Input() itemSelector = '.grid-item';

    private elementRef = inject(ElementRef<HTMLElement>);
    private masonryInstance: Masonry | null = null;

    ngAfterViewInit(): void {
        this.masonryInstance = new Masonry(this.elementRef.nativeElement, {
            itemSelector: this.itemSelector,
            columnWidth: this.itemSelector,
            gutter: '.gutter-sizer',
            percentPosition: true,
        });
    }

    reloadLayout(): void {
        this.masonryInstance?.reloadItems?.();
        this.masonryInstance?.layout?.();
    }

    ngOnDestroy(): void {
        this.masonryInstance?.destroy?.();
    }
}
