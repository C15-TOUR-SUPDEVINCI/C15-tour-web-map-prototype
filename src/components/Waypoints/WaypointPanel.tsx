// Panneau latéral — nom du trajet, liste des waypoints, actions

import { useCallback, useEffect, useState } from 'react';
import { useRouteStore } from '../../store/useRouteStore';
import { useNavigate } from 'react-router-dom';
import { WaypointList } from './WaypointList';
import { RouteStats } from './RouteStats';
import { AlertCircle, Cloud, Download, Loader2, X, Pencil, MapPin, CalendarDays } from 'lucide-react';
import './WaypointPanel.css';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Erreur inconnue';

export function WaypointPanel() {
  const navigate = useNavigate();
  const currentId = useRouteStore((state) => state.currentId);
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
  const waypoints = useRouteStore((state) => state.waypoints);
  const groups = useRouteStore((state) => state.groups);
  const isDirty = useRouteStore((state) => state.isDirty);
  const isSaving = useRouteStore((state) => state.isSaving);
  const saveError = useRouteStore((state) => state.saveError);
  const saveToServer = useRouteStore((state) => state.saveToServer);

  const generatePayload = useRouteStore((state) => state.generatePayload);
  const exitEditor = useRouteStore((state) => state.exitEditor);

  const [isEditingName, setIsEditingName] = useState(false);
  const [activeTab, setActiveTab] = useState<'route' | 'event'>('route');

  const runAutoSave = useCallback(() => {
    void saveToServer().catch((error) => {
      console.error('Auto-save failed', error);
    });
  }, [saveToServer]);

  useEffect(() => {
    if (!currentId || !isDirty) return;

    const timer = window.setTimeout(runAutoSave, 2000);

    return () => window.clearTimeout(timer);
  }, [
    currentId,
    groups,
    isDirty,
    maxParticipants,
    routeDescription,
    routeName,
    runAutoSave,
    startDate,
    endDate,
    waypoints,
  ]);

  useEffect(() => {
    return () => {
      const state = useRouteStore.getState();
      if (!state.currentId || !state.isDirty) return;

      void state.saveToServer().catch((error) => {
        console.error('Auto-save flush failed', error);
      });
    };
  }, []);

  useEffect(() => {
    if (!currentId || !isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentId, isDirty]);

  const handleExit = () => {
    void (async () => {
      try {
        await exitEditor();
        navigate('/dashboard');
      } catch (error: unknown) {
        alert(`Erreur sauvegarde : ${getErrorMessage(error)}`);
      }
    })();
  };

  const handleExportJSON = () => {
    const payload = generatePayload();
    const json = JSON.stringify(payload, null, 2);

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
          <div className="header-top-row">
            <button
              className="header-icon-btn btn-rose-outline danger"
              onClick={handleExit}
              title="Quitter"
            >
              <X size={20} />
            </button>

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
              <div
                className={`autosave-status${isSaving ? ' is-saving' : ''}${saveError ? ' is-error' : ''}${isDirty ? ' is-dirty' : ''}`}
                title={saveError || (isSaving ? 'Sauvegarde en cours' : isDirty ? 'Sauvegarde en attente' : 'Sauvegarde a jour')}
                aria-live="polite"
              >
                {saveError ? (
                  <AlertCircle size={15} />
                ) : isSaving ? (
                  <Loader2 size={15} className="spin" />
                ) : (
                  <Cloud size={15} />
                )}
                <span>
                  {saveError ? 'Erreur' : isSaving ? 'Sauvegarde...' : isDirty ? 'En attente' : 'Sauvegarde'}
                </span>
              </div>
              <button
                className="header-icon-btn btn-rose-outline"
                onClick={handleExportJSON}
                title="Exporter en JSON"
              >
                <Download size={20} />
              </button>
            </div>
          </div>

          {/* ── Navigation par onglets ── */}
          <div className="panel-tabs" role="tablist">
            <button
              className={`panel-tab${activeTab === 'route' ? ' active' : ''}`}
              onClick={() => setActiveTab('route')}
              role="tab"
              aria-selected={activeTab === 'route'}
              id="tab-route"
            >
              <MapPin size={13} />
              Trajet
            </button>
            <button
              className={`panel-tab${activeTab === 'event' ? ' active' : ''}`}
              onClick={() => setActiveTab('event')}
              role="tab"
              aria-selected={activeTab === 'event'}
              id="tab-event"
            >
              <CalendarDays size={13} />
              Événement
            </button>
          </div>
        </header>

        <div className="panel-content">
          {activeTab === 'route' ? (
            <WaypointList />
          ) : (
            /* ── Formulaire paramètres de l'événement ── */
            <div className="event-settings-tab">
              <div className="setting-group">
                <label htmlFor="event-description">Description</label>
                <textarea
                  id="event-description"
                  className="setting-input"
                  value={routeDescription}
                  onChange={e => setRouteDescription(e.target.value)}
                  rows={3}
                  placeholder="Description de l'événement..."
                />
              </div>

              <div className="settings-row">
                <div className="setting-group">
                  <label htmlFor="event-start">Début</label>
                  <input
                    id="event-start"
                    type="datetime-local"
                    className="setting-input"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </div>
                <div className="setting-group">
                  <label htmlFor="event-end">Fin</label>
                  <input
                    id="event-end"
                    type="datetime-local"
                    className="setting-input"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="setting-group">
                <label htmlFor="event-participants">Participants Max</label>
                <input
                  id="event-participants"
                  type="number"
                  min="1"
                  className="setting-input"
                  value={maxParticipants}
                  onChange={e => setMaxParticipants(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <RouteStats />
    </>
  );
}
