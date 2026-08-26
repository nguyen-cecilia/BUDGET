import {CurrencyPipe} from "@angular/common";
import {AfterViewInit, Component, ElementRef, inject, Input, OnChanges, SimpleChanges} from '@angular/core';
import {Chart} from 'chart.js';
import './chart-setup';
import {ThemeService} from '../../core/theme.service';

export interface BarChartDataset {
    label: string;
    data: number[];
    backgroundColor: string;
}

@Component({
    selector: 'app-bar-chart',
    providers: [CurrencyPipe],
    template: '<canvas #canvas class="block"></canvas>',
    host: {'class': 'block relative mx-auto w-98/100 lg:w-full min-h-80'},
})
export class BarChartComponent implements AfterViewInit, OnChanges {
    @Input() labels: string[] = [];
    @Input() datasets: BarChartDataset[] = [];
    @Input() currencyCode = '';
    @Input() monthLabels: string[] = [];
    private el = inject(ElementRef);
    private chart?: Chart;
    private currencyPipe = inject(CurrencyPipe);
    private themeService = inject(ThemeService);

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
                            color: this.themeService.isDark() ? '#e0e0e0' : '#515869',
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
                        grid: {
                            display: false,
                        },
                        ticks: {
                            color: this.themeService.isDark() ? '#a6adc8' : '#515869',
                        },
                    },
                    y: {
                        ticks: {
                            color: this.themeService.isDark() ? '#a6adc8' : '#515869',
                        },
                        beginAtZero: true,
                        border: {
                            dash: [5, 4],
                        },
                        grid: {
                            color: this.themeService.isDark() ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)',
                        },
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
