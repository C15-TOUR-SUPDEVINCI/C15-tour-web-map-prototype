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
  const serverEventId = useRouteStore((state) => state.serverEventId);
  const itinerariesLoaded = useRouteStore((state) => state.hasLoadedItineraries);
  const isOpeningItinerary = useRouteStore((state) => state.isOpeningItinerary);
  const itineraryExists = useRouteStore((state) => state.itineraries.some((it) => it.id === id));

  const sidebarRef = useRef<HTMLElement>(null);
  const dragStartY = useRef<number>(0);
  const dragStartVh = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  // Refs pour le redimensionnement horizontal (desktop)
  const dragStartX = useRef<number>(0);
  const dragStartW = useRef<number>(0);
  const isDraggingX = useRef<boolean>(false);
  // Ref vers la poignée visuelle pour synchroniser sa position pendant le drag
  const resizeHandleRef = useRef<HTMLDivElement>(null);

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

  // Handlers pour le resize horizontal
  const handlersXRef = useRef({
    mouseMove: (e: MouseEvent) => {
      if (!isDraggingX.current || !sidebarRef.current) return;
      const deltaX = e.clientX - dragStartX.current;
      const newW = Math.min(900, Math.max(320, dragStartW.current + deltaX));
      sidebarRef.current.style.width = `${newW}px`;
      sidebarRef.current.style.minWidth = 'unset';
      sidebarRef.current.style.maxWidth = 'unset';
      // Synchronise la position de la poignée avec le bord droit de la sidebar
      if (resizeHandleRef.current) {
        resizeHandleRef.current.style.left = `${newW - 9}px`;
      }
      // Centre le geocoder dans la zone carte résiduelle (desktop uniquement)
      if (window.innerWidth > 1024) {
        const geocoderParent = document.querySelector('.leaflet-top.leaflet-left') as HTMLElement | null;
        if (geocoderParent) {
          const pct = (newW / window.innerWidth) * 50 + 50;
          geocoderParent.style.left = `${pct}%`;
        }
      }
    },
    end: () => {
      isDraggingX.current = false;
      document.removeEventListener('mousemove', handlersXRef.current.mouseMove);
      document.removeEventListener('mouseup', handlersXRef.current.end);
    },
  });

  useEffect(() => {
    const { mouseMove, touchMove, end } = handlersRef.current;
    const { mouseMove: mouseMoveX, end: endX } = handlersXRef.current;
    return () => {
      document.removeEventListener('mousemove', mouseMove);
      document.removeEventListener('mouseup', end);
      document.removeEventListener('touchmove', touchMove);
      document.removeEventListener('touchend', end);
      document.removeEventListener('mousemove', mouseMoveX);
      document.removeEventListener('mouseup', endX);
    };
  }, []);

  // Initialise la position de la poignée selon la largeur réelle de la sidebar après rendu
  useEffect(() => {
    const init = () => {
      if (!sidebarRef.current || !resizeHandleRef.current) return;
      const w = sidebarRef.current.getBoundingClientRect().width;
      resizeHandleRef.current.style.left = `${w - 9}px`;
    };
    const raf = requestAnimationFrame(init);
    return () => cancelAnimationFrame(raf);
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

  const startHorizontalDrag = (clientX: number) => {
    if (!sidebarRef.current) return;
    const w = sidebarRef.current.getBoundingClientRect().width;
    dragStartX.current = clientX;
    dragStartW.current = w;
    isDraggingX.current = true;
    document.addEventListener('mousemove', handlersXRef.current.mouseMove);
    document.addEventListener('mouseup', handlersXRef.current.end);
  };

  useEffect(() => {
    if (!itinerariesLoaded) void loadAll();
  }, [itinerariesLoaded, loadAll]);

  useEffect(() => {
    if (!id || !itinerariesLoaded) return;
    if (serverEventId && currentId === serverEventId && id !== serverEventId) {
      navigate(`/editor/${serverEventId}`, { replace: true });
      return;
    }

    const isNew = id === currentId;
    if (itineraryExists || isNew) {
      if (!isNew && !isOpeningItinerary && (currentId !== id || serverEventId !== id)) {
        void openItinerary(id).catch(() => {
          navigate('/dashboard');
        });
      }
    } else {
      navigate('/dashboard');
    }
  }, [id, itineraryExists, itinerariesLoaded, currentId, serverEventId, isOpeningItinerary, openItinerary, navigate]);

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

      {/* Poignée de redimensionnement horizontal — sibling de la sidebar, pas enfant */}
      <div
        ref={resizeHandleRef}
        className="sidebar-resize-handle"
        onMouseDown={(e) => startHorizontalDrag(e.clientX)}
        aria-hidden="true"
      >
        <span className="sidebar-resize-dot" />
        <span className="sidebar-resize-dot" />
        <span className="sidebar-resize-dot" />
      </div>
      <main className="map-section">
        <MapView />
      </main>
    </div>
  );
}
