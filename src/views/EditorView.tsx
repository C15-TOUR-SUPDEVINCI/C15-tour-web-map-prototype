import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRouteStore } from '../store/useRouteStore';
import { WaypointPanel } from '../components/Waypoints/WaypointPanel';
import { MapView } from '../components/Map/MapView';

export default function EditorView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const openItinerary = useRouteStore((state) => state.openItinerary);
  const loadAll = useRouteStore((state) => state.loadAll);
  const currentId = useRouteStore((state) => state.currentId);
  const itineraries = useRouteStore((state) => state.itineraries);

  useEffect(() => {
    // S'assurer que les itinéraires sont chargés
    if (itineraries.length === 0) {
      loadAll();
    }
  }, [itineraries.length, loadAll]);

  useEffect(() => {
    if (id && itineraries.length > 0) {
      const exists = itineraries.some(it => it.id === id);
      const isNew = id === currentId;
      
      if (exists || isNew) {
        if (currentId !== id) {
          openItinerary(id);
        }
      } else {
        // Rediriger si l'ID n'existe pas et n'est pas le trajet en cours de création
        navigate('/dashboard');
      }
    }
  }, [id, itineraries, currentId, openItinerary, navigate]);

  return (
    <div className="app-container">
      <aside className="sidebar">
        <WaypointPanel />
      </aside>
      <main className="map-section">
        <MapView />
      </main>
    </div>
  );
}
