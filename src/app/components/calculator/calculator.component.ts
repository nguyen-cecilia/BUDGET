import {Component, signal} from '@angular/core';
import {ButtonComponent} from '../button/button.component';
import {LucideDelete, LucideDivide, LucideEqual, LucideMinus, LucidePlus, LucideX} from '@lucide/angular';

@Component({
    selector: 'app-calculator',
    standalone: true,
    imports: [ButtonComponent, LucideX, LucideDelete, LucidePlus, LucideMinus, LucideDivide, LucideEqual],
    template: `
        @if (isOpen()) {
            <div
                class="fixed inset-0 z-40 bg-linear-to-br from-ink/70 to-ink/50 backdrop-blur-xs flex items-center justify-center"
                role="presentation"
                (click)="onBackdropClick($event)"
                (keydown.escape)="close()"
            >
                <div
                    class="bg-surface border border-line rounded shadow-xl m-3 w-full max-w-9/10 lg:max-w-80"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Calculatrice"
                >
                    <div class="flex justify-between items-center p-4 border-b border-line">
                        <h2>Calculatrice</h2>
                        <button
                            type="button"
                            (click)="close()"
                            aria-label="Fermer la calculatrice"
                            class="cursor-pointer p-2 rounded-full bg-base border border-base hover:bg-blue hover:border hover:border-ink hover:shadow-md focus:outline-none"
                        >
                            <svg lucideX [size]="20"/>
                        </button>
                    </div>

                    <div class="px-4 pt-4 pb-2 text-right">
                        <p class="text-muted text-sm h-4 truncate">{{ expression() }}</p>
                        <p class="font-display text-2xl font-semibold truncate">{{ display() }}</p>
                    </div>

                    <div class="grid grid-cols-4 gap-1 p-4 *:justify-center">
                        <button app-button variant="outline" (click)="onDigit('7')">7</button>
                        <button app-button variant="outline" (click)="onDigit('8')">8</button>
                        <button app-button variant="outline" (click)="onDigit('9')">9</button>
                        <button app-button variant="secondary" (click)="onOperator('/')">
                            <svg lucideDivide [size]="16"></svg>
                        </button>

                        <button app-button variant="outline" (click)="onDigit('4')">4</button>
                        <button app-button variant="outline" (click)="onDigit('5')">5</button>
                        <button app-button variant="outline" (click)="onDigit('6')">6</button>
                        <button app-button variant="secondary" (click)="onOperator('*')">
                            <svg lucideX [size]="16"></svg>
                        </button>

                        <button app-button variant="outline" (click)="onDigit('1')">1</button>
                        <button app-button variant="outline" (click)="onDigit('2')">2</button>
                        <button app-button variant="outline" (click)="onDigit('3')">3</button>
                        <button app-button variant="secondary" (click)="onOperator('-')">
                            <svg lucideMinus [size]="16"></svg>
                        </button>

                        <button app-button variant="outline" (click)="onDigit('0')">0</button>
                        <button app-button variant="outline" (click)="onDigit('.')">.</button>
                        <button app-button variant="outline" (click)="onBackspace()">
                            <svg lucideDelete [size]="16"></svg>
                        </button>
                        <button app-button variant="secondary" (click)="onOperator('+')">
                            <svg lucidePlus [size]="16"></svg>
                        </button>

                        <button app-button variant="outline" class="col-span-2" (click)="onClear()">C</button>
                        <button app-button class="col-span-2" (click)="onEquals()">
                            <svg lucideEqual [size]="16"></svg>
                        </button>
                    </div>
                </div>
            </div>
        }
    `,
})
export class CalculatorComponent {
    isOpen = signal(false);
    display = signal('0');
    expression = signal('');

    private firstOperand: number | null = null;
    private operator: string | null = null;
    private waitingForOperand = false;

    open(): void {
        this.isOpen.set(true);
    }

    close(): void {
        this.isOpen.set(false);
        this.reset();
    }

    onBackdropClick(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            this.close();
        }
    }

    onDigit(d: string): void {
        if (this.waitingForOperand) {
            this.display.set(d === '.' ? '0.' : d);
            this.waitingForOperand = false;
            return;
        }

        const current = this.display();

        if (d === '.' && current.includes('.')) return;

        this.display.set(current === '0' && d !== '.' ? d : current + d);
    }

    onOperator(op: string): void {
        const current = parseFloat(this.display());

        if (this.firstOperand !== null && !this.waitingForOperand) {
            const result = this.compute(this.firstOperand, this.operator!, current);
            this.display.set(String(result));
            this.firstOperand = result;
        } else {
            this.firstOperand = current;
        }

        this.operator = op;
        this.waitingForOperand = true;

        const opSymbol = this.getOperatorSymbol(op);
        this.expression.set(`${this.firstOperand} ${opSymbol}`);
    }

    onEquals(): void {
        if (this.firstOperand === null || this.operator === null) return;

        const current = parseFloat(this.display());
        const result = this.compute(this.firstOperand, this.operator, current);
        const opSymbol = this.getOperatorSymbol(this.operator);

        this.expression.set(`${this.firstOperand} ${opSymbol} ${current} =`);
        this.display.set(String(result));
        this.firstOperand = null;
        this.operator = null;
        this.waitingForOperand = true;
    }

    onClear(): void {
        this.reset();
    }

    onBackspace(): void {
        if (this.waitingForOperand) return;
        const current = this.display();
        this.display.set(current.length > 1 ? current.slice(0, -1) : '0');
    }

    private reset(): void {
        this.display.set('0');
        this.expression.set('');
        this.firstOperand = null;
        this.operator = null;
        this.waitingForOperand = false;
    }

    private compute(a: number, op: string, b: number): number {
        switch (op) {
            case '+':
                return a + b;
            case '-':
                return a - b;
            case '*':
                return a * b;
            case '/':
                return b !== 0 ? a / b : 0;
            default:
                return b;
        }
    }

    private getOperatorSymbol(op: string): string {
        switch (op) {
            case '+':
                return '+';
            case '-':
                return '−';
            case '*':
                return '×';
            case '/':
                return '÷';
            default:
                return op;
        }
    }
}
