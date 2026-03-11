import { Dashboard } from './components/Dashboard/Dashboard';
import { WaypointPanel } from './components/Waypoints/WaypointPanel';
import { MapView } from './components/Map/MapView';
import Login from './views/Login';
import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route
        path="/editor"
        element={
          <div className="app-container">
            <aside className="sidebar">
              <WaypointPanel />
            </aside>
            <main className="map-section">
              <MapView />
            </main>
          </div>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
