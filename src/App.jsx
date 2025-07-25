import { useEffect, useRef, useState } from 'react';
// Make sure to adjust the path to your CSS file if it's different.
import './App.css'; 
// This import assumes you have Vite or a similar setup that can handle raw SVG imports.
// If not, you'll need to fetch or embed the SVG content differently.
import bdMapRaw from './assets/BD_Map_admin.svg?raw';

// --- Color Constants ---
const VISITED_COLOR = '#4CAF50'; // A nice green for visited places
const PLANNED_COLOR = '#FFC107'; // A warm amber for planned trips
const DEFAULT_COLOR = '#D9D9D9'; // A neutral grey for the default state

function App() {
  // Initialize state with an empty object. This ensures the map is reset on every load.
  const [districtStates, setDistrictStates] = useState({});
  // Add state to store the user's name
  const [userName, setUserName] = useState('');
  const svgContainer = useRef(null);

  useEffect(() => {
    // This effect is responsible for updating the colors and interactivity of the SVG map.
    if (!svgContainer.current) return;

    const svgDoc = svgContainer.current.querySelector('svg');
    if (!svgDoc) return;

    const paths = svgDoc.querySelectorAll('path');
    
    paths.forEach((path, idx) => {
      // Assign a stable, unique ID to each path if it doesn't have one.
      if (!path.id) {
        const districtName = path.getAttribute('name') || path.getAttribute('title') || `district-path-${idx}`;
        path.id = districtName.replace(/\s+/g, '-').toLowerCase();
      }

      // Determine the current state of the district
      const state = districtStates[path.id] || 'none';

      // Set the fill color based on the district's state
      if (state === 'visited') {
        path.setAttribute('fill', VISITED_COLOR);
      } else if (state === 'planned') {
        path.setAttribute('fill', PLANNED_COLOR);
      } else {
        path.setAttribute('fill', DEFAULT_COLOR);
      }

      // Add a click event listener to cycle through the states
      path.onclick = () => {
        setDistrictStates(prev => {
          const current = prev[path.id] || 'none';
          let next = 'visited';
          if (current === 'visited') next = 'planned';
          else if (current === 'planned') next = 'none';
          return { ...prev, [path.id]: next };
        });
      };

      // Change the cursor to a pointer to indicate the districts are clickable
      path.style.cursor = 'pointer';
    });
    // FIX: This effect now re-runs when userName changes.
  }, [districtStates, userName]);

  // Function to handle downloading the map as an SVG file
  const handleDownload = () => {
    if (!svgContainer.current) return;
    const svgElement = svgContainer.current.querySelector('svg');
    if (!svgElement) return;

    const svgClone = svgElement.cloneNode(true);
    const name = userName.trim() || 'User';
    
    // --- Get ViewBox for positioning ---
    const viewBox = svgClone.getAttribute('viewBox')?.split(' ').map(Number) || [0, 0, 1000, 1000];
    const width = viewBox[2];
    const height = viewBox[3];

    // --- Calculate visited and planned counts ---
    const counts = Object.values(districtStates).reduce((acc, state) => {
        if (state === 'visited') acc.visited++;
        if (state === 'planned') acc.planned++;
        return acc;
    }, { visited: 0, planned: 0 });

    // --- Create a text utility function for cleaner code ---
    const createSvgText = (text, x, y, size, weight, fill = '#333333') => {
        const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textElement.textContent = text;
        textElement.setAttribute('x', x);
        textElement.setAttribute('y', y);
        textElement.setAttribute('font-family', 'sans-serif');
        textElement.setAttribute('font-size', `${size}px`);
        textElement.setAttribute('font-weight', weight);
        textElement.setAttribute('fill', fill);
        return textElement;
    };

    // --- Create and style the new text elements ---
    const title = createSvgText("Bangladesh Travel Map", width / 2, 40, 32, 'bold');
    title.setAttribute('text-anchor', 'right'); // Center the title

    const userStats = createSvgText(
        `${name}'s Progress: ${counts.visited} Visited, ${counts.planned} Planned`,
        width / 2, 75, 20, 'normal'
    );
    userStats.setAttribute('text-anchor', 'right');

    const timestamp = new Date().toLocaleString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    const footer = createSvgText(
        `Generated on ${timestamp} in Chattogram, Bangladesh`,
        width / 2, height - 20, 12, 'normal', '#555555'
    );
    footer.setAttribute('text-anchor', 'middle');
    
    // --- Add new elements to the cloned SVG ---
    svgClone.appendChild(title);
    svgClone.appendChild(userStats);
    svgClone.appendChild(footer);

    // Get the full HTML content of the modified SVG clone
    const svgData = svgClone.outerHTML;
    
    // Create a "Blob" and trigger the download
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.toLowerCase().replace(/\s+/g, '-')}-bangladesh-map.svg`;
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };

  return (
    <div className="map-app" style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '20px' }}>
      <h1>Bangladesh District Visit Map</h1>
      <p>
        Click a district to toggle: 
        <span style={{ color: VISITED_COLOR, fontWeight: 'bold' }}> Visited </span> → 
        <span style={{ color: PLANNED_COLOR, fontWeight: 'bold' }}> Planned </span> → 
        <span style={{ fontWeight: 'bold' }}> None</span>
      </p>

      {/* --- Input for User's Name --- */}
      <div style={{ margin: '20px 0' }}>
        <input 
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Enter your name here"
          style={{ padding: '10px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ccc', width: '300px' }}
        />
      </div>
      
      {/* This div will hold the SVG map */}
      <div 
        ref={svgContainer} 
        dangerouslySetInnerHTML={{ __html: bdMapRaw }} 
        className="bd-map-svg"
        style={{ maxWidth: '800px', margin: '0 auto' }}
      />
      
      {/* Legend for the colors */}
      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
        <div>
          <span style={{ display: 'inline-block', width: '20px', height: '20px', backgroundColor: VISITED_COLOR, verticalAlign: 'middle', marginRight: '8px', borderRadius: '4px' }}></span>
          Visited
        </div>
        <div>
          <span style={{ display: 'inline-block', width: '20px', height: '20px', backgroundColor: PLANNED_COLOR, verticalAlign: 'middle', marginRight: '8px', borderRadius: '4px' }}></span>
          Planned
        </div>
        <div>
          <span style={{ display: 'inline-block', width: '20px', height: '20px', backgroundColor: DEFAULT_COLOR, verticalAlign: 'middle', marginRight: '8px', borderRadius: '4px', border: '1px solid #ccc' }}></span>
          Not Visited
        </div>
      </div>
      
      {/* Download button */}
      <button 
        style={{ marginTop: '24px', padding: '10px 20px', fontSize: '16px', cursor: 'pointer', borderRadius: '8px', border: 'none', backgroundColor: '#007BFF', color: 'white' }}
        onClick={handleDownload}
      >
        Download as SVG
      </button>
    </div>
  );
}

export default App;
