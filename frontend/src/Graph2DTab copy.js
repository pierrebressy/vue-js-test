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

import { combo_options, initial_legs, sigma_factors } from './consts';

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
    const [freq, setFreq] = useState(2.0);
    const Fs = 500;
    const N = 1000;
    const tMax = N / Fs;

    
    const [days_left, setDays_left] = useState(0);
    const num_days = 100;
    const [byLeg, setByLeg] = useState(false);
    const [computed, setComputed] = useState(false);
    const [mean_volatility, setMean_volatility] = useState(0.5);
    const [selectedCombo, setSelectedCombo] = useState("call"); // default is "call"
    const [legs, setLegs] = useState(initial_legs);
    const [sigmaIndex, setSigmaIndex] = useState(0); // start at 1
    const selectedSigma = sigma_factors[sigmaIndex];

    // Regenerate data based on xMax
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

    function local_status_info() {
        return (
            <div className="local-status-info-container">
                <label className="std-text">
                    Local Status Info
                </label>
            </div>
        );
    }
    function choose_combo({ selected, setSelected }) {
        return (
            <div className="choose-combo-container" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label className="std-text" style={{ whiteSpace: 'nowrap' }}>
                    Select combo:
                </label>
                <select
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                    style={{ flex: 1, padding: '8px' }}
                >
                    {combo_options.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            </div>
        );
    }

    function days_left_container() {
        return (
            <div className="days-left-container">
                <label className="std-text">
                    Days left: {days_left.toFixed(1)} / {num_days.toFixed(1)}
                </label>
                <input className="slider-reverse"
                    type="range"
                    min={0}
                    max={num_days}
                    step={0.5}
                    value={days_left}
                    onChange={e => setDays_left(parseFloat(e.target.value))}
                    style={{ flex: 1, padding: '8px' }}
                />
            </div>
        );
    }
    function volatility_management_container() {
        return (
            <div className="volatility-management-container">
                <label className='volatility-checkbox'>
                    <input
                        type="checkbox"
                        checked={byLeg}
                        onChange={(e) => setByLeg(e.target.checked)}
                    />
                    By leg
                </label>

                <label className='volatility-checkbox'>
                    <input
                        type="checkbox"
                        checked={computed}
                        onChange={(e) => setComputed(e.target.checked)}
                        disabled={!byLeg} // ✅ Disable if "By leg" not checked
                    />
                    Computed
                </label>
            </div>
        );
    }
    function mean_volatility_container() {
        return (
            <div className="mean-volatility-container">
                <label className="std-text">
                    Mean V: {mean_volatility.toFixed(2)}
                </label>
                <input
                    type="range"
                    min={0}
                    max={2}
                    step={0.1}
                    value={mean_volatility}
                    onChange={e => setMean_volatility(parseFloat(e.target.value))}
                    style={{ flex: 1, padding: '8px' }}
                />
            </div>
        );
    }
    function one_leg_volatility_container(index) {
        return (
            <div className="mean-volatility-container">
                <label className="std-text">
                    Leg {index + 1}: {legs[index].volatility.toFixed(2)}
                </label>
                <input
                    type="range"
                    min={0}
                    max={2}
                    step={0.1}
                    value={legs[index].volatility}
                    onChange={e => {
                        const newVol = parseFloat(e.target.value);
                        setLegs(prev =>
                            prev.map((leg, i) =>
                                i === index ? { ...leg, volatility: newVol } : leg
                            )
                        );
                    }}
                    style={{ flex: 1, padding: '8px' }}
                />
            </div>
        );
    }
    function sigma_factors_container() {
        return (
            <div className="sigma-factors-container">
                <div>
                    <label className="std-text">
                        Sigma x{selectedSigma}
                    </label>
                    <input
                        type="range"
                        min={0}
                        max={sigma_factors.length - 1}
                        step={1}
                        value={sigmaIndex}
                        onChange={(e) => setSigmaIndex(parseInt(e.target.value))}
                        style={{ width: '100%' }}
                    />
                    <datalist className="sigma-ticks" id="sigma-ticks">
                        {sigma_factors.map((value, index) => (
                            <option key={index} value={index} label={`${value}`} />
                        ))}
                    </datalist>
                </div>
            </div>
        );
    }

    function left_container() {
        return (
            <div className="left-container" style={{ flex: '0 0 20%' }}>
                {local_status_info()}
                {choose_combo({ selected: selectedCombo, setSelected: setSelectedCombo })}
                {days_left_container()}
                {volatility_management_container()}
                {byLeg
                    ? (
                        <>
                            {one_leg_volatility_container(0)}
                            {one_leg_volatility_container(1)}
                            {one_leg_volatility_container(2)}
                            {one_leg_volatility_container(3)}
                        </>
                    )
                    : mean_volatility_container()
                }
                {sigma_factors_container()}
            </div>
        );
    }


    return (
        <div style={{ display: 'flex', height: '100%', gap: '20px', alignItems: 'stretch' }}>
            {/* Left panel */}
            {left_container()}

            {/* Right panel */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Tab buttons + reset */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                        <button
                            onClick={() => setActiveTab('sin')}
                            style={{
                                padding: '8px 16px',
                                marginRight: '8px',
                                backgroundColor: activeTab === 'sin' ? '#cce5ff' : '#f5f5f5',
                                border: '1px solid #ccc',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            sin
                        </button>
                        <button
                            onClick={() => setActiveTab('cos')}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: activeTab === 'cos' ? '#cce5ff' : '#f5f5f5',
                                border: '1px solid #ccc',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            cos
                        </button>
                    </div>

                    <button
                        onClick={handleResetZoom}
                        style={{
                            padding: '8px 16px',
                            fontSize: '14px',
                            borderRadius: '6px',
                            border: '1px solid #ccc',
                            backgroundColor: '#f5f5f5',
                            cursor: 'pointer'
                        }}
                    >
                        🔄 Reset Zoom
                    </button>
                </div>

                {/* Chart area fills remaining space */}
                <div style={{ flex: 1, display: 'flex' }}>
                    <div style={{ flex: 1 }}>
                        {activeTab === 'sin' ? (
                            <Line ref={chartRef} data={data} options={options} />
                        ) : (
                            <Line ref={chartRef} data={dataCos} options={options} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
