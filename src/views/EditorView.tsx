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

  const handleMove = (clientY: number) => {
    if (!isDragging.current || !sidebarRef.current) return;
    const deltaY = dragStartY.current - clientY;
    const deltaVh = (deltaY / window.innerHeight) * 100;
    const newVh = Math.min(MAX_VH, Math.max(MIN_VH, dragStartVh.current + deltaVh));
    sidebarRef.current.style.height = `${newVh}vh`;
  };

  const handleEnd = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleEnd);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleEnd);
  };

  const handleMouseMove = (e: MouseEvent) => handleMove(e.clientY);
  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    handleMove(e.touches[0].clientY);
  };

  const startDrag = (clientY: number) => {
    if (!sidebarRef.current) return;
    const h = sidebarRef.current.getBoundingClientRect().height;
    dragStartY.current = clientY;
    dragStartVh.current = (h / window.innerHeight) * 100;
    isDragging.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
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
