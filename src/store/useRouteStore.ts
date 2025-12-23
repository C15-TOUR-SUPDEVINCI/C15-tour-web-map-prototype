/**
 * Store Zustand pour la gestion du trajet et des waypoints
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Waypoint } from '../domain/waypoint.types';
import type { RoutePayload } from '../domain/route.types';

/**
 * Interface du store de route
 */
interface RouteStore {
  // State
  /** Nom du trajet */
  routeName: string;
  /** Liste ordonnée des waypoints */
  waypoints: Waypoint[];

  // Actions
  /** Définir le nom du trajet */
  setRouteName: (name: string) => void;
  
  /** Ajouter un waypoint */
  addWaypoint: (lat: number, lng: number, label: string) => void;
  
  /** Supprimer un waypoint par ID */
  removeWaypoint: (id: string) => void;
  
  /** Réordonner les waypoints (drag & drop) */
  reorderWaypoints: (startIndex: number, endIndex: number) => void;
  
  /** Vider tous les waypoints */
  clearWaypoints: () => void;
  
  /** Générer le payload JSON pour le backend */
  generatePayload: () => RoutePayload;
}

/**
 * Hook Zustand pour gérer l'état global du trajet
 */
export const useRouteStore = create<RouteStore>((set, get) => ({
  // État initial
  routeName: 'Nouveau trajet',
  waypoints: [],

  // Actions
  setRouteName: (name: string) => {
    set({ routeName: name });
  },

  addWaypoint: (lat: number, lng: number, label: string) => {
    const { waypoints } = get();
    const newWaypoint: Waypoint = {
      id: uuidv4(),
      lat,
      lng,
      label,
      order: waypoints.length + 1,
    };
    
    set({ waypoints: [...waypoints, newWaypoint] });
  },

  removeWaypoint: (id: string) => {
    const { waypoints } = get();
    const updatedWaypoints = waypoints
      .filter((wp) => wp.id !== id)
      .map((wp, index) => ({ ...wp, order: index + 1 })); // Réindexer les ordres
    
    set({ waypoints: updatedWaypoints });
  },

  reorderWaypoints: (startIndex: number, endIndex: number) => {
    const { waypoints } = get();
    const result = Array.from(waypoints);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    
    // Réindexer les ordres après réorganisation
    const reorderedWaypoints = result.map((wp, index) => ({
      ...wp,
      order: index + 1,
    }));
    
    set({ waypoints: reorderedWaypoints });
  },

  clearWaypoints: () => {
    set({ waypoints: [] });
  },

  generatePayload: (): RoutePayload => {
    const { routeName, waypoints } = get();
    return {
      name: routeName,
      waypoints: waypoints.map((wp) => ({
        lat: wp.lat,
        lng: wp.lng,
        label: wp.label,
        order: wp.order,
      })),
    };
  },
}));
