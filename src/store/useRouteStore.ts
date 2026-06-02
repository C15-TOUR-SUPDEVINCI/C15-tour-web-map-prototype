import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Waypoint, TypeOfPoint, Group } from '../domain/waypoint.types';
import type { RoutePayload } from '../domain/route.types';
import type { Itinerary } from '../domain/itinerary.types';
import {
  DEFAULT_GROUP_ID,
  ONE_DAY_MS,
  createDefaultGroup,
  normalizeMaxParticipants,
} from '../domain/constants';
import {
  deletePublishedItinerary,
  getItinerariesFromServer,
  getItineraryFromServer,
  saveItineraryToServer,
} from '../services/api.service';
import { getErrorMessage } from '../lib/errors';
import { useAuthStore } from './useAuthStore';

interface RouteStore {
  currentId: string | null;
  serverEventId: string | null;
  routeName: string;
  routeDescription: string;
  startDate: string;
  endDate: string;
  maxParticipants: number;
  waypoints: Waypoint[];
  groups: Group[];
  groupColors: Record<string, string>;

  itineraries: Itinerary[];
  hasLoadedItineraries: boolean;
  isLoadingItineraries: boolean;
  isOpeningItinerary: boolean;
  loadError: string | null;

  isDirty: boolean;
  isSaving: boolean;
  saveQueued: boolean;
  saveVersion: number;
  saveError: string | null;

  routeCoordinates: [number, number][];
  routeLegs: { distance: number; duration: number }[];
  routeDistance: number | null;
  routeDuration: number | null;

  focusedCoordinate: [number, number] | null;
  focusCoordinate: (coord: [number, number] | null) => void;

  setRouteName: (name: string) => void;
  setRouteDescription: (desc: string) => void;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setMaxParticipants: (max: number) => void;

  loadAll: () => Promise<void>;
  createNew: () => void;
  saveToServer: () => Promise<string | null>;
  openItinerary: (id: string) => Promise<void>;
  deleteItinerary: (id: string) => Promise<void>;
  exitEditor: () => Promise<void>;

  addWaypoint: (lat: number, lng: number, label: string, type?: TypeOfPoint) => void;
  removeWaypoint: (id: string) => void;
  updateWaypointLabel: (id: string, label: string) => void;
  updateWaypointAddress: (id: string, address: string) => void;
  updateWaypointDetails: (id: string, updates: Partial<Waypoint>) => void;
  reorderWaypoints: (startIndex: number, endIndex: number) => void;
  moveWaypoint: (activeId: string, overId: string, overGroupId?: string) => void;
  clearWaypoints: () => void;

  addGroup: (name: string) => void;
  removeGroup: (id: string) => void;
  updateGroup: (id: string, name: string) => void;
  updateGroupDetails: (id: string, updates: Partial<Group>) => void;
  reorderGroups: (activeId: string, overId: string) => void;
  setWaypointGroup: (waypointId: string, groupId: string) => void;

  generatePayload: () => RoutePayload;
}

export const COLOR_POOL = [
  '#bb487c',
  '#7c3aed',
  '#ef4444',
  '#db2777',
  '#6d28d9',
  '#be123c',
  '#d946ef',
  '#8b5cf6',
  '#f43f5e',
  '#4f46e5',
  '#991b1b',
  '#a21caf',
];

const DEFAULT_GROUP_COLOR = '#bb487c';

