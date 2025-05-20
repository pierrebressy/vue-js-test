import React, { useRef, useState, useEffect } from 'react';
import * as constants from "./consts.js";
export let polygon_container = null;

export default function ComboFinderTab() {
  const containerRef = useRef(null);
  const [parentSize, setParentSize] = useState({ width: 0, height: 0 });

  function server_down() {
    return (
      <div class="server-down-msg">
        Server <a href="${constants.combo_finder_address}" target="_blank">${constants.combo_finder_address}</a> is down
      </div>
    );
  }

useEffect(() => {
  fetch(constants.combo_finder_address, { method: 'HEAD', mode: 'no-cors' })
    .then(() => {
      const container = containerRef.current;

      // Prevent duplicate insertion
      if (document.getElementById('polygon-container')) return;

      const polygon_container = document.createElement('div');
      polygon_container.classList.add('polygon-container');
      polygon_container.id = 'polygon-container';

      polygon_container.innerHTML = ``;

      const iframe = document.createElement('iframe');
      iframe.classList.add('polygon-iframe');
      iframe.src = constants.combo_finder_address;
      polygon_container.appendChild(iframe);

      container.appendChild(polygon_container);
    })
    .catch(() => {
      const existing = document.getElementById('polygon-container');
      if (existing) return;

      const polygon_container = document.createElement('div');
      polygon_container.classList.add('polygon-container');
      polygon_container.id = 'polygon-container';

      polygon_container.innerHTML = `
        <div class="server-down-msg">
          The Server <a href="${constants.combo_finder_address}" target="_blank">${constants.combo_finder_address}</a> is down
        </div>
      `;

      const container = containerRef.current;
      container.appendChild(polygon_container);
    });
}, []);




  return (
    <div ref={containerRef} className="combo-finder-container">
    </div>
  );
}
