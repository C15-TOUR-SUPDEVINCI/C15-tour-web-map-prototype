// Store Zustand — gère tout l'état de l'app (itinéraires, waypoints, groupes, route)

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Waypoint, TypeOfPoint, Group } from '../domain/waypoint.types';
import type { RoutePayload } from '../domain/route.types';
import type { Itinerary } from '../domain/itinerary.types';

interface RouteStore {
  // Itinéraire en cours d'édition
  currentId: string | null;
  routeName: string;
  routeDescription: string;
  startDate: string;
  endDate: string;
  maxParticipants: number;
  waypoints: Waypoint[];
  groups: Group[];
  groupColors: Record<string, string>; // NOUVEAU

  // Tous les itinéraires sauvegardés
  itineraries: Itinerary[];

  // Données du tracé calculé
  routeCoordinates: [number, number][];
  routeLegs: { distance: number; duration: number }[];
  routeDistance: number | null;
  routeDuration: number | null;

  // Actions (Globales)
  setRouteName: (name: string) => void;
  setRouteDescription: (desc: string) => void;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setMaxParticipants: (max: number) => void;

  // Itinéraires
  loadAll: () => void;
  createNew: () => void;
  saveCurrent: () => void;
  openItinerary: (id: string) => void;
  deleteItinerary: (id: string) => void;
  exitEditor: () => void;

  // Waypoints
  addWaypoint: (lat: number, lng: number, label: string, type?: TypeOfPoint) => void;
  removeWaypoint: (id: string) => void;
  updateWaypointLabel: (id: string, label: string) => void;
  updateWaypointAddress: (id: string, address: string) => void;
  updateWaypointDetails: (id: string, updates: Partial<Waypoint>) => void; // NOUVEAU
  reorderWaypoints: (startIndex: number, endIndex: number) => void;
  moveWaypoint: (activeId: string, overId: string, overGroupId?: string) => void;
  clearWaypoints: () => void;

  // Groupes
  addGroup: (name: string) => void;
  removeGroup: (id: string) => void;
  updateGroup: (id: string, name: string) => void;
  updateGroupDetails: (id: string, updates: Partial<Group>) => void; // NOUVEAU
  reorderGroups: (activeId: string, overId: string) => void; // NOUVEAU
  setWaypointGroup: (waypointId: string, groupId: string) => void;

  // Export
  generatePayload: () => RoutePayload;
}

export const COLOR_POOL = [
  '#bb487c', // Signature Rose
  '#7c3aed', // Vibrant Purple
  '#ef4444', // Vibrant Red
  '#db2777', // Magenta
  '#6d28d9', // Deep Purple
  '#be123c', // Crimson
  '#d946ef', // Fuchsia
  '#8b5cf6', // Lavender
  '#f43f5e', // Rose Red
  '#4f46e5', // Indigo
  '#991b1b', // Burgundy
  '#a21caf', // Mauve
];

