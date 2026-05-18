// Panneau latéral — nom du trajet, liste des waypoints, actions

import { useState } from 'react';
import { useRouteStore } from '../../store/useRouteStore';
import { useNavigate } from 'react-router-dom';
import { WaypointList } from './WaypointList';
import { RouteStats } from './RouteStats';
import { Download, Save, X, Pencil, Settings } from 'lucide-react';
import './WaypointPanel.css';

export function WaypointPanel() {
  const navigate = useNavigate();
  const routeName = useRouteStore((state) => state.routeName);
  const setRouteName = useRouteStore((state) => state.setRouteName);
  
  const routeDescription = useRouteStore((state) => state.routeDescription);
  const setRouteDescription = useRouteStore((state) => state.setRouteDescription);
  const startDate = useRouteStore((state) => state.startDate);
  const setStartDate = useRouteStore((state) => state.setStartDate);
  const endDate = useRouteStore((state) => state.endDate);
  const setEndDate = useRouteStore((state) => state.setEndDate);
  const maxParticipants = useRouteStore((state) => state.maxParticipants);
  const setMaxParticipants = useRouteStore((state) => state.setMaxParticipants);

  const generatePayload = useRouteStore((state) => state.generatePayload);
  const exitEditor = useRouteStore((state) => state.exitEditor);
  const saveCurrent = useRouteStore((state) => state.saveCurrent);

  const [isEditingName, setIsEditingName] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
            <button
              className="header-icon-btn btn-rose-outline danger"
              onClick={() => {
                exitEditor();
                navigate('/dashboard');
              }}
              title="Quitter"
            >
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

          <button className="toggle-settings-btn" onClick={() => setShowSettings(!showSettings)}>
             <Settings size={14} /> 
             {showSettings ? 'Masquer les paramètres' : 'Paramètres de l\'événement'}
          </button>

          {showSettings && (
             <div className="event-settings">
                <div className="setting-group">
                   <label>Description</label>
                   <textarea className="setting-input" value={routeDescription} onChange={e => setRouteDescription(e.target.value)} rows={2} placeholder="Description de l'événement..."></textarea>
                </div>
                <div className="settings-row">
                    <div className="setting-group">
                       <label>Début</label>
                       <input type="datetime-local" className="setting-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div className="setting-group">
                       <label>Fin</label>
                       <input type="datetime-local" className="setting-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                </div>
                <div className="setting-group">
                   <label>Participants Max</label>
                   <input type="number" min="1" className="setting-input" value={maxParticipants} onChange={e => setMaxParticipants(parseInt(e.target.value) || 0)} />
                </div>
             </div>
          )}
        </header>

        <div className="panel-content">
          {/* {!showGroups ? (
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
          )} */}

          <WaypointList />
        </div>
      </div>

      <RouteStats />
    </>
  );
}
