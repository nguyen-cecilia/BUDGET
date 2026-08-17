import {AfterViewInit, Component, ElementRef, inject, Input, OnChanges, SimpleChanges} from '@angular/core';
import {Chart, registerables} from 'chart.js';

Chart.register(...registerables);

@Component({
    selector: 'app-donut-chart',
    template: '<canvas #canvas class="block"></canvas>',
    host: {'class': 'block relative w-full'}
})
export class DonutChartComponent implements AfterViewInit, OnChanges {
    @Input() labels: string[] = [];
    @Input() data: number[] = [];
    @Input() colors: string[] = [];
    private el = inject(ElementRef);
    private chart?: Chart;

    ngAfterViewInit() {
        this.createChart();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (this.chart && (changes['data'] || changes['labels'] || changes['colors'])) {
            this.chart.data.labels = this.labels;
            this.chart.data.datasets[0].data = this.data;
            this.chart.data.datasets[0].backgroundColor = this.colors;
            this.chart.update('none');
        }
    }

    private createChart() {
        this.chart = new Chart(this.el.nativeElement.querySelector('canvas'), {
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
