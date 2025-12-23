/**
 * Panneau latéral de gestion des waypoints
 * Contient le nom du trajet, la liste des waypoints, et les actions
 */

import { useState } from 'react';
import { useRouteStore } from '../../store/useRouteStore';
import { WaypointList } from './WaypointList';
import { RouteActions } from './RouteActions';
import { RouteStats } from './RouteStats';
import { Download } from 'lucide-react';
import './WaypointPanel.css';

/**
 * WaypointPanel - Panneau de gestion du trajet
 */
export function WaypointPanel() {
  const routeName = useRouteStore((state) => state.routeName);
  const setRouteName = useRouteStore((state) => state.setRouteName);
  const waypoints = useRouteStore((state) => state.waypoints);
  const generatePayload = useRouteStore((state) => state.generatePayload);

  const [isEditingName, setIsEditingName] = useState(false);

  const handleExportJSON = () => {
    const payload = generatePayload();
    const json = JSON.stringify(payload, null, 2);
    
    // Téléchargement du fichier JSON
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${routeName.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="waypoint-panel">
      {/* En-tête */}
      <header className="panel-header">
        <div className="route-name-section">
          {isEditingName ? (
            <input
              type="text"
              className="route-name-input"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsEditingName(false);
              }}
              autoFocus
            />
          ) : (
            <h1
              className="route-name"
              onClick={() => setIsEditingName(true)}
              title="Cliquer pour modifier"
            >
              {routeName}
            </h1>
          )}
          <p className="waypoint-count">
            {waypoints.length} {waypoints.length > 1 ? 'étapes' : 'étape'}
          </p>
        </div>

        <button
          className="export-button"
          onClick={handleExportJSON}
          disabled={waypoints.length === 0}
          title="Exporter en JSON"
        >
          <Download size={20} />
        </button>
      </header>

      {/* Liste des waypoints */}
      <div className="panel-content">
        {/* Statistiques du trajet */}
        <RouteStats />
        
        <WaypointList />
      </div>

      {/* Actions */}
      <footer className="panel-footer">
        <RouteActions />
      </footer>
    </div>
  );
}
