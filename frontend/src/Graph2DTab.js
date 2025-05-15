import React, { useRef, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
//import zoomPlugin from 'chartjs-plugin-zoom';
//import crosshairPlugin from 'chartjs-plugin-crosshair';
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

//import { combo_options, initial_legs, sigma_factors } from './consts';

import { compute_data_to_display } from './computation.js';
/*
const labelPlugin = {
    id: 'customLabel',
    afterDraw(chart) {
        const { ctx, chartArea, scales } = chart;
        if (!chartArea || !scales?.x || !scales?.y) return;

        const xValue = 190;
        const xPixel = scales.x.getPixelForValue(xValue);
        const yPixel = chartArea.top + 10; // un peu en dessous du top

        const label = xValue.toString();
        const padding = 6;
        const fontSize = 12;
        const fontFamily = 'Menlo, monospace';

        ctx.save();
        ctx.font = `${fontSize}px ${fontFamily}`;
        const textWidth = ctx.measureText(label).width;

        const boxWidth = textWidth + padding * 2;
        const boxHeight = fontSize + padding;

        const boxX = xPixel - boxWidth / 2;
        const boxY = yPixel;

        // Rectangle bleu arrondi
        ctx.fillStyle = 'blue';
        ctx.strokeStyle = 'blue';
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 4);
        ctx.fill();

        // Texte blanc centré
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, xPixel, boxY + boxHeight / 2);

        ctx.restore();
    }
};
*/
/*
function createDraggableLabelPlugin(xRef, chartRef) {
    return {
        id: 'draggableLabel',
        afterDraw(chart) {
            if (!chartRef?.current || chart.canvas !== chartRef.current) return;
            const { ctx, chartArea, scales } = chart;
            if (!chartArea || !scales?.x || !scales?.y) return;

            const xValue = xRef.current;
            const xPixel = scales.x.getPixelForValue(xValue);
            const yPixel = chartArea.top + 10;

            const label = xValue.toFixed(1);
            const fontSize = 12;
            const padding = 6;
            const fontFamily = 'Menlo, monospace';

            ctx.save();
            ctx.font = `${fontSize}px ${fontFamily}`;
            const textWidth = ctx.measureText(label).width;
            const boxWidth = textWidth + padding * 2;
            const boxHeight = fontSize + padding;
            const boxX = xPixel - boxWidth / 2;
            const boxY = yPixel;

            ctx.fillStyle = 'blue';
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 4);
            } else {
                ctx.rect(boxX, boxY, boxWidth, boxHeight);
            }
            ctx.fill();

            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, xPixel, boxY + boxHeight / 2);
            ctx.restore();

            chart._labelBox = { x: boxX, y: boxY, width: boxWidth, height: boxHeight };
        }
    };
}
*/
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





export default function Graph2DTab({ dataManager, days_left, mean_volatility }) {

    const chartRefPL = useRef(null);
    const chartRefGreek = useRef(null);
    const xRef = useRef(200);         // 🔁 x position du label
    //const draggingRef = useRef(false);

    //const [size, setSize] = useState({ width: 0, height: 0 });


    useEffect(() => {
        if (dataManager) {
            console.log('[Graph2DTab] DataManager is ready:', dataManager);
            // Build chart here
        }
    }, [dataManager]);

    /*
    useEffect(() => {
        const element = chartContainerRef.current;
        if (!element) return;

        const observer = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                setSize({ width: Math.round(width), height: Math.round(height) });
            }
        });

        observer.observe(element);

        return () => observer.disconnect();
    }, []);
*/
    useEffect(() => {
        compute_data_to_display(dataManager, false);
    }, [days_left, mean_volatility, dataManager]);
/*
    useEffect(() => {
        const plugin = createDraggableLabelPlugin(xRef, draggingRef);
        ChartJS.register(plugin);

        return () => ChartJS.unregister(plugin);
    }, []);
*/
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
            const box = chart._labelBox;
            if (!box) return;
            if (
                pos.x >= box.x && pos.x <= box.x + box.width &&
                pos.y >= box.y && pos.y <= box.y + box.height
            ) {
                canvas.dataset.dragging = 'true';
            }
        };

        const onMouseMove = (e) => {
            if (canvas.dataset.dragging !== 'true') return;
            const pos = getMouse(e);
            const scale = chart.scales.x;
            xRef.current = scale.getValueForPixel(pos.x);
            chart.update('none');
        };

        const onMouseUp = () => {
            canvas.dataset.dragging = 'false';
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
    //    console.log('Resized:', size);
    //    console.log('[Graph2DTab] ', dataManager.get_active_combo_name());

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

/*
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            x: { type: 'linear', min: 150, max: 250 },
            y: { min: -4000, max: 1300 }
        }
    };
*/


    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '4px' }}>
            <div style={{ flex: 6, display: 'flex' }}>
                <Line ref={chartRefPL} data={chartPL} options={chartOptionsPL} />
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
