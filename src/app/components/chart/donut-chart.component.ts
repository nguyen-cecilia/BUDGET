import {CurrencyPipe} from "@angular/common";
import {AfterViewInit, Component, ElementRef, inject, Input, OnChanges, SimpleChanges} from '@angular/core';
import {Chart} from 'chart.js';
import './chart-setup';

@Component({
    selector: 'app-donut-chart',
    providers: [CurrencyPipe],
    template: '<canvas #canvas class="block"></canvas>',
    host: {'class': 'block relative w-full'}
})
export class DonutChartComponent implements AfterViewInit, OnChanges {
    @Input() labels: string[] = [];
    @Input() data: number[] = [];
    @Input() colors: string[] = [];
    @Input() currencyCode = '';
    private el = inject(ElementRef);
    private chart?: Chart;
    private currencyPipe = inject(CurrencyPipe);

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
                animation: {
                    duration: 400,
                    animateRotate: false,
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        backgroundColor: '#0a0d16',
                        titleFont: {weight: 600, size: 13},
                        bodyFont: {size: 13},
                        padding: 12,
                        boxPadding: 6,
                        usePointStyle: true,
                        callbacks: {
                            label: (ctx) =>
                                `${ctx.label}: ${this.currencyPipe.transform(ctx.parsed, this.currencyCode)}`,
                        },
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
