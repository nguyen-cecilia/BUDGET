import {Component, DestroyRef, ElementRef, inject, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {AbstractControl, ReactiveFormsModule} from '@angular/forms';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import {French} from 'flatpickr/dist/l10n/fr';
import {DateService} from '../../core/date.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

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
    private destroyRef = inject(DestroyRef);

    ngOnInit() {
        const initialValue = this.control.value;
        const parsed = initialValue ? this.dateService.formatFromIsoToDate(initialValue) : undefined;

        this.flatpickrInstance = flatpickr(this.inputRef.nativeElement, {
            locale: French,
            dateFormat: this.hasTime ? 'd/m/Y H:i' : 'd/m/Y',
            enableTime: this.hasTime,
            defaultDate: parsed,
            onChange: (_dates, dateStr) => {
                this.control.setValue(this.dateService.formatFromDateToIso(dateStr, this.hasTime), {emitEvent: false});
            },
        });

        if (!initialValue) {
            const format = this.hasTime ? 'd/m/Y H:i' : 'd/m/Y';
            this.control.setValue(this.dateService.formatFromDateToIso(
                this.flatpickrInstance.formatDate(new Date(), format), this.hasTime
            ), {emitEvent: false});
        }

        this.control.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(value => {
            if (this.flatpickrInstance && value) {
                this.flatpickrInstance.setDate(this.dateService.formatFromIsoToDate(value), true);
            }
        });
    }

    ngOnDestroy() {
        this.flatpickrInstance?.destroy();
    }
}
