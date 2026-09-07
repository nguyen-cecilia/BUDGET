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
                class="fixed z-40 w-full max-w-85/100 lg:max-w-70 bg-surface border border-line rounded shadow-muted/50"
                [class]="isDragging() ? 'shadow-xl' : 'shadow-2xl'"
                role="dialog"
                aria-label="Calculatrice"
                [style.left.px]="posX()"
                [style.top.px]="posY()"
                (keydown.escape)="close()"
                tabindex="0"
            >
                <div
                    class="flex justify-between items-center p-4 border-b border-line cursor-grab select-none"
                    (mousedown)="onDragStart($event)"
                >
                    <h2>Calculatrice</h2>
                    <button
                        type="button"
                        (click)="close()"
                        aria-label="Fermer la calculatrice"
                        class="cursor-pointer p-2 rounded-full bg-canvas border border-base hover:bg-blue hover:border hover:border-ink hover:shadow-md focus:outline-none"
                    >
                        <svg lucideX [size]="20"/>
                    </button>
                </div>

                <div class="px-4 pt-4 pb-1 text-right">
                    <p class="text-muted text-xs h-4 truncate">{{ expression() }}</p>
                    <p class="font-display text-xl font-semibold truncate">{{ display() }}</p>
                </div>

                <div class="grid grid-cols-4 gap-1.5 p-2 *:justify-center text-base! lg:text-sm!">
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
        }
    `,
})
export class CalculatorComponent {
    isOpen = signal(false);
    display = signal('0');
    expression = signal('');
    posX = signal(0);
    posY = signal(0);

    isDragging = signal(false);

    private firstOperand: number | null = null;
    private operator: string | null = null;
    private waitingForOperand = false;
    private dragOffsetX = 0;
    private dragOffsetY = 0;

    open(): void {
        this.isOpen.set(true);
        const isMobile = window.innerWidth < 1024;

        if (isMobile) {
            this.posX.set(Math.max(12, (window.innerWidth - 310) / 2));
            this.posY.set(Math.max(12, (window.innerHeight - 380) / 2));
        } else if (this.posX() === 0 && this.posY() === 0) {
            this.posX.set(window.innerWidth - 310);
            this.posY.set(Math.max(0, window.innerHeight - 490));
        }
    }

    close(): void {
        this.isOpen.set(false);
    }

    onDragStart(event: MouseEvent): void {
        if (window.innerWidth < 1024) return;
        this.isDragging.set(true);
        this.dragOffsetX = event.clientX - this.posX();
        this.dragOffsetY = event.clientY - this.posY();
        event.preventDefault();

        const onMove = (e: MouseEvent) => {
            if (!this.isDragging()) return;
            this.posX.set(Math.max(0, Math.min(e.clientX - this.dragOffsetX, window.innerWidth - 270)));
            this.posY.set(Math.max(0, Math.min(e.clientY - this.dragOffsetY, window.innerHeight - 100)));
        };

        const onUp = () => {
            this.isDragging.set(false);
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
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
