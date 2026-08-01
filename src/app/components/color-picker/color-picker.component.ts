import {Component, ElementRef, EventEmitter, HostListener, inject, Input, Output} from '@angular/core';
import {ColorService} from '../../core/color.service';
import {LucideChevronDown} from '@lucide/angular';

@Component({
    selector: 'app-color-picker',
    imports: [
        LucideChevronDown
    ],
    templateUrl: './color-picker.component.html',
})
export class ColorPickerComponent {
    private elementRef = inject(ElementRef);
    protected colorService = inject(ColorService);

    isOpen = false;
    availableColors = this.colorService.getAvailableColors();

    @Input() color = 'gray';
    @Output() colorChange = new EventEmitter<string>();

    toggle(): void {
        this.isOpen = !this.isOpen;
    }

    select(color: string): void {
        this.color = color;
        this.colorChange.emit(color);
        this.isOpen = false;
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!this.elementRef.nativeElement.contains(target)) {
            this.isOpen = false;
        }
    }
}
