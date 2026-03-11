// Liste des waypoints avec drag & drop (dnd-kit), groupée par sections

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useRouteStore } from '../../store/useRouteStore';
import { WaypointItem } from './WaypointItem';
import { MESSAGES } from '../../domain/constants';
import { formatDistance, formatDuration } from '../../services/routing.service';
import './WaypointList.css';

import iconFlower from '../../assets/icons/icon-flower.png';

// Zone droppable pour un groupe (permet de glisser un point dans un groupe vide)
function DroppableGroupZone({ groupId, children }: { groupId: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `group-zone-${groupId}`,
    data: { groupId },
  });

  return (
    <div ref={setNodeRef} className={`waypoint-list ${isOver ? 'is-over' : ''}`}>
      {children}
    </div>
  );
}

export function WaypointList() {
  const waypoints = useRouteStore((state) => state.waypoints);
  const groups = useRouteStore((state) => state.groups);
  const routeLegs = useRouteStore((state) => state.routeLegs);
  const moveWaypoint = useRouteStore((state) => state.moveWaypoint);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Drop sur un autre waypoint
    if (activeId !== overId && !overId.startsWith('group-zone-')) {
      moveWaypoint(activeId, overId);
    }
    // Drop sur une zone de groupe
    else if (overId.startsWith('group-zone-')) {
      const targetGroupId = over.data.current?.groupId;
      if (targetGroupId) {
        moveWaypoint(activeId, overId, targetGroupId);
      }
    }
  };

  if (waypoints.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-message">{MESSAGES.noWaypoints}</p>
        <div className="empty-instructions">
          <p>💡 <strong>Astuce :</strong></p>
          <ul>
            <li>Recherchez une adresse en haut à droite de la carte</li>
            <li>Ou cliquez directement sur la carte</li>
          </ul>
        </div>
      </div>
    );
  }

  // Stats par groupe (distance + durée cumulées)
  const groupStats = groups.map(group => {
    const groupWaypoints = waypoints.filter(wp => wp.groupId === group.id);
    let totalDistance = 0;
    let totalDuration = 0;

    groupWaypoints.forEach(wp => {
      const globalIndex = waypoints.findIndex(w => w.id === wp.id);
      if (globalIndex > 0 && routeLegs[globalIndex - 1]) {
        totalDistance += routeLegs[globalIndex - 1].distance;
        totalDuration += routeLegs[globalIndex - 1].duration;
      }
    });

    return {
      id: group.id,
      name: group.name,
      distance: totalDistance,
      duration: totalDuration,
      waypoints: groupWaypoints
    };
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={waypoints.map((wp) => wp.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="waypoint-list-container">
          {groupStats.map((group) => (
            <section key={group.id} className="waypoint-group-section">
              <header className="group-section-header">
                <div className="group-header-title">
                  <img src={iconFlower} alt="" className="custom-icon group-header-icon" />
                  <span className="group-section-name">{group.name}</span>
                </div>
                <div className="group-section-stats">
                  <span>{formatDistance(group.distance)}</span>
                  <span className="separator">•</span>
                  <span>{formatDuration(group.duration)}</span>
                </div>
              </header>
              <DroppableGroupZone groupId={group.id}>
                {group.waypoints.length > 0 ? (
                  group.waypoints.map((waypoint) => (
                    <WaypointItem key={waypoint.id} waypoint={waypoint} />
                  ))
                ) : (
                  <div className="empty-group-placeholder">
                    Aucun point dans ce groupe
                  </div>
                )}
              </DroppableGroupZone>
            </section>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
