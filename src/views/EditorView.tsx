import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRouteStore } from '../store/useRouteStore';
import { WaypointPanel } from '../components/Waypoints/WaypointPanel';
import { MapView } from '../components/Map/MapView';

const MIN_VH = 20;
const MAX_VH = 85;

export default function EditorView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const openItinerary = useRouteStore((state) => state.openItinerary);
  const loadAll = useRouteStore((state) => state.loadAll);
  const currentId = useRouteStore((state) => state.currentId);
  const itineraries = useRouteStore((state) => state.itineraries);

  const sidebarRef = useRef<HTMLElement>(null);
  const dragStartY = useRef<number>(0);
  const dragStartVh = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  const handlersRef = useRef({
    mouseMove: (e: MouseEvent) => {
      if (!isDragging.current || !sidebarRef.current) return;
      const deltaY = dragStartY.current - e.clientY;
      const deltaVh = (deltaY / window.innerHeight) * 100;
      sidebarRef.current.style.height = `${Math.min(MAX_VH, Math.max(MIN_VH, dragStartVh.current + deltaVh))}vh`;
    },
    touchMove: (e: TouchEvent) => {
      e.preventDefault();
      if (!isDragging.current || !sidebarRef.current) return;
      const deltaY = dragStartY.current - e.touches[0].clientY;
      const deltaVh = (deltaY / window.innerHeight) * 100;
      sidebarRef.current.style.height = `${Math.min(MAX_VH, Math.max(MIN_VH, dragStartVh.current + deltaVh))}vh`;
    },
    end: () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handlersRef.current.mouseMove);
      document.removeEventListener('mouseup', handlersRef.current.end);
      document.removeEventListener('touchmove', handlersRef.current.touchMove);
      document.removeEventListener('touchend', handlersRef.current.end);
    },
  });

  useEffect(() => {
    const { mouseMove, touchMove, end } = handlersRef.current;
    return () => {
      document.removeEventListener('mousemove', mouseMove);
      document.removeEventListener('mouseup', end);
      document.removeEventListener('touchmove', touchMove);
      document.removeEventListener('touchend', end);
    };
  }, []);

  const startDrag = (clientY: number) => {
    if (!sidebarRef.current) return;
    const h = sidebarRef.current.getBoundingClientRect().height;
    dragStartY.current = clientY;
    dragStartVh.current = (h / window.innerHeight) * 100;
    isDragging.current = true;
    const { mouseMove, touchMove, end } = handlersRef.current;
    document.addEventListener('mousemove', mouseMove);
    document.addEventListener('mouseup', end);
    document.addEventListener('touchmove', touchMove, { passive: false });
    document.addEventListener('touchend', end);
  };

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
      <aside className="sidebar" ref={sidebarRef}>
        <div
          className="drag-handle"
          aria-hidden="true"
          onMouseDown={(e) => startDrag(e.clientY)}
          onTouchStart={(e) => startDrag(e.touches[0].clientY)}
        />
        <WaypointPanel />
      </aside>
      <main className="map-section">
        <MapView />
      </main>
    </div>
  );
}
