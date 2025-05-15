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

export default function Graph3DTab() {

      return (
        <label className='std-text'>GRAPH 3D</label>

    );
}
