import {AbstractControl, ValidationErrors} from "@angular/forms";

export default function positiveNumber(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value === '' || value === null || value === undefined) return null;
    const num = parseFloat(value);
    return !isNaN(num) && num > 0 ? null : {positiveNumber: true};
}

export function nonNegativeNumber(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value === '' || value === null || value === undefined) return null;
    const num = parseFloat(String(value).replace(',', '.'));
    return !isNaN(num) && num >= 0 ? null : {nonNegativeNumber: true};
}
