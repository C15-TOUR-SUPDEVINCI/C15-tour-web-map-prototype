// Panneau latéral — nom du trajet, liste des waypoints, actions

import { useState } from 'react';
import { useRouteStore } from '../../store/useRouteStore';
import { WaypointList } from './WaypointList';
import { RouteStats } from './RouteStats';
import { GroupManager } from './GroupManager/GroupManager';
import { Download, ChevronDown, ChevronUp, Save, X, Pencil } from 'lucide-react';
import './WaypointPanel.css';

export function WaypointPanel() {
  const routeName = useRouteStore((state) => state.routeName);
  const setRouteName = useRouteStore((state) => state.setRouteName);
  const generatePayload = useRouteStore((state) => state.generatePayload);
  const exitEditor = useRouteStore((state) => state.exitEditor);
  const saveCurrent = useRouteStore((state) => state.saveCurrent);

  const [isEditingName, setIsEditingName] = useState(false);
  const [showGroups, setShowGroups] = useState(false);

  const handleExportJSON = () => {
    const payload = generatePayload();
    const json = JSON.stringify(payload, null, 2);

    // Crée un lien temporaire pour télécharger le fichier
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${routeName.replaceAll(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="waypoint-panel">
        <header className="panel-header">
          <div className="header-close-row">
            <button className="header-icon-btn btn-rose-outline danger" onClick={exitEditor} title="Quitter">
              <X size={20} />
            </button>
          </div>
          <div className="header-top-row">
            {isEditingName ? (
              <input
                type="text"
                className="route-name-input"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                autoFocus
              />
            ) : (
              <div className="route-name-container" onClick={() => setIsEditingName(true)}>
                <h2 className="route-name-display">
                  {routeName || 'Nouvel Itinéraire'}
                </h2>
                <Pencil size={16} className="edit-icon" />
              </div>
            )}

            <div className="header-actions">
              <button className="header-icon-btn btn-rose-outline" onClick={saveCurrent} title="Sauvegarder">
                <Save size={20} />
              </button>
              <button className="header-icon-btn btn-rose-outline" onClick={handleExportJSON} title="Exporter">
                <Download size={20} />
              </button>
            </div>
          </div>
        </header>

        <div className="panel-content">
          {!showGroups ? (
            <button
              className="toggle-groups-btn"
              onClick={() => setShowGroups(true)}
            >
              <ChevronDown size={18} /> Modifier les Groupes
            </button>
          ) : (
            <>
              <button
                className="toggle-groups-btn"
                onClick={() => setShowGroups(false)}
              >
                <ChevronUp size={18} /> Masquer les Groupes
              </button>
              <GroupManager />
            </>
          )}

          <WaypointList />
        </div>
      </div>

      <RouteStats />
    </>
  );
}
