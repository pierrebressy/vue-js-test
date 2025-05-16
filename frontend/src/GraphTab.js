import React, { useState, useEffect, useMemo } from 'react';
import { cookie_manager } from './cookie';

import Graph2DTab from './Graph2DTab';
import Graph3DTab from './Graph3DTab';

import { combo_options, initial_legs, sigma_factors } from './consts';

export default function GraphTab({ dataManager }) {

    function set_last_graph_tab(tab_name) {
        cookie_manager.set_cookie("graph_main_tab", tab_name, 365);
    }
    function get_last_graph_tab() {
        let mode = cookie_manager.get_cookie("graph_main_tab");
        //console.log("[get_last_graph_tab]", mode);
        if (mode === null) {
            mode = 'graph2d';
            set_last_graph_tab(mode);
        }
        return mode;
    }

    const [days_left, setDays_left] = useState(dataManager.get_time_for_simulation_of_active_combo());
    const [num_days, setNumDays] = useState(dataManager.get_time_to_expiry_of_active_combo())
    const [byLeg, setByLeg] = useState(false);
    const [computed, setComputed] = useState(false);
    const [mean_volatility, setMean_volatility] = useState(0.2);
    const [selectedCombo, setSelectedCombo] = useState("call"); // default is "call"
    const [legs, setLegs] = useState(initial_legs);
    const [sigmaIndex, setSigmaIndex] = useState(0); // start at 1
    const selectedSigma = sigma_factors[sigmaIndex];



    const [activeTab, setActiveTab] = useState(get_last_graph_tab());
    useEffect(() => {
        set_last_graph_tab(activeTab);
    }, [activeTab]);

    const tabs = useMemo(() => [
        {
            id: 'graph2d',
            label: '📈 P/L & Greeks Graphs',
            content: dataManager
                ? <Graph2DTab dataManager={dataManager}   />
                : <div>[GraphTab] Loading chart...</div>
        },
        {
            id: 'graph3d',
            label: '📈 3D Graphs',
            content: <Graph3DTab />
        }
    ], [dataManager, days_left, mean_volatility]);






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
                    step={0.1}
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
                    step={0.01}
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
    function right_container() {
        return (
            <div className="right-container">
                <div className="graphs-tab-container">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="graph-tab-container">
                    {tabs.find(tab => tab.id === activeTab)?.content}
                </div>
            </div>
        );
    }


    useEffect(() => {
        if (dataManager) {
            console.log('[GraphTab] DataManager is ready');
            // process data or rebuild chart here
        }
    }, [dataManager]);

    useEffect(() => {
        //console.log('[GraphTab] days_left=',days_left);
        dataManager.set_time_for_simulation_of_active_combo(parseFloat(days_left));
        dataManager.set_mean_volatility_of_combo(dataManager.get_use_real_values(), parseFloat(mean_volatility));
    }, [days_left, mean_volatility,dataManager]);



//    days_left
    if (!dataManager) return <div>[GraphTab] Loading chart...</div>;




    return (
        <div style={{ display: 'flex', height: '100%', gap: '20px', alignItems: 'stretch' }}>
            {left_container()}
            {right_container()}
        </div>
    );
}
