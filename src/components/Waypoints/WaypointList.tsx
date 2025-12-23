/**
 * Liste des waypoints avec drag & drop pour réorganiser
 */

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
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
import './WaypointList.css';

/**
 * WaypointList - Liste ordonnée et réorganisable des waypoints
 */
export function WaypointList() {
  const waypoints = useRouteStore((state) => state.waypoints);
  const reorderWaypoints = useRouteStore((state) => state.reorderWaypoints);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = waypoints.findIndex((wp) => wp.id === active.id);
      const newIndex = waypoints.findIndex((wp) => wp.id === over.id);
      reorderWaypoints(oldIndex, newIndex);
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
        <div className="waypoint-list">
          {waypoints.map((waypoint) => (
            <WaypointItem key={waypoint.id} waypoint={waypoint} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
