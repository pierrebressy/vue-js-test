import React, { useRef, useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import zoomPlugin from 'chartjs-plugin-zoom';
import crosshairPlugin from 'chartjs-plugin-crosshair';
import {
    Chart as ChartJS,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Filler,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

import { DataManager } from './data_manager.js';
import { combo_options, initial_legs, sigma_factors } from './consts';
import { global_data } from './App.js';

// Register Chart.js components and plugins
ChartJS.register(
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Filler,
    Title,
    Tooltip,
    Legend,
    zoomPlugin,
    crosshairPlugin
);

export default function Graph2DTab() {

    const [activeTab, setActiveTab] = useState('sin');

    const chartRef = useRef(null);

    // Regenerate data based on xMax
    const [freq, setFreq] = useState(2.0);
    const Fs = 500;
    const N = 1000;
    const tMax = N / Fs;
    const tValues = Array.from({ length: N }, (_, i) => (i * 1.0) / Fs);
    const ySin = tValues.map(t => Math.sin(2 * Math.PI * freq * t));
    const ySin15 = tValues.map(t => Math.sin(1.5 * 2 * Math.PI * freq * t));
    const yCos = tValues.map(t => Math.cos(2 * Math.PI * freq * t));
    const yCos15 = tValues.map(t => Math.cos(1.5 * 2 * Math.PI * freq * t));
    const yPositive = ySin.map(y => (y >= 0 ? y : null));
    const yNegative = ySin.map(y => (y <= 0 ? y : null));

    // Chart data
    const data = {
        labels: tValues.map(t => t.toFixed(3)),
        datasets: [
            {
                label: 'y = sin(x) (positive)',
                data: yPositive,
                borderColor: 'green',
                fill: true,
                backgroundColor: (context) => {
                    const chart = context.chart;
                    const { ctx, chartArea, scales } = chart;
                    if (!chartArea) return null;
                    const top = scales.y.getPixelForValue(1);
                    const bottom = scales.y.getPixelForValue(0);
                    const gradient = ctx.createLinearGradient(0, top, 0, bottom);
                    gradient.addColorStop(0, 'rgba(0, 200, 0, 0.4)');
                    gradient.addColorStop(1, 'rgba(0, 200, 0, 0)');
                    return gradient;
                },
                tension: 0.3,
                pointRadius: 0
            },
            {
                label: 'y = sin(x) (negative)',
                data: yNegative,
                borderColor: 'red',
                fill: true,
                backgroundColor: (context) => {
                    const chart = context.chart;
                    const { ctx, chartArea, scales } = chart;
                    if (!chartArea) return null;
                    const top = scales.y.getPixelForValue(0);
                    const bottom = scales.y.getPixelForValue(-1);
                    const gradient = ctx.createLinearGradient(0, bottom, 0, top);
                    gradient.addColorStop(0, 'rgba(255, 0, 0, 0.4)');
                    gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
                    return gradient;
                },
                tension: 0.3,
                pointRadius: 0
            },
            {
                label: 'y = sin(1.5x)',
                data: ySin15,
                borderColor: 'purple',
                borderWidth: 2,
                fill: false,
                pointRadius: 0,
                tension: 0.3
            }
        ]
    };
    const dataCos = {
        labels: tValues.map(t => t.toFixed(3)),
        datasets: [
            {
                label: 'y = cos(x)',
                data: yCos,
                borderColor: 'blue',
                borderWidth: 2,
                fill: false,
                pointRadius: 0,
                tension: 0.3
            },
            {
                label: 'y = cos(1.5x)',
                data: yCos15,
                borderColor: 'orange',
                borderWidth: 2,
                fill: false,
                pointRadius: 0,
                tension: 0.3
            }
        ]
    };

    // Chart options
    const options = {
        responsive: true,
        interaction: {
            mode: 'nearest',
            intersect: false
        },
        plugins: {
            title: {
                display: true,
                text: activeTab === 'sin' ? 'Sine Waves' : 'Cosine Waves',
                font: { size: 20 }
            },
            legend: {
                display: true,
                position: 'top'
            },
            tooltip: {
                mode: 'index',
                intersect: false
            },
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'xy',
                    modifierKey: 'ctrl'
                },
                zoom: {
                    wheel: {
                        enabled: true
                    },
                    pinch: {
                        enabled: true
                    },
                    mode: 'xy'
                },
                limits: {
                    x: {
                        min: 0,
                        max: tMax,
                    },
                    y: {
                        min: -1.2,
                        max: 1.2
                    }
                }
            },
            crosshair: {
                line: {
                    color: '#999',
                    width: 1
                },
                snap: {
                    enabled: true
                }
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 't (s)'
                },
                min: 0,
                max: 10000,
            },
            y: {
                title: {
                    display: true,
                    text: 'y'
                },
                min: -1.2,
                max: 1.2
            }
        }
    };

    const handleResetZoom = () => {
        if (chartRef.current) {
            chartRef.current.resetZoom();
        }
    };


    return (
        <div style={{ display: 'flex', height: '100%', gap: '20px', alignItems: 'stretch' }}>

            {/* Chart area fills remaining space */}
            <div style={{ flex: 1, display: 'flex' }}>
                <div style={{ flex: 1 }}>
                        <Line ref={chartRef} data={dataCos} options={options} />
                </div>
            </div>
        </div>
    );
}
