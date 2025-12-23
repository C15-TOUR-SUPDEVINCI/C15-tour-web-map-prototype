import { MapView } from './components/Map/MapView';
import { WaypointPanel } from './components/Waypoints/WaypointPanel';
import './App.css';

function App() {
  return (
    <div className="app-container">
      {/* Panneau latéral des waypoints */}
      <aside className="sidebar">
        <WaypointPanel />
      </aside>

      {/* Carte principale */}
      <main className="map-section">
        <MapView />
      </main>
    </div>
  );
}

export default App;