function shuffleColors(): string[] {
  const pool = [...COLOR_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

function getAvailableGroupColor(usedColors: string[]) {
  return COLOR_POOL.find((color) => !usedColors.includes(color))
    ?? COLOR_POOL[Math.floor(Math.random() * COLOR_POOL.length)];
}

export function generateGroupColors(groupIds: string[]): Record<string, string> {
  const colors = shuffleColors();
  const colorMap: Record<string, string> = {};

  groupIds.forEach((id, index) => {
    colorMap[id] = id === DEFAULT_GROUP_ID
      ? DEFAULT_GROUP_COLOR
      : colors[index % colors.length];
  });

  return colorMap;
}

function mergeGroupColors(groups: Group[], currentColors: Record<string, string> = {}) {
  const nextColors: Record<string, string> = {};

  groups.forEach((group) => {
    if (group.id === DEFAULT_GROUP_ID) {
      nextColors[group.id] = DEFAULT_GROUP_COLOR;
      return;
    }

    nextColors[group.id] = currentColors[group.id]
      ?? getAvailableGroupColor(Object.values({ ...currentColors, ...nextColors }));
  });

  return nextColors;
}

function remapSavedGroupColors(
  previousGroups: Group[],
  savedGroups: Group[],
  currentColors: Record<string, string>
) {
  const remapped: Record<string, string> = {};

  savedGroups.forEach((group, index) => {
    const previousId = previousGroups[index]?.id;

    if (group.id === DEFAULT_GROUP_ID) {
      remapped[group.id] = DEFAULT_GROUP_COLOR;
      return;
    }

    remapped[group.id] = currentColors[group.id]
      ?? (previousId ? currentColors[previousId] : undefined)
      ?? getAvailableGroupColor(Object.values({ ...currentColors, ...remapped }));
  });

  return remapped;
}

const getTodayStr = () => new Date().toISOString().slice(0, 16);
const getTomorrowStr = () => new Date(Date.now() + ONE_DAY_MS).toISOString().slice(0, 16);

export { DEFAULT_GROUP_ID };

const markDirty = <T extends object>(state: RouteStore, updates: T) => ({
  ...updates,
  isDirty: true,
  saveVersion: state.saveVersion + 1,
});

const buildCurrentItinerary = (state: RouteStore): Itinerary | null => {
  if (!state.currentId) return null;

  return {
    id: state.serverEventId ?? state.currentId,
    name: state.routeName,
    description: state.routeDescription,
    startDate: state.startDate,
    endDate: state.endDate,
    maxParticipants: state.maxParticipants,
    lastModified: new Date().toISOString(),
    waypoints: state.waypoints,
    groups: state.groups,
  };
};

const upsertItinerary = (itineraries: Itinerary[], itinerary: Itinerary) => {
  const existingIndex = itineraries.findIndex((item) => item.id === itinerary.id);
  if (existingIndex < 0) return [...itineraries, itinerary];

  const next = [...itineraries];
  next[existingIndex] = itinerary;
  return next;
};

const resetEditorState = () => {
  const groups = [createDefaultGroup()];

  return {
    currentId: null,
    serverEventId: null,
    routeName: 'Nouveau trajet',
    routeDescription: '',
    startDate: getTodayStr(),
    endDate: getTomorrowStr(),
    maxParticipants: 50,
    waypoints: [],
    groups,
    groupColors: mergeGroupColors(groups),
    routeCoordinates: [],
    routeLegs: [],
    routeDistance: null,
    routeDuration: null,
    isDirty: false,
    isSaving: false,
    saveQueued: false,
    saveError: null,
    focusedCoordinate: null,
  };
};

let activeSavePromise: Promise<string | null> | null = null;

export const recalcWaypointsTypes = (waypoints: Waypoint[]): Waypoint[] => {
  return waypoints.map((wp, index) => {
    if (index === 0 || index === waypoints.length - 1) {
      return { ...wp, type: 'EXTREMITY' };
    }
    if (wp.type === 'EXTREMITY') {
      return { ...wp, type: 'PASSAGE' };
    }
    return wp;
  });
};

const initialGroups = [createDefaultGroup()];

export const useRouteStore = create<RouteStore>((set, get) => ({
  currentId: null,
  serverEventId: null,
  routeName: 'Nouveau trajet',
  routeDescription: '',
  startDate: getTodayStr(),
  endDate: getTomorrowStr(),
  maxParticipants: 50,
  waypoints: [],
  groups: initialGroups,
  groupColors: mergeGroupColors(initialGroups),
  itineraries: [],
  hasLoadedItineraries: false,
  isLoadingItineraries: false,
  isOpeningItinerary: false,
  loadError: null,
  isDirty: false,
  isSaving: false,
  saveQueued: false,
  saveVersion: 0,
  saveError: null,
  routeCoordinates: [],
  routeLegs: [],
  routeDistance: null,
  routeDuration: null,
  focusedCoordinate: null,
  focusCoordinate: (coord) => set({ focusedCoordinate: coord }),

  loadAll: async () => {
    set({ isLoadingItineraries: true, loadError: null });
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error('ID utilisateur manquant pour charger les trajets.');

      const itineraries = await getItinerariesFromServer(userId);
      set({
        itineraries,
        hasLoadedItineraries: true,
        isLoadingItineraries: false,
      });
    } catch (error: unknown) {
      console.error('Failed to load itineraries from server', error);
      set({
        hasLoadedItineraries: true,
        isLoadingItineraries: false,
        loadError: getErrorMessage(error),
      });
    }
  },

  createNew: () => {
    set({
      ...resetEditorState(),
      currentId: uuidv4(),
      saveVersion: get().saveVersion + 1,
    });
  },

  saveToServer: () => {
    const runSave = async (): Promise<string | null> => {
      const state = get();
      const itinerary = buildCurrentItinerary(state);

      if (!itinerary) return state.serverEventId;
      if (!state.isDirty && state.serverEventId) return state.serverEventId;
      if (!state.isDirty && !state.serverEventId) return null;

      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        const message = 'ID utilisateur manquant pour la sauvegarde.';
        set({ saveError: message });
        throw new Error(message);
      }

      const savedVersion = state.saveVersion;
      const previousGroups = state.groups;
      set({ isSaving: true, saveQueued: false, saveError: null });

      try {
        const saved = await saveItineraryToServer(
          itinerary,
          userId,
          state.serverEventId ?? undefined
        );
        const eventId = saved.id;
        const latest = get();
        const shouldSaveAgain = latest.saveQueued || latest.saveVersion !== savedVersion;

        set({
          currentId: eventId,
          serverEventId: eventId,
          itineraries: upsertItinerary(latest.itineraries, saved),
          ...(!shouldSaveAgain
            ? {
                maxParticipants: saved.maxParticipants,
                groups: saved.groups,
                groupColors: remapSavedGroupColors(previousGroups, saved.groups, latest.groupColors),
                waypoints: recalcWaypointsTypes(saved.waypoints),
              }
            : {}),
          isSaving: false,
          saveQueued: false,
          isDirty: shouldSaveAgain,
          saveError: null,
        });

        if (shouldSaveAgain) {
          return runSave();
        }

        return eventId;
      } catch (error: unknown) {
        const message = getErrorMessage(error);
        set({
          isSaving: false,
          saveQueued: false,
          isDirty: true,
          saveError: message,
        });
        throw error;
      }
    };

    if (get().isSaving && activeSavePromise) {
      set({ saveQueued: true });
      return activeSavePromise;
    }

    activeSavePromise = runSave().finally(() => {
      activeSavePromise = null;
    });
    return activeSavePromise;
  },

  openItinerary: async (id) => {
    set({ isOpeningItinerary: true, loadError: null });
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error('ID utilisateur manquant pour ouvrir ce trajet.');

      const itinerary = await getItineraryFromServer(id, userId);
      const groups = itinerary.groups.length > 0 ? itinerary.groups : [createDefaultGroup()];

      set((state) => ({
        currentId: itinerary.id,
        serverEventId: itinerary.id,
        routeName: itinerary.name,
        routeDescription: itinerary.description || '',
        startDate: itinerary.startDate || getTodayStr(),
        endDate: itinerary.endDate || getTomorrowStr(),
        maxParticipants: normalizeMaxParticipants(itinerary.maxParticipants),
        waypoints: recalcWaypointsTypes(itinerary.waypoints),
        groups,
        groupColors: mergeGroupColors(groups, state.groupColors),
        itineraries: upsertItinerary(state.itineraries, {
          ...itinerary,
          waypoints: [],
        }),
        routeCoordinates: [],
        routeLegs: [],
        routeDistance: null,
        routeDuration: null,
        isDirty: false,
        saveQueued: false,
        saveError: null,
        isOpeningItinerary: false,
      }));
    } catch (error: unknown) {
      set({
        isOpeningItinerary: false,
        loadError: getErrorMessage(error),
      });
      throw error;
    }
  },

  deleteItinerary: async (id) => {
    const state = get();
    const serverEventId = state.currentId === id ? state.serverEventId : id;
    const shouldDeleteServer = Boolean(serverEventId)
      && (state.serverEventId === serverEventId
        || state.itineraries.some((itinerary) => itinerary.id === serverEventId));

    if (shouldDeleteServer && serverEventId) {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error('ID utilisateur manquant pour supprimer ce trajet.');

      await deletePublishedItinerary(serverEventId, userId);
    }

    set((current) => {
      const nextItineraries = current.itineraries.filter((itinerary) =>
        itinerary.id !== id && itinerary.id !== serverEventId
      );
      const isCurrent = current.currentId === id || current.serverEventId === serverEventId;

      return {
        ...(isCurrent ? resetEditorState() : {}),
        itineraries: nextItineraries,
      };
    });
  },

  exitEditor: async () => {
    await get().saveToServer();
    set(resetEditorState());
  },

  setRouteName: (name) => set((state) => markDirty(state, { routeName: name })),
  setRouteDescription: (desc) => set((state) => markDirty(state, { routeDescription: desc })),
  setStartDate: (date) => set((state) => markDirty(state, { startDate: date })),
  setEndDate: (date) => set((state) => markDirty(state, { endDate: date })),
  setMaxParticipants: (max) => set((state) => markDirty(state, { maxParticipants: max })),

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
      type: type ?? 'EXTREMITY',
      groupId: targetGroupId,
      isCustomName: false,
    };

    const next = recalcWaypointsTypes([...waypoints, newWaypoint]);
    set((state) => markDirty(state, { waypoints: next }));
  },

  removeWaypoint: (id) => {
    const { waypoints } = get();
    const updatedWaypoints = waypoints
      .filter((wp) => wp.id !== id)
      .map((wp, index) => ({ ...wp, order: index + 1 }));

    set((state) => markDirty(state, { waypoints: recalcWaypointsTypes(updatedWaypoints) }));
  },

  updateWaypointLabel: (id, label) => {
    set((state) => markDirty(state, {
      waypoints: state.waypoints.map((wp) => {
        if (wp.id !== id) return wp;

        const trimmed = label.trim();
        const normalized = trimmed.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const isDefault = !trimmed
          || /^(etape|point)\s+\d+$/i.test(normalized)
          || normalized === 'depart'
          || normalized === 'arrivee';

        return {
          ...wp,
          label: isDefault ? (wp.address || '') : label,
          isCustomName: !isDefault,
        };
      }),
    }));
  },

  updateWaypointAddress: (id, address) => {
    set((state) => markDirty(state, {
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
    set((state) => markDirty(state, {
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

    set((state) => markDirty(state, { waypoints: recalcWaypointsTypes(reorderedWaypoints) }));
  },

  moveWaypoint: (activeId, overId, overGroupId) => {
    const { waypoints } = get();
    const activeIndex = waypoints.findIndex((wp) => wp.id === activeId);
    const overIndex = waypoints.findIndex((wp) => wp.id === overId);

    if (activeIndex === -1) return;

    const nextWaypoints = [...waypoints];
    const [movedRef] = nextWaypoints.splice(activeIndex, 1);
    const movedWaypoint = { ...movedRef };

    if (overGroupId) {
      movedWaypoint.groupId = overGroupId;
    } else if (overIndex !== -1) {
      movedWaypoint.groupId = waypoints[overIndex].groupId;
    }

    const insertAt = overIndex === -1 ? nextWaypoints.length : overIndex;
    nextWaypoints.splice(insertAt, 0, movedWaypoint);

    const updated = nextWaypoints.map((wp, index) => ({
      ...wp,
      order: index + 1,
    }));

    set((state) => markDirty(state, { waypoints: recalcWaypointsTypes(updated) }));
  },

  clearWaypoints: () => {
    set((state) => markDirty(state, {
      waypoints: [],
      routeCoordinates: [],
      routeLegs: [],
      routeDistance: null,
      routeDuration: null,
    }));
  },

  addGroup: (name) => {
    const newGroup: Group = {
      id: uuidv4(),
      name,
      routeType: 'MIXTE',
      difficultyLevel: 'MOYEN',
    };

    set((state) => markDirty(state, {
      groups: [...state.groups, newGroup],
      groupColors: {
        ...state.groupColors,
        [newGroup.id]: getAvailableGroupColor(Object.values(state.groupColors)),
      },
    }));
  },

  removeGroup: (id) => {
    if (id === DEFAULT_GROUP_ID) return;

    set((state) => {
      const filteredGroups = state.groups.filter((group) => group.id !== id);
      const nextGroups = filteredGroups.length > 0 ? filteredGroups : [createDefaultGroup()];
      const fallbackGroupId = nextGroups[0].id;
      const nextGroupIds = new Set(nextGroups.map((group) => group.id));
      const updatedWaypoints = state.waypoints.map((wp) =>
        wp.groupId === id || !nextGroupIds.has(wp.groupId)
          ? { ...wp, groupId: fallbackGroupId }
          : wp
      );
      const nextColors = mergeGroupColors(nextGroups, state.groupColors);

      return markDirty(state, {
        groups: nextGroups,
        groupColors: nextColors,
        waypoints: updatedWaypoints,
      });
    });
  },

  updateGroup: (id, name) => {
    set((state) => markDirty(state, {
      groups: state.groups.map((group) =>
        group.id === id ? { ...group, name } : group
      ),
    }));
  },

  updateGroupDetails: (id, updates) => {
    set((state) => markDirty(state, {
      groups: state.groups.map((group) =>
        group.id === id ? { ...group, ...updates } : group
      ),
    }));
  },

  reorderGroups: (activeId, overId) => {
    const { groups, waypoints } = get();
    const activeIndex = groups.findIndex((group) => group.id === activeId);
    const overIndex = groups.findIndex((group) => group.id === overId);

    if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) return;

    const nextGroups = [...groups];
    const [movedGroup] = nextGroups.splice(activeIndex, 1);
    nextGroups.splice(overIndex, 0, movedGroup);

    const waypointsByGroup: Record<string, Waypoint[]> = {};
    groups.forEach((group) => {
      waypointsByGroup[group.id] = [];
    });

    waypoints.forEach((waypoint) => {
      const groupId = waypoint.groupId || DEFAULT_GROUP_ID;
      if (!waypointsByGroup[groupId]) {
        waypointsByGroup[groupId] = [];
      }
      waypointsByGroup[groupId].push(waypoint);
    });

    const nextWaypoints: Waypoint[] = [];
    nextGroups.forEach((group) => {
      nextWaypoints.push(...(waypointsByGroup[group.id] || []));
    });

    Object.entries(waypointsByGroup).forEach(([groupId, groupWaypoints]) => {
      if (!nextGroups.some((group) => group.id === groupId)) {
        nextWaypoints.push(...groupWaypoints);
      }
    });

    const updatedWaypoints = nextWaypoints.map((waypoint, index) => ({
      ...waypoint,
      order: index + 1,
    }));

    set((state) => markDirty(state, {
      groups: nextGroups,
      waypoints: recalcWaypointsTypes(updatedWaypoints),
    }));
  },

  setWaypointGroup: (waypointId, groupId) => {
    set((state) => markDirty(state, {
      waypoints: state.waypoints.map((wp) =>
        wp.id === waypointId ? { ...wp, groupId } : wp
      ),
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