function shuffleColors(): string[] {
  const pool = [...COLOR_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

export function generateGroupColors(groupIds: string[]): Record<string, string> {
  const colors = shuffleColors();
  const colorMap: Record<string, string> = {};
  
  groupIds.forEach((id, index) => {
    if (id === DEFAULT_GROUP_ID) {
      colorMap[id] = '#bb487c'; // Toujours Signature Rose pour le groupe par défaut
    } else {
      colorMap[id] = colors[index % colors.length];
    }
  });
  
  return colorMap;
}

export const DEFAULT_GROUP_ID = 'default-group';
const STORAGE_KEY = 'c15-itineraries';

// Helpers de date par défaut (Aujourd'hui et Demain)
const getTodayStr = () => new Date().toISOString().slice(0, 16);
const getTomorrowStr = () => new Date(Date.now() + 86400000).toISOString().slice(0, 16);

// Met à jour les types des waypoints : premier et dernier = EXTREMITY.
// Pour les waypoints intermédiaires, seul EXTREMITY est rétrogradé en PASSAGE —
// les types PAUSE, INTERET et USER sont préservés.
export const recalcWaypointsTypes = (waypoints: Waypoint[]): Waypoint[] => {
  return waypoints.map((wp, index) => {
    if (index === 0 || index === waypoints.length - 1) {
      return { ...wp, type: "EXTREMITY" };
    }
    if (wp.type === "EXTREMITY") {
      return { ...wp, type: "PASSAGE" };
    }
    return wp;
  });
};

export const useRouteStore = create<RouteStore>((set, get) => ({
  currentId: null,
  routeName: 'Nouveau trajet',
  routeDescription: '',
  startDate: getTodayStr(),
  endDate: getTomorrowStr(),
  maxParticipants: 50,
  waypoints: [],
  groups: [{ id: DEFAULT_GROUP_ID, name: 'Groupe par défaut', routeType: 'MIXTE', difficultyLevel: 'MOYEN' }],
  groupColors: { [DEFAULT_GROUP_ID]: '#bb487c' },
  itineraries: [],
  routeCoordinates: [],
  routeLegs: [],
  routeDistance: null,
  routeDuration: null,

  // Charge tous les itinéraires depuis le localStorage
  loadAll: () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        set({ itineraries: JSON.parse(saved) });
      } catch (e) {
        console.error('Failed to load itineraries from localStorage', e);
      }
    }
  },

  createNew: () => {
    set({
      currentId: uuidv4(),
      routeName: 'Nouveau trajet',
      routeDescription: '',
      startDate: getTodayStr(),
      endDate: getTomorrowStr(),
      maxParticipants: 50,
      waypoints: [],
      groups: [{ id: DEFAULT_GROUP_ID, name: 'Groupe par défaut', routeType: 'MIXTE', difficultyLevel: 'MOYEN' }],
      groupColors: { [DEFAULT_GROUP_ID]: '#bb487c' },
      routeCoordinates: [],
      routeLegs: [],
      routeDistance: null,
      routeDuration: null,
    });
  },

  saveCurrent: () => {
    const { 
        currentId, routeName, routeDescription, startDate, endDate, maxParticipants, 
        waypoints, groups, itineraries 
    } = get();
    
    if (!currentId) return;

    const currentItinerary: Itinerary = {
      id: currentId,
      name: routeName,
      description: routeDescription,
      startDate,
      endDate,
      maxParticipants,
      lastModified: new Date().toISOString(),
      waypoints,
      groups,
    };

    const existingIndex = itineraries.findIndex((it) => it.id === currentId);
    const nextItineraries = [...itineraries];

    if (existingIndex >= 0) {
      nextItineraries[existingIndex] = currentItinerary;
    } else {
      nextItineraries.push(currentItinerary);
    }

    set({ itineraries: nextItineraries });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItineraries));
  },

  openItinerary: (id) => {
    const { itineraries } = get();
    const itinerary = itineraries.find((it) => it.id === id);
    if (itinerary) {
      const gColors = generateGroupColors(itinerary.groups.map(g => g.id));
      set({
        currentId: itinerary.id,
        routeName: itinerary.name,
        routeDescription: itinerary.description || '',
        startDate: itinerary.startDate || getTodayStr(),
        endDate: itinerary.endDate || getTomorrowStr(),
        maxParticipants: itinerary.maxParticipants || 50,
        waypoints: itinerary.waypoints,
        groups: itinerary.groups,
        groupColors: gColors,
        routeCoordinates: [], // recalculé par RouteCalculator
        routeLegs: [],
        routeDistance: null,
        routeDuration: null,
      });
    }
  },

  deleteItinerary: (id) => {
    const { itineraries } = get();
    const nextItineraries = itineraries.filter((it) => it.id !== id);
    set({ itineraries: nextItineraries });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItineraries));
  },

  exitEditor: () => {
    get().saveCurrent();
    set({
      currentId: null,
      routeName: 'Nouveau trajet',
      routeDescription: '',
      startDate: getTodayStr(),
      endDate: getTomorrowStr(),
      maxParticipants: 50,
      waypoints: [],
      groups: [{ id: DEFAULT_GROUP_ID, name: 'Groupe par défaut', routeType: 'MIXTE', difficultyLevel: 'MOYEN' }],
      groupColors: { [DEFAULT_GROUP_ID]: '#bb487c' },
      routeCoordinates: [],
      routeLegs: [],
      routeDistance: null,
      routeDuration: null,
    });
  },

  setRouteName: (name) => set({ routeName: name }),
  setRouteDescription: (desc) => set({ routeDescription: desc }),
  setStartDate: (date) => set({ startDate: date }),
  setEndDate: (date) => set({ endDate: date }),
  setMaxParticipants: (max) => set({ maxParticipants: max }),

  addWaypoint: (lat, lng, label, type) => {
    const { waypoints, groups } = get();
    const targetGroupId = groups[groups.length - 1]?.id || DEFAULT_GROUP_ID;

    const newWaypoint: Waypoint = {
      id: uuidv4(),
      lat,
      lng,
      label,
      address: label,
      description: '',
      pauseDurationMinutes: 0,
      order: waypoints.length + 1,
      type: type ?? "EXTREMITY",
      groupId: targetGroupId,
      isCustomName: false,
    };

    const next = recalcWaypointsTypes([...waypoints, newWaypoint]);
    set({ waypoints: next });
  },

  removeWaypoint: (id) => {
    const { waypoints } = get();
    const updatedWaypoints = waypoints
      .filter((wp) => wp.id !== id)
      .map((wp, index) => ({ ...wp, order: index + 1 }));

    set({ waypoints: recalcWaypointsTypes(updatedWaypoints) });
  },

  updateWaypointLabel: (id, label) => {
    set((state) => ({
      waypoints: state.waypoints.map((wp) => {
        if (wp.id === id) {
          const isDefault = !label || /^(étape|etape|point)\s+\d+$/i.test(label.trim()) || label.trim().toLowerCase() === 'départ' || label.trim().toLowerCase() === 'arrivée';
          return {
            ...wp,
            label: isDefault ? (wp.address || '') : label,
            isCustomName: !isDefault,
          };
        }
        return wp;
      }),
    }));
  },

  updateWaypointAddress: (id, address) => {
    set((state) => ({
      waypoints: state.waypoints.map((wp) =>
        wp.id === id
          ? {
              ...wp,
              address,
              label: wp.isCustomName ? wp.label : address,
            }
          : wp
      ),
    }));
  },

  updateWaypointDetails: (id, updates) => {
    set((state) => ({
      waypoints: state.waypoints.map((wp) =>
        wp.id === id ? { ...wp, ...updates } : wp
      ),
    }));
  },

  reorderWaypoints: (startIndex, endIndex) => {
    const { waypoints } = get();
    const result = Array.from(waypoints);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    const reorderedWaypoints = result.map((wp, index) => ({
      ...wp,
      order: index + 1,
    }));

    set({ waypoints: recalcWaypointsTypes(reorderedWaypoints) });
  },

  moveWaypoint: (activeId, overId, overGroupId) => {
    const { waypoints } = get();
    const activeIndex = waypoints.findIndex((wp) => wp.id === activeId);
    const overIndex = waypoints.findIndex((wp) => wp.id === overId);

    if (activeIndex === -1) return;

    const nextWaypoints = [...waypoints];
    const [movedRef] = nextWaypoints.splice(activeIndex, 1);
    const movedWaypoint = { ...movedRef };

    // Change de groupe si on drop dans un autre groupe
    if (overGroupId) {
      movedWaypoint.groupId = overGroupId;
    } else if (overIndex !== -1) {
      movedWaypoint.groupId = waypoints[overIndex].groupId;
    }

    // Insère à la bonne position
    const insertAt = overIndex === -1 ? nextWaypoints.length : overIndex;
    nextWaypoints.splice(insertAt, 0, movedWaypoint);

    // Recalcule l'ordre et les types
    const updated = nextWaypoints.map((wp, index) => ({
      ...wp,
      order: index + 1,
    }));

    set({ waypoints: recalcWaypointsTypes(updated) });
  },

  clearWaypoints: () => {
    set({
      waypoints: [],
      routeCoordinates: [],
      routeLegs: [],
      routeDistance: null,
      routeDuration: null,
    });
  },

  addGroup: (name: string) => {
    const newGroup: Group = { 
        id: uuidv4(), 
        name, 
        routeType: 'MIXTE', 
        difficultyLevel: 'MOYEN' 
    };
    set((state) => {
      const usedColors = Object.values(state.groupColors);
      const availableColor = COLOR_POOL.find(c => !usedColors.includes(c)) || COLOR_POOL[Math.floor(Math.random() * COLOR_POOL.length)];
      return {
        groups: [...state.groups, newGroup],
        groupColors: { ...state.groupColors, [newGroup.id]: availableColor }
      };
    });
  },

  removeGroup: (id: string) => {
    if (id === DEFAULT_GROUP_ID) return;

    set((state) => {
      const filteredGroups = state.groups.filter(g => g.id !== id);
      // Les waypoints orphelins retournent dans le groupe par défaut
      const updatedWaypoints = state.waypoints.map(wp =>
        wp.groupId === id ? { ...wp, groupId: DEFAULT_GROUP_ID } : wp
      );

      const nextColors = { ...state.groupColors };
      delete nextColors[id];

      return {
        groups: filteredGroups,
        waypoints: updatedWaypoints,
        groupColors: nextColors
      };
    });
  },

  updateGroup: (id: string, name: string) => {
    set((state) => ({
      groups: state.groups.map(g => g.id === id ? { ...g, name } : g)
    }));
  },

  updateGroupDetails: (id, updates) => {
      set((state) => ({
        groups: state.groups.map(g => g.id === id ? { ...g, ...updates } : g)
      }));
  },

  reorderGroups: (activeId, overId) => {
    const { groups, waypoints } = get();
    const activeIndex = groups.findIndex((g) => g.id === activeId);
    const overIndex = groups.findIndex((g) => g.id === overId);

    if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) return;

    // 1. Reorder groups array
    const nextGroups = [...groups];
    const [movedGroup] = nextGroups.splice(activeIndex, 1);
    nextGroups.splice(overIndex, 0, movedGroup);

    // 2. Reorder waypoints array to match the new group order
    const waypointsByGroup: Record<string, Waypoint[]> = {};
    groups.forEach((g) => {
      waypointsByGroup[g.id] = [];
    });
    waypointsByGroup[DEFAULT_GROUP_ID] = [];

    waypoints.forEach((wp) => {
      const gid = wp.groupId || DEFAULT_GROUP_ID;
      if (!waypointsByGroup[gid]) {
        waypointsByGroup[gid] = [];
      }
      waypointsByGroup[gid].push(wp);
    });

    const nextWaypoints: Waypoint[] = [];
    nextGroups.forEach((g) => {
      const groupWps = waypointsByGroup[g.id] || [];
      nextWaypoints.push(...groupWps);
    });

    // Handle orphaned waypoints
    Object.keys(waypointsByGroup).forEach((gid) => {
      if (!nextGroups.some((g) => g.id === gid)) {
        nextWaypoints.push(...waypointsByGroup[gid]);
      }
    });

    // 3. Recalculate global order for all waypoints (1, 2, 3...)
    const updatedWaypoints = nextWaypoints.map((wp, index) => ({
      ...wp,
      order: index + 1,
    }));

    set({
      groups: nextGroups,
      waypoints: recalcWaypointsTypes(updatedWaypoints),
    });
  },

  setWaypointGroup: (waypointId: string, groupId: string) => {
    set((state) => ({
      waypoints: state.waypoints.map(wp =>
        wp.id === waypointId ? { ...wp, groupId } : wp
      )
    }));
  },

  generatePayload: (): RoutePayload => {
    const { routeName, waypoints, groups } = get();
    return {
      name: routeName,
      groups,
      waypoints: waypoints.map((wp) => ({
        lat: wp.lat,
        lng: wp.lng,
        label: wp.label,
        order: wp.order,
        type: wp.type,
        groupId: wp.groupId,
      })),
    };
  },
}));
