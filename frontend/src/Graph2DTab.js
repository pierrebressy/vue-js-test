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

/* 
ChartJS.unregister({
     id: 'crosshair',
     beforeEvent: () => { }
 });
*/



function createMultiDraggableLabelPlugin(myLabelMap, chartRef) {
    return {
        id: 'multiDraggableLabel',
        afterDraw(chart) {
            //if (!chartRef?.current || chart.canvas !== chartRef.current) return;
            const { ctx, chartArea, scales } = chart;
            if (!chartArea || !scales?.x || !scales?.y) return;

            const fontSize = 12;
            const padding = 6;
            const fontFamily = 'Menlo, monospace';

            chart._labelBoxes = {}; // Store boxes per label
            let labelId = 0;
            myLabelMap.current.forEach(({ label, xRef }) => {
                //console.log(`🚨  ${label} → x = ${xRef.current}`);

                const xValue = xRef.current;
                const xPixel = scales.x.getPixelForValue(xValue);
                let color = 'blue';
                if (label.startsWith('leg')) {
                    color = 'green';
                } else if (label === 'underlying') {
                    color = 'red';
                } else {
                    color = 'blue';
                }
                // 🔵 Vertical line
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(xPixel, chartArea.top);
                ctx.lineTo(xPixel, chartArea.bottom);
                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
                ctx.setLineDash([]);
                ctx.stroke();
                ctx.restore();

                // 🟦 Label box
                const yPixel = chartArea.top + 10;//+ index * 30;
                const text = xValue.toFixed(1);
                ctx.save();
                ctx.font = `${fontSize}px ${fontFamily}`;
                const textWidth = ctx.measureText(text).width;
                const boxWidth = textWidth + padding * 2;
                const boxHeight = fontSize + padding;
                const boxX = xPixel - boxWidth / 2;
                const boxY = yPixel;

                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.roundRect?.(boxX, boxY, boxWidth, boxHeight, 4);
                ctx.fill();

                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(text, xPixel, boxY + boxHeight / 2);
                ctx.restore();
                chart._labelBoxes[labelId] = { x: boxX, y: boxY, width: boxWidth, height: boxHeight };
                labelId++;

            });

        }
    };
}


export default function Graph2DTab({ dataManager, days_left, mean_volatility }) {

    const chartRefPL = useRef(null);
    const chartRefGreek = useRef(null);
    const xRef1 = useRef(160);
    const xRef2 = useRef(210);
    const draggingLabel = useRef(null);
    const myLabelMap = useRef([]);
    const [renderTrigger, setRenderTrigger] = useState(0);

    const pluginDraggable = useMemo(
        () => {
            const legs = dataManager.get_combo_params().legs;

            myLabelMap.current = [];
            myLabelMap.current.push({ label: 'label1', xRef: xRef1 });
            myLabelMap.current.push({ label: 'label2', xRef: xRef2 });
            legs.forEach((_, index) => {
                myLabelMap.current.push({ label: `leg${index + 1}`, xRef: { current: legs[index].strike } });
            });

            return createMultiDraggableLabelPlugin(myLabelMap, chartRefPL)
        },
        [dataManager]
    );


    useEffect(() => {
        compute_data_to_display(dataManager, false);
    }, [days_left, mean_volatility, dataManager, renderTrigger]);

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
            for (const [labelId, box] of Object.entries(boxes)) {
                if (
                    pos.x >= box.x &&
                    pos.x <= box.x + box.width &&
                    pos.y >= box.y &&
                    pos.y <= box.y + box.height
                ) {
                    draggingLabel.current = labelId;
                    e.preventDefault();
                    break;
                }
            }
        };

        const onMouseMove = (e) => {
            if (!draggingLabel.current) return;
            const pos = getMouse(e);
            const scale = chart.scales.x;
            const xVal = scale.getValueForPixel(pos.x);

            const draggedLabel = myLabelMap.current[draggingLabel.current];
            const label = draggedLabel.label;
            if (label === 'label1') {
                xRef1.current = xVal;
            }
            else if (label === 'label2') {
                xRef2.current = xVal;
            }
            else if (label.startsWith('leg')) {
                const legIndex = parseInt(label.replace('leg', '')) - 1;
                const option = dataManager.get_combo_params().legs[legIndex];
                if (option) {
                    option.strike = xVal;
                    draggedLabel.xRef.current = xVal;
                    compute_data_to_display(dataManager, false);
                    setRenderTrigger(prev => prev + 1);
                }
            }



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
    }, []);


    if (!dataManager) return <div>Loading chart...</div>;

    dataManager.set_underlying_price(180.0);

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

        const rawData = dataManager.get_greeks_data()[greek_index]
        const yPositive = rawData.map(p => (p.y >= 0 ? p : { x: p.x, y: null }));
        const yNegative = rawData.map(p => (p.y < 0 ? p : { x: p.x, y: null }));

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
        });
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '4px' }}>
            <div style={{ flex: 6, display: 'flex' }}>
                <Line
                    //key={renderTrigger} // 🔥 Force remount
                    ref={chartRefPL}
                    data={chartPL}
                    options={chartOptionsPL}
                    //plugins={pluginDraggableMulti ? [pluginDraggableMulti] : []} // ✅ Only here
                    plugins={pluginDraggable ? [pluginDraggable] : []} // ✅ Only here
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
