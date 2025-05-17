import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
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

import { compute_data_to_display } from './computation.js';

// Register Chart.js components and plugins
ChartJS.register(
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Filler,
    Title,
    Tooltip,
    Legend);

function findZeroCrossings(data) {
    const zeros = [];
    for (let i = 1; i < data.length; i++) {
        const prev = data[i - 1].y;
        const curr = data[i].y;
        if ((prev < 0 && curr >= 0) || (prev > 0 && curr <= 0)) {
            //console.log("  i", i);
            // Linear interpolation for better accuracy
            const x0 = data[i - 1].x;
            const x1 = data[i].x;
            const y0 = prev;
            const y1 = curr;
            const xZero = x0 - y0 * (x1 - x0) / (y1 - y0);
            zeros.push(xZero);
            //console.log("  xZero", xZero);
        }
    }
    return zeros;
}

function createLegLinesPlugin(dataManager, labelRefs, zc) {
    //console.log("[createLegLinesPlugin] labelRefs=", labelRefs);
    return {
        id: 'legLines',
        afterDraw(chart) {
            const { ctx, chartArea, scales } = chart;
            if (!chartArea || !scales?.x || !scales?.y) return;

            const fontSize = 12;
            const padding = 6;
            const fontFamily = 'Menlo, monospace';
            chart._labelBoxes = {};

            // ➕ Orange 0-crossing lines
            zc.forEach((xValue, idx) => {
                const xPixel = scales.x.getPixelForValue(xValue);
                const label = `${xValue.toFixed(1)}`;

                ctx.save();
                ctx.beginPath();
                ctx.moveTo(xPixel, chartArea.top);
                ctx.lineTo(xPixel, chartArea.bottom);
                ctx.strokeStyle = 'orange';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.restore();

                ctx.save();
                ctx.font = `${fontSize}px ${fontFamily}`;
                const textWidth = ctx.measureText(label).width;
                const boxWidth = textWidth + padding * 2;
                const boxHeight = fontSize + padding;
                const boxX = xPixel - boxWidth / 2;
                const boxY = chartArea.bottom - 25;

                ctx.fillStyle = 'orange';
                ctx.beginPath();
                ctx.roundRect?.(boxX, boxY, boxWidth, boxHeight, 4);
                ctx.fill();

                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(label, xPixel, boxY + boxHeight / 2);
                ctx.restore();
            });





            labelRefs.current.forEach((ref, i) => {
                const xValue = ref.current;
                const xPixel = scales.x.getPixelForValue(xValue);


                // Determine color and label
                let color = 'blue';
                let labelText = `${xValue.toFixed(1)}`;
                let boxY = chartArea.bottom - 50;

                if (i < dataManager.get_combo_params().legs.length) {
                    const leg = dataManager.get_combo_params().legs[i];
                    color = leg.type === 'put' ? 'green' : 'red';
                    const type = leg.type === 'put' ? 'P' : 'C';
                    labelText = `${leg.qty} ${type} ${xValue.toFixed(1)}`;
                    boxY = chartArea.top - 10;
                }

                // Draw line
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(xPixel, chartArea.top);
                ctx.lineTo(xPixel, chartArea.bottom);
                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.restore();

                // Draw label
                ctx.save();
                ctx.font = `${fontSize}px ${fontFamily}`;
                const textWidth = ctx.measureText(labelText).width;
                const boxWidth = textWidth + padding * 2;
                const boxHeight = fontSize + padding;
                const boxX = xPixel - boxWidth / 2;

                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.roundRect?.(boxX, boxY, boxWidth, boxHeight, 4);
                ctx.fill();

                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(labelText, xPixel, boxY + boxHeight / 2);
                ctx.restore();

                chart._labelBoxes[i] = { x: boxX, y: boxY, width: boxWidth, height: boxHeight };
            });
        }
    };
}

