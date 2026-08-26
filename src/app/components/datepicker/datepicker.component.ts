import {Component, ElementRef, inject, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {AbstractControl, ReactiveFormsModule} from '@angular/forms';
import flatpickr from 'flatpickr';
import {French} from 'flatpickr/dist/l10n/fr';
import {DateService} from '../../core/date.service';

@Component({
    selector: 'app-datepicker',
    standalone: true,
    imports: [ReactiveFormsModule],
    template: `
        <input #input type="text" [placeholder]="this.placeholder" readonly/>
    `,
    host: {
        'class': 'block',
    },
})
export class DatePickerComponent implements OnInit, OnDestroy {
    @Input({ required: true }) control!: AbstractControl;
    @Input() placeholder = 'jj/mm/aaaa H:m';
    @Input() hasTime = false;

    @ViewChild('input', {static: true}) inputRef!: ElementRef<HTMLInputElement>;

    private flatpickrInstance?: flatpickr.Instance;
    private dateService = inject(DateService);

    ngOnInit() {
        const initialValue = this.control.value;
        const parsed = initialValue ? this.dateService.formatFromIsoToDate(initialValue) : undefined;

        this.flatpickrInstance = flatpickr(this.inputRef.nativeElement, {
            locale: French,
            dateFormat: `d/m/Y${this.hasTime ? ' H:i' : ''}`,
            enableTime: this.hasTime,
            defaultDate: parsed,
            onChange: (_dates, dateStr) => {
                this.control.setValue(this.dateService.formatFromDateToIso(dateStr), {emitEvent: false});
            },
        });

        if (!initialValue) {
            this.control.setValue(this.dateService.formatFromDateToIso(
                this.flatpickrInstance.formatDate(new Date(), `d/m/Y${this.hasTime ? ' H:i' : ''}`)
            ), {emitEvent: false});
        }
    }

    ngOnDestroy() {
        this.flatpickrInstance?.destroy();
    }
}
