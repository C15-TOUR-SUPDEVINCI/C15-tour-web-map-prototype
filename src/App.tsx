import { useRouteStore } from './store/useRouteStore';
import { Dashboard } from './components/Dashboard/Dashboard';
import { WaypointPanel } from './components/Waypoints/WaypointPanel';
import { MapView } from './components/Map/MapView';
import './App.css';

function App() {
  const view = useRouteStore((state) => state.view);

  if (view === 'dashboard') {
    return <Dashboard />;
  }

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
