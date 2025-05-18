import React, { useState, useEffect } from 'react';
import ComboBuilderTab from './ComboBuilderTab';
import GraphTab from './GraphTab';
import { cookie_manager } from './cookie';
import { load_local_config } from './network.js';
import { DataManager } from './data_manager.js';
import './App.css';
let use_local = false;
export let ready = false;
//import './dark_light.css';
//import './left.css';

function App() {

  const reset=false;

  const [dataManager, setDataManager] = useState(null);

  function set_dark_mode(value) {
    cookie_manager.set_cookie("display_mode", value ? "DARK" : "LIGHT", 365);
  }
  function get_dark_mode() {
    let mode = cookie_manager.get_cookie("display_mode");
    if (mode !== "DARK" && mode !== "LIGHT") {
      mode = "DARK";
      set_dark_mode(true);
    }
    return mode;
  }

  function set_last_main_tab(tab_name) {
    cookie_manager.set_cookie("last_main_tab", tab_name, 365);
  }
  function get_last_main_tab() {
    let mode = cookie_manager.get_cookie("last_main_tab");
    //console.log("[get_last_main_tab]", mode);
    if (mode === null) {
      mode = 'graph';
      set_last_main_tab(mode);
    }
    return mode;
  }

  function set_use_local(value) {
    use_local = value;
  }
  function get_use_local() {
    return use_local;
  }

  const [darkMode, setDarkMode] = useState(get_dark_mode() === "DARK"); // or false for light mode
  useEffect(() => {
    if (darkMode) {
      set_dark_mode(true);
      document.body.classList.add("dark-mode");
      document.body.classList.remove("light-mode");
    } else {
      set_dark_mode(false);
      document.body.classList.add("light-mode");
      document.body.classList.remove("dark-mode");
    }
  }, [darkMode]);

  const [activeTab, setActiveTab] = useState(get_last_main_tab());
  useEffect(() => {
    set_last_main_tab(activeTab);
  }, [activeTab]);

  const tabs = [
    // { id: 'graph', label: '📈 Graphs', content: <GraphTab data={dataManager} /> },
    {
      id: 'graph',
      label: '📈 Graphs',
      content: dataManager
        ? <GraphTab dataManager={dataManager} />
        : <div>Loading chart...</div>
    },

    { id: 'combo-builder', label: '🧾 Combo Builder', content: <ComboBuilderTab /> },
    { id: 'combo-finder', label: '🔍 Combo Finder', content: <GraphTab /> },
    { id: 'parameters', label: '⚙️ Parameters', content: <GraphTab /> },
    { id: 'log', label: '🖥️ Log', content: <GraphTab /> }
  ];



  useEffect(() => {
    const loadData = async () => {
      try {
        // force reset main tab to graph
        if (reset) {
          set_last_main_tab('graph')
        }
        // force last_selected_combo
        if (reset) {
          cookie_manager.set_cookie("last_selected_combo", "LONG CALL", 365);
        }
        // force local config file to be loaded in localStorage
        if (reset) {
          let config_tmp = await load_local_config();
          localStorage.setItem('config', JSON.stringify(config_tmp));
          console.log("[loadData] force local config file to be loaded in localStorage");
        }
      } catch (err) {
        console.error('force local config file to be loaded in localStorage:', err);
      } finally {
        console.log("[loadData] local config file to be loaded in localStorage:");
      }

      let config;
      try {
        //set_use_local(await is_mode_local());
        set_use_local(true);
        console.log("get_use_local:", get_use_local());
        config = await load_local_config();
      } catch (err) {
        console.error('Failed to load config:', err);
      } finally {
        console.log("Config loaded:", config);
      }

      const instance = new DataManager(true);
      try {
        const load = async () => {
          //console.log('Loading...');
          //console.log(instance);
          await instance.setup(true); // optional if DataManager is async
          setDataManager(instance);
          //console.log('Loaded.');
        };
        load();
      } catch (err) {
        console.error('Failed to setup datamanager:', err);
      } finally {
      }

    };
    loadData();
  }, []);
/*
  useEffect(() => {
    if (dataManager) {
      console.log('[useEffect] dataManager is now ready:', dataManager);
    }
  }, [dataManager]);
*/


  return (
    <div className="top-container">
      <button
        onClick={() => setDarkMode(prev => !prev)}
        style={{
          padding: '8px 16px',
          borderRadius: '6px',
          backgroundColor: darkMode ? '#333' : '#ddd',
          color: darkMode ? '#fff' : '#000',
          border: '1px solid #999',
          cursor: 'pointer',
          marginTop: '10px'
        }}
      >
        {darkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
      </button>
      <div className="main-tabs-container">
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
      <div className="main-tab-container">
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );


}

export default App;
