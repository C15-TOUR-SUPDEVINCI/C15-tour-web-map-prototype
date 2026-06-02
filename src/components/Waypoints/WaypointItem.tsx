import { useState } from 'react';
import { GripVertical, X, Edit2, Check } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRouteStore } from '../../store/useRouteStore';
import type { Waypoint } from '../../domain/waypoint.types';
import './WaypointItem.css';

import iconFlagStart from '../../assets/icons/icon-flag-start.png';
import iconFlagEnd from '../../assets/icons/icon-flag-end.png';
import iconTruck from '../../assets/icons/icon-truck.png';

interface WaypointItemProps {
  readonly waypoint: Waypoint;
}

// Choix de l'icône selon la position dans le trajet
const getTypeIcon = (order: number, total: number) => {
  if (order === 1) {
    return <img src={iconFlagStart} alt="Départ" className="custom-icon" />;
  }
  if (order === total) {
    return <img src={iconFlagEnd} alt="Arrivée" className="custom-icon" />;
  }
  return <img src={iconTruck} alt="Point de passage" className="custom-icon" />;
};

// Un waypoint dans la liste, draggable avec dnd-kit
export function WaypointItem({ waypoint }: WaypointItemProps) {
  const removeWaypoint = useRouteStore((state) => state.removeWaypoint);
  const updateWaypointLabel = useRouteStore((state) => state.updateWaypointLabel);
  const waypoints = useRouteStore((state) => state.waypoints);
  const focusCoordinate = useRouteStore((state) => state.focusCoordinate);

  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState('');

  const handleStartEdit = () => {
    setEditLabel(waypoint.isCustomName ? waypoint.label : '');
    setIsEditing(true);
  };

  const handleFocus = () => {
    if (isEditing) return;
    focusCoordinate([waypoint.lat, waypoint.lng]);
  };

  const isFirst = waypoint.order === 1;
  const isLast = waypoint.order === waypoints.length;

  let displayTitle = '';
  if (waypoint.isCustomName) {
    displayTitle = waypoint.label;
  } else if (isFirst) {
    displayTitle = 'DÉPART';
  } else if (isLast) {
    displayTitle = 'ARRIVÉE';
  } else {
    displayTitle = `Étape ${waypoint.order}`;
  }

  const handleSaveLabel = () => {
    updateWaypointLabel(waypoint.id, editLabel);
    setIsEditing(false);
  };

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
  const totalWaypoints = waypoints.length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`waypoint-item ${isDragging ? "dragging" : ""} ${isFirst || isLast ? "extremity" : ""}`}
    >
      <div className="waypoint-main-row">
        {/* Poignée de drag — placée à gauche pour correspondre à la convention UX */}
        <button
          className="waypoint-drag-btn"
          {...attributes}
          {...listeners}
          aria-label="Réorganiser"
        >
          <GripVertical size={16} />
        </button>

        <div
          className="waypoint-icon-container"
          onClick={handleFocus}
          style={{ cursor: 'pointer' }}
          title="Cliquer pour centrer sur la carte"
        >
          {getTypeIcon(waypoint.order, totalWaypoints)}
          <span className="waypoint-order-badge">
            {waypoint.order}
          </span>
        </div>

        <div
          className="waypoint-content"
          onClick={handleFocus}
          style={{ cursor: 'pointer' }}
          title="Cliquer pour centrer sur la carte"
        >
          <div className="waypoint-title-container">
            {isEditing ? (
              <input
                type="text"
                className="waypoint-title-input"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onBlur={handleSaveLabel}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveLabel()}
                autoFocus
              />
            ) : (
              <h3 className="waypoint-title">{displayTitle}</h3>
            )}
          </div>

          <div className="waypoint-info">
            <div className="waypoint-address">{waypoint.address || waypoint.label}</div>
          </div>
        </div>

        <div className="waypoint-right">
          {!isFirst && !isLast && (
            <button
              className="item-action-btn btn-rose-outline"
              onClick={() => isEditing ? handleSaveLabel() : handleStartEdit()}
              aria-label="Modifier le nom"
            >
              {isEditing ? <Check size={16} /> : <Edit2 size={16} />}
            </button>
          )}
          <button
            className="item-delete-btn btn-rose-outline"
            onClick={() => removeWaypoint(waypoint.id)}
            aria-label="Supprimer"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
