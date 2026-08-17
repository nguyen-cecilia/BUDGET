import {CurrencyPipe} from "@angular/common";
import {AfterViewInit, Component, ElementRef, inject, Input, OnChanges, SimpleChanges} from '@angular/core';
import {Chart, registerables} from 'chart.js';

Chart.register(...registerables);
Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = '#515869';

export interface BarChartDataset {
    label: string;
    data: number[];
    backgroundColor: string;
}

@Component({
    selector: 'app-bar-chart',
    providers: [CurrencyPipe],
    template: '<canvas #canvas class="block"></canvas>',
    host: {'class': 'block relative w-full min-h-80'},
})
export class BarChartComponent implements AfterViewInit, OnChanges {
    @Input() labels: string[] = [];
    @Input() datasets: BarChartDataset[] = [];
    @Input() currencyCode = '';
    @Input() monthLabels: string[] = [];
    private el = inject(ElementRef);
    private chart?: Chart;
    private currencyPipe = inject(CurrencyPipe);

    ngAfterViewInit() {
        this.createChart();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (this.chart && (changes['labels'] || changes['datasets'])) {
            this.chart.data.labels = this.labels;
            this.chart.data.datasets = this.datasets;
            this.chart.update('none');
        }
    }

    private createChart() {
        this.chart = new Chart(this.el.nativeElement.querySelector('canvas'), {
            type: 'bar',
            data: {
                labels: this.labels,
                datasets: this.datasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 2,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        align: 'start',
                        labels: {
                            usePointStyle: true,
                            pointStyle: 'circle',
                            boxWidth: 8,
                            boxHeight: 8,
                            padding: 16,
                            textAlign: 'left',
                        },
                    },
                    tooltip: {
                        backgroundColor: '#0a0d16',
                        titleFont: {weight: 600, size: 13},
                        bodyFont: {size: 13},
                        padding: 12,
                        boxPadding: 6,
                        usePointStyle: true,
                        callbacks: {
                            title: (items) =>
                                this.monthLabels[items[0]?.dataIndex ?? 0] ?? items[0].label,
                            label: (ctx) =>
                                `${ctx.dataset.label}: ${this.currencyPipe.transform(ctx.parsed.y, this.currencyCode)}`,
                        },
                    },
                },
                scales: {
                    x: {
                        grid: {display: false},
                    },
                    y: {
                        beginAtZero: true,
                        border: {
                            dash: [5, 4],
                        }
                    },
                },
                elements: {
                    bar: {
                        borderRadius: 10,
                    },
                },
            },
        });
    }
}
