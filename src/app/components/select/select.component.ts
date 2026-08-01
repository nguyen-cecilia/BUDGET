import {
    Component,
    Input,
    Output,
    EventEmitter,
    ContentChild,
    TemplateRef,
    HostListener,
    ElementRef, inject
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LucideChevronDown} from '@lucide/angular';

export interface SelectOption {
    value: string | number;
    label: string;
}

@Component({
    selector: 'app-select',
    standalone: true,
    imports: [CommonModule, LucideChevronDown],
    template: `
        <div class="relative w-full">
            <div
                (click)="toggleDropdown()"
                (keydown.enter)="toggleDropdown()"
                (keydown.space)="toggleDropdown()"
                tabindex="0"
                role="combobox"
                aria-controls="select-dropdown"
                [attr.aria-expanded]="isOpen"
                class="*:cursor-pointer"
            >
                @if (triggerTemplate) {
                    <ng-container
                        *ngTemplateOutlet="triggerTemplate; context: { $implicit: selectedLabel }"
                    ></ng-container>
                } @else {
                    <button
                        type="button"
                        class="flex-1 flex items-center gap-4 rounded-full bg-beige px-4 py-2.5 text-sm font-bold w-full"
                    >
                        @if (label) {
                            <p class="w-1/3 lg:w-auto text-left text-gray uppercase font-medium">{{ label }}</p>
                        }
                        {{ selectedLabel }}
                        <svg lucideChevronDown [size]="20" class="ml-auto pointer-events-none"></svg>
                    </button>
                }
            </div>

            <!-- Dropdown menu -->
            @if (isOpen) {
                <div
                    id="select-dropdown"
                    class="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-light rounded-sm shadow-md z-50 *:cursor-pointer"
                    role="listbox"
                >
                    @for (option of options; track option.value) {
                        <button
                            type="button"
                            (click)="selectOption(option)"
                            class="w-full px-4 py-2 text-left text-sm hover:bg-blue/25 transition-all first:rounded-t-sm last:rounded-b-sm"
                            [class.bg-blue]="option.value === value"
                        >
                            {{ option.label }}
                        </button>
                    }
                </div>
            }
        </div>
    `,
    styles: [`
        :host {
            display: block;
        }
    `]
})
export class SelectComponent {
    private elementRef = inject(ElementRef);
    isOpen = false;

    @Input() options: SelectOption[] = [];
    @Input() value: string | number = '';
    @Input() label = '';
    @Output() valueChange = new EventEmitter<string | number>();

    @ContentChild('trigger') triggerTemplate?: TemplateRef<{ $implicit: string }>;

    get selectedLabel(): string {
        return this.options.find(opt => opt.value === this.value)?.label || this.label || 'Sélectionner';
    }

    toggleDropdown() {
        this.isOpen = !this.isOpen;
    }

    selectOption(option: SelectOption) {
        this.value = option.value;
        this.valueChange.emit(option.value);
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
