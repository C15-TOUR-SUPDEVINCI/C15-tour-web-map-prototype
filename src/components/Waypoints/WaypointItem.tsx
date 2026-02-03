/**
 * Item individuel de waypoint avec drag & drop
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, MapPin, Flag, Coffee, Navigation } from 'lucide-react';
import { useRouteStore } from '../../store/useRouteStore';
import type { Waypoint, TypeOfPoint } from '../../domain/waypoint.types';
import './WaypointItem.css';

/**
 * Props du composant WaypointItem
 */
interface WaypointItemProps {
  waypoint: Waypoint;
}

const getTypeIcon = (type: TypeOfPoint) => {
  switch (type) {
    case 'EXTREMITY':
      return <Flag size={16} />;
    case 'PAUSE':
      return <Coffee size={16} />;
    case 'PASSAGE':
    case 'USER':
    default:
      return <Navigation size={16} />;
  }
};
 
const getTypeLabel = (type: TypeOfPoint) => {
  switch (type) {
    case 'EXTREMITY':
      return 'Extrémité';
    case 'PAUSE':
      return 'Pause';
    case 'PASSAGE':
      return 'Passage';
    case 'USER':
      return 'Utilisateur';
    default:
      return type;
  }
};

/**
 * WaypointItem - Item individuel draggable
 */
export function WaypointItem({ waypoint }: WaypointItemProps) {
  const removeWaypoint = useRouteStore((state) => state.removeWaypoint);
  const TypeIcon = getTypeIcon(waypoint.type);
  const typeLabel = getTypeLabel(waypoint.type);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: waypoint.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`waypoint-item ${isDragging ? 'dragging' : ''}`}
    >
      {/* Handle de drag */}
      <button
        className="drag-handle"
        {...attributes}
        {...listeners}
        aria-label="Réorganiser"
      >
        <GripVertical size={18} />
      </button>

      {/* Numéro d'ordre */}
      <div className="waypoint-order">
        <MapPin size={16} />
        <span>{waypoint.order}</span>
      </div>

      {/* Informations */}
      <div className="waypoint-info">
        <p className="waypoint-label">{waypoint.label}</p>

        <p className="waypoint-type">
          {TypeIcon}
          <span>{typeLabel}</span>
        </p>
        <p className="waypoint-coords">
          {waypoint.lat.toFixed(5)}, {waypoint.lng.toFixed(5)}
        </p>
      </div>

      {/* Bouton supprimer */}
      <button
        className="delete-button"
        onClick={() => removeWaypoint(waypoint.id)}
        aria-label="Supprimer"
      >
        <X size={18} />
      </button>
    </div>
  );
}
