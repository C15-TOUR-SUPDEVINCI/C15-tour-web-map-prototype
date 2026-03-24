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
  waypoints: Waypoint[];
  groups: Group[];

  // Tous les itinéraires sauvegardés
  itineraries: Itinerary[];

  // Données du tracé calculé
  routeCoordinates: [number, number][];
  routeLegs: { distance: number; duration: number }[];
  routeDistance: number | null;
  routeDuration: number | null;

  // Actions
  setRouteName: (name: string) => void;

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
  reorderWaypoints: (startIndex: number, endIndex: number) => void;
  moveWaypoint: (activeId: string, overId: string, overGroupId?: string) => void;
  clearWaypoints: () => void;

  // Groupes
  addGroup: (name: string) => void;
  removeGroup: (id: string) => void;
  updateGroup: (id: string, name: string) => void;
  setWaypointGroup: (waypointId: string, groupId: string) => void;

  // Export
  generatePayload: () => RoutePayload;
}

const DEFAULT_GROUP_ID = 'default-group';
const STORAGE_KEY = 'c15-itineraries';

// Met à jour les types des waypoints : premier et dernier = EXTREMITY, le reste = PASSAGE
export const recalcWaypointsTypes = (waypoints: Waypoint[]): Waypoint[] => {
  return waypoints.map((wp, index) => {
    if (index === 0 || index === waypoints.length - 1) {
      return { ...wp, type: "EXTREMITY" };
    }
    return { ...wp, type: "PASSAGE" };
  });
};

export const useRouteStore = create<RouteStore>((set, get) => ({
  currentId: null,
  routeName: 'Nouveau trajet',
  waypoints: [],
  groups: [{ id: DEFAULT_GROUP_ID, name: 'Groupe par défaut' }],
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
      waypoints: [],
      groups: [{ id: DEFAULT_GROUP_ID, name: 'Groupe par défaut' }],
      routeCoordinates: [],
      routeLegs: [],
      routeDistance: null,
      routeDuration: null,
    });
  },

  saveCurrent: () => {
    const { currentId, routeName, waypoints, groups, itineraries } = get();
    if (!currentId) return;

    const currentItinerary: Itinerary = {
      id: currentId,
      name: routeName,
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
      set({
        currentId: itinerary.id,
        routeName: itinerary.name,
        waypoints: itinerary.waypoints,
        groups: itinerary.groups,
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
      waypoints: [],
      groups: [{ id: DEFAULT_GROUP_ID, name: 'Groupe par défaut' }],
      routeCoordinates: [],
      routeLegs: [],
      routeDistance: null,
      routeDuration: null,
    });
  },

  setRouteName: (name) => {
    set({ routeName: name });
  },

  addWaypoint: (lat, lng, label, type) => {
    const { waypoints, groups } = get();
    const targetGroupId = groups.at(-1)?.id || DEFAULT_GROUP_ID;

    const newWaypoint: Waypoint = {
      id: uuidv4(),
      lat,
      lng,
      label,
      name: '', // Initialiser avec un nom vide
      order: waypoints.length + 1,
      type: type ?? "EXTREMITY",
      groupId: targetGroupId,
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

  updateWaypointLabel: (id, name) => {
    set((state) => ({
      waypoints: state.waypoints.map((wp) =>
        wp.id === id ? { ...wp, name } : wp
      ),
    }));
  },

  updateWaypointAddress: (id, address) => {
    set((state) => ({
      waypoints: state.waypoints.map((wp) =>
        wp.id === id ? { ...wp, label: address } : wp
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
    const [movedWaypoint] = nextWaypoints.splice(activeIndex, 1);

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
    const newGroup: Group = { id: uuidv4(), name };
    set((state) => ({ groups: [...state.groups, newGroup] }));
  },

  removeGroup: (id: string) => {
    if (id === DEFAULT_GROUP_ID) return;

    set((state) => {
      const filteredGroups = state.groups.filter(g => g.id !== id);
      // Les waypoints orphelins retournent dans le groupe par défaut
      const updatedWaypoints = state.waypoints.map(wp =>
        wp.groupId === id ? { ...wp, groupId: DEFAULT_GROUP_ID } : wp
      );

      return {
        groups: filteredGroups,
        waypoints: updatedWaypoints
      };
    });
  },

  updateGroup: (id: string, name: string) => {
    set((state) => ({
      groups: state.groups.map(g => g.id === id ? { ...g, name } : g)
    }));
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
        name: wp.name,
        order: wp.order,
        type: wp.type,
        groupId: wp.groupId,
      })),
    };
  },
}));