export default function Graph2DTab({ dataManager, days_left, mean_volatility }) {

    const chartRefPL = useRef(null);
    const chartRefGreek = useRef(null);

    const labelRefs = useRef([]);
    const draggingLabel = useRef(null);

    const [renderTrigger, setRenderTrigger] = useState(0);

    const zeroCrossings = useRef([]);
    const [chartPL2, setChartPL2] = useState({});

    const createPLOptions = (groupId) => ({
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
            x: {
                type: 'linear',
                min: 150,
                max: 230,
                title: {
                    display: false,
                    text: 'x'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'y'
                }
            }
        },
        plugins: {
            legend: {
                display: false // 🔥 hide "y vs x" box
            },
            tooltip: {
                enabled: false, // 🔥 disables the tooltip box
                mode: 'index',
                intersect: false
            },

        }
    });
    const createGreeksOptions = (groupId) => ({
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
            x: {
                type: 'linear',
                min: 150,
                max: 230,
                title: {
                    display: false,
                    //text: 'x'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'QQQ'
                }
            }
        },
        plugins: {
            legend: {
                display: false // 🔥 hide "y vs x" box
            },
            tooltip: {
                enabled: false, // 🔥 disables the tooltip box
                mode: 'index',
                intersect: false
            },
        }
    });

    useEffect(() => {
        const chart = chartRefPL.current;
        if (!chart) return;
        const canvas = chart.canvas;

        const getMouse = (e) => {
            const rect = canvas.getBoundingClientRect();
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };

        const onMouseDown = (e) => {
            const pos = getMouse(e);
            const boxes = chart._labelBoxes || {};
            //console.log("[onMouseDown] boxes=", boxes);
            for (const [index, box] of Object.entries(boxes)) {
                if (
                    pos.x >= box.x &&
                    pos.x <= box.x + box.width &&
                    pos.y >= box.y &&
                    pos.y <= box.y + box.height
                ) {
                    draggingLabel.current = parseInt(index);
                    e.preventDefault();
                    break;
                }
            }
        };

        const onMouseMove = (e) => {
            if (draggingLabel.current == null) return;
            const pos = getMouse(e);
            const scale = chart.scales.x;
            const xVal = scale.getValueForPixel(pos.x);

            const legIndex = draggingLabel.current;
            labelRefs.current[legIndex].current = xVal;

            //console.log("[onMouseMove] labelRefs.current[legIndex].current=", labelRefs.current[legIndex]);
            //            labelRefs.current[draggingLabel.current].current = xVal;

            //if (draggingLabel.current < dataManager.get_combo_params().legs.length) {
            if (labelRefs.current[legIndex].id === "leg") {
                // 🔁 Update strike in dataManager
                dataManager.get_combo_params().legs[draggingLabel.current].strike = xVal;
            }
            else if (labelRefs.current[legIndex].id === "underlying") {
                dataManager.set_underlying_price(xVal); // underlying
            }

            // ✅ Trigger recomputation if needed
            compute_data_to_display(dataManager, false);
            zeroCrossings.current = findZeroCrossings(dataManager.get_pl_at_sim_data());
            //console.log("[onMouseMove] zeroCrossings=", zeroCrossings.current[0]);
            setRenderTrigger(t => t + 1);

            chart.update('none');
            e.preventDefault();
        };

        const onMouseUp = () => {
            draggingLabel.current = null;
        };

        canvas.addEventListener('mousedown', onMouseDown);
        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('mouseup', onMouseUp);

        return () => {
            canvas.removeEventListener('mousedown', onMouseDown);
            canvas.removeEventListener('mousemove', onMouseMove);
            canvas.removeEventListener('mouseup', onMouseUp);
        };
    }, [dataManager]);


    useEffect(() => {
        if (!dataManager) return;

        // Recalcule toutes les données
        compute_data_to_display(dataManager, false);

        const legs = dataManager.get_combo_params().legs;
        labelRefs.current = [
            ...legs.map(leg => ({ current: leg.strike, id: "leg" })),
            { current: dataManager.get_underlying_price(), id: "underlying" } // ➕ add underlying
        ];

        // Met à jour les zéro-crossings
        zeroCrossings.current = findZeroCrossings(dataManager.get_pl_at_sim_data());
        setChartPL2(chartPL);
        console.log("[GraphTab] chartPL2=", chartPL2);

        // Déclenche un re-render pour que le plugin soit recréé
        setRenderTrigger(t => t + 1);
    }, [dataManager, days_left, mean_volatility]);



    compute_data_to_display(dataManager, false);
    const rawData = dataManager.get_pl_at_sim_data(); // [{x, y}]
    const yPositive = rawData.map(p => (p.y >= 0 ? p : { x: p.x, y: null }));
    const yNegative = rawData.map(p => (p.y < 0 ? p : { x: p.x, y: null }));
    const chartPL = {
        datasets: [
            {
                label: 'y vs x',
                data: dataManager.get_pl_at_exp_data(),
                borderColor: 'black',
                fill: false,
                tension: 0.1,
                pointRadius: 0,
            },
            {
                label: 'y vs x',
                data: dataManager.get_pl_at_init_data(),
                borderColor: 'orange',
                fill: false,
                tension: 0.1,
                pointRadius: 0,
            },
            {
                label: 'y vs x',
                data: dataManager.get_pl_at_sim_data(),
                borderColor: 'green',
                fill: false,
                tension: 0.1,
                pointRadius: 0,
            },
            {
                label: 'Positive',
                data: yPositive,
                borderColor: 'green',
                fill: true,
                backgroundColor: (context) => {
                    const chart = context.chart;
                    const { ctx, chartArea, scales } = chart; // ✅ ctx ici est le bon contexte canvas
                    if (!chartArea) return null;

                    const top = scales.y.getPixelForValue(scales.y.max);
                    const bottom = scales.y.getPixelForValue(0);
                    const gradient = ctx.createLinearGradient(0, top, 0, bottom); // ✅ OK ici

                    gradient.addColorStop(0, 'rgba(0, 200, 0, 0.6)');
                    gradient.addColorStop(1, 'rgba(0, 200, 0, 0)');
                    return gradient;
                },
                spanGaps: true,
                pointRadius: 0,
                tension: 0.3
            },
            {
                label: 'Negative',
                data: yNegative,
                borderColor: 'red',
                fill: true,
                backgroundColor: (context) => {
                    const chart = context.chart;
                    const { ctx, chartArea, scales } = chart; // ✅ ctx ici est le bon contexte canvas
                    if (!chartArea) return null;

                    const top = scales.y.getPixelForValue(0);
                    const bottom = scales.y.getPixelForValue(scales.y.min);
                    const gradient = ctx.createLinearGradient(0, top, 0, bottom); // ✅ OK ici

                    gradient.addColorStop(1, 'rgba(200,0,0,0.6)');
                    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
                    return gradient;
                }, spanGaps: true,
                pointRadius: 0,
                tension: 0.3
            }

        ]
    };
    const chartOptionsPL = createPLOptions(1);

    const chartGreeks = [];
    let chartOptionsGreeks = []
    const chartGreeksIndexes = []
    let i = 0;
    for (i in dataManager.graph_params.greeks.ids) {
        let greek_index = dataManager.graph_params.greeks.ids[i];
        chartGreeksIndexes.push(i);
        let chart_option = createGreeksOptions(1);
        chart_option.scales.y.title.text = dataManager.graph_params.greeks.labels[greek_index];
        chartOptionsGreeks.push(chart_option);


        chartGreeks.push({
            datasets: [
                {
                    label: 'y vs x',
                    data: dataManager.get_greeks_data()[greek_index],
                    borderColor: 'green',
                    fill: false,
                    tension: 0.1,
                    pointRadius: 0,
                },

            ]
        });
    }

    useEffect(() => {
        if (!chartRefPL.current) return;

        const chart = chartRefPL.current;
        const plugin = createLegLinesPlugin(dataManager, labelRefs, zeroCrossings.current);
        const existingIndex = chart.config.plugins.findIndex(p => p.id === 'legLines');
        if (existingIndex !== -1) {
            chart.config.plugins.splice(existingIndex, 1);
        }
        chart.config.plugins.push(plugin);
        chart.update();
    }, [ renderTrigger]);


    
    if (!dataManager) return <div>Loading chart...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '4px' }}>
            <div style={{ flex: 6, display: 'flex' }}>
                <Line
                    ref={chartRefPL}
                    data={chartPL}
                    options={chartOptionsPL}
                />
            </div>
            {chartGreeksIndexes.map(i => (
                <div key={i} style={{ flex: 1, display: 'flex' }}>

                    <div style={{ height: '100px', width: '100%' }}>
                        <Line ref={chartRefGreek} data={chartGreeks[i]} options={chartOptionsGreeks[i]} />
                    </div>
                </div>
            ))}
        </div>
    );
}
