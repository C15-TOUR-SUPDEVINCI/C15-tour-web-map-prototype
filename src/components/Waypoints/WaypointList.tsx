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
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRouteStore, DEFAULT_GROUP_ID } from '../../store/useRouteStore';
import { WaypointItem } from './WaypointItem';
import { MESSAGES } from '../../domain/constants';
import { formatDistance, formatDuration } from '../../services/routing.service';
import './WaypointList.css';

import iconFlower from '../../assets/icons/icon-flower.png';
import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, GripVertical } from 'lucide-react';
import type { Waypoint } from '../../domain/waypoint.types';

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

interface SortableGroupSectionProps {
  readonly group: {
    id: string;
    name: string;
    distance: number;
    duration: number;
    waypoints: Waypoint[];
  };
  readonly groupColor: string;
  readonly editingId: string | null;
  readonly editingName: string;
  readonly setEditingName: (name: string) => void;
  readonly handleStartEdit: (id: string, name: string) => void;
  readonly handleSaveEdit: () => void;
  readonly setEditingId: (id: string | null) => void;
  readonly removeGroup: (id: string) => void;
}

function SortableGroupSection({
  group,
  groupColor,
  editingId,
  editingName,
  setEditingName,
  handleStartEdit,
  handleSaveEdit,
  setEditingId,
  removeGroup,
}: SortableGroupSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    '--group-color': groupColor,
  } as React.CSSProperties;

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={`waypoint-group-section ${isDragging ? 'is-dragging-group' : ''}`}
    >
      <header className="group-section-header" style={{ borderBottomColor: `${groupColor}33`, color: groupColor }}>
        {editingId === group.id ? (
          <div className="group-edit-row full-width">
            <input
              type="text"
              className="group-input"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
            />
            <button className="icon-button success" onClick={handleSaveEdit} title="Sauvegarder">
              <Check size={16} />
            </button>
            <button className="icon-button danger" onClick={() => setEditingId(null)} title="Annuler">
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <div className="group-header-title">
              <div className="group-drag-handle" {...attributes} {...listeners} title="Glisser pour réorganiser le groupe">
                <GripVertical size={16} />
              </div>
              <img
                src={iconFlower}
                alt=""
                className="custom-icon group-header-icon"
                style={{ filter: `drop-shadow(0px 2px 4px ${groupColor}33)` }}
              />
              <span className="group-section-name" style={{ color: groupColor }}>{group.name}</span>
              <div className="group-header-actions">
                <button
                  className="icon-button action-btn"
                  onClick={() => handleStartEdit(group.id, group.name)}
                  title="Renommer"
                  style={{ color: `${groupColor}cc` }}
                >
                  <Edit2 size={14} />
                </button>
                {group.id !== DEFAULT_GROUP_ID && (
                  <button
                    className="icon-button danger action-btn"
                    onClick={() => removeGroup(group.id)}
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
            <div className="group-section-stats" style={{ color: `${groupColor}b3` }}>
              <span>{formatDistance(group.distance)}</span>
              <span className="separator">•</span>
              <span>{formatDuration(group.duration)}</span>
            </div>
          </>
        )}
      </header>
      <DroppableGroupZone groupId={group.id}>
        <SortableContext
          items={group.waypoints.map((wp) => wp.id)}
          strategy={verticalListSortingStrategy}
        >
          {group.waypoints.length > 0 ? (
            group.waypoints.map((waypoint) => (
              <WaypointItem key={waypoint.id} waypoint={waypoint} />
            ))
          ) : (
            <div className="empty-group-placeholder">
              Aucun point dans ce groupe
            </div>
          )}
        </SortableContext>
      </DroppableGroupZone>
    </section>
  );
}

export function WaypointList() {
  const waypoints = useRouteStore((state) => state.waypoints);
  const groups = useRouteStore((state) => state.groups);
  const groupColors = useRouteStore((state) => state.groupColors) || {};
  const routeLegs = useRouteStore((state) => state.routeLegs);
  const moveWaypoint = useRouteStore((state) => state.moveWaypoint);
  const reorderGroups = useRouteStore((state) => state.reorderGroups);

  const addGroup = useRouteStore((state) => state.addGroup);
  const removeGroup = useRouteStore((state) => state.removeGroup);
  const updateGroup = useRouteStore((state) => state.updateGroup);

  const [isAdding, setIsAdding] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      addGroup(newGroupName.trim());
      setNewGroupName('');
      setIsAdding(false);
    }
  };

  const handleStartEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const handleSaveEdit = () => {
    if (editingId && editingName.trim()) {
      updateGroup(editingId, editingName.trim());
      setEditingId(null);
    }
  };

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

    // 1. Détecter s'il s'agit d'un glissement de GROUPE
    const isGroupDrag = groups.some((g) => g.id === activeId);

    if (isGroupDrag) {
      let targetGroupId = overId;

      // Si on drop sur un waypoint, on trouve son groupId
      const targetWaypoint = waypoints.find((wp) => wp.id === overId);
      if (targetWaypoint) {
        targetGroupId = targetWaypoint.groupId;
      }
      // Si on drop sur une zone de groupe
      else if (overId.startsWith('group-zone-')) {
        targetGroupId = over.data.current?.groupId || overId;
      }

      if (activeId !== targetGroupId) {
        reorderGroups(activeId, targetGroupId);
      }
    }
    // 2. Sinon, il s'agit d'un glissement de WAYPOINT
    else {
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
    }
  };

  if (waypoints.length === 0) {
    return (
      <div className="empty-state">
        <h3 className="empty-title">Commencez votre trajet</h3>
        <p className="empty-message">
          Recherchez une adresse en haut à droite ou cliquez directement sur la carte pour ajouter vos premières étapes.
        </p>
      </div>
    );
  }

  const waypointIndexMap = new Map(waypoints.map((wp, i) => [wp.id, i]));

  const groupStats = groups.map(group => {
    const groupWaypoints = waypoints.filter(wp => wp.groupId === group.id);
    let totalDistance = 0;
    let totalDuration = 0;

    groupWaypoints.forEach(wp => {
      const globalIndex = waypointIndexMap.get(wp.id) ?? -1;
      if (globalIndex > 0 && routeLegs[globalIndex - 1]) {
        totalDistance += routeLegs[globalIndex - 1].distance;
        totalDuration += routeLegs[globalIndex - 1].duration;
      }
    });

    return { id: group.id, name: group.name, distance: totalDistance, duration: totalDuration, waypoints: groupWaypoints };
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={groups.map((g) => g.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="waypoint-list-container">
          <div className="add-group-section">
            {isAdding ? (
              <div className="group-edit-row">
                <input
                  type="text"
                  className="group-input"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Nom du nouveau groupe..."
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()}
                  onBlur={() => !newGroupName && setIsAdding(false)}
                />
                <button className="icon-button success" onClick={handleAddGroup} title="Valider">
                  <Check size={16} />
                </button>
                <button className="icon-button danger" onClick={() => setIsAdding(false)} title="Annuler">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button className="add-group-btn" onClick={() => setIsAdding(true)}>
                <Plus size={18} /> Ajouter un groupe
              </button>
            )}
          </div>

          {groupStats.map((group) => (
            <SortableGroupSection
              key={group.id}
              group={group}
              groupColor={groupColors[group.id] || '#bb487c'}
              editingId={editingId}
              editingName={editingName}
              setEditingName={setEditingName}
              handleStartEdit={handleStartEdit}
              handleSaveEdit={handleSaveEdit}
              setEditingId={setEditingId}
              removeGroup={removeGroup}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
