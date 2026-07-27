import {Component, Input, ElementRef, AfterViewInit, inject} from '@angular/core';
import {Chart, registerables} from 'chart.js';

Chart.register(...registerables);

@Component({
    selector: 'app-pie-chart',
    template: '<canvas #canvas></canvas>',
    host: {
        'class': 'block',
    }
})
export class PieChartComponent implements AfterViewInit {
    @Input() labels: string[] = [];
    @Input() data: number[] = [];
    @Input() colors: string[] = [];
    private el = inject(ElementRef);

    ngAfterViewInit() {
        new Chart(this.el.nativeElement.querySelector('canvas'), {
            type: 'doughnut',
            data: {
                labels: this.labels,
                datasets: [{
                    data: this.data,
                    backgroundColor: this.colors,
                    borderRadius: 20,
                    spacing: 3,
                }],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false,
                    },
                },
                elements: {
                    arc: {
                        borderWidth: 1,
                    },
                },
            },
        });
    }
}
