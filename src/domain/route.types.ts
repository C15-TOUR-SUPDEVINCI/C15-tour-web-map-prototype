/**
 * Types relatifs aux trajets (routes)
 */

import type { Waypoint } from './waypoint.types';

/**
 * Représente un trajet complet avec ses waypoints
 */
export interface Route {
  /** Nom du trajet */
  name: string;
  /** Liste ordonnée des waypoints */
  waypoints: Waypoint[];
}

/**
 * Payload JSON à envoyer au backend
 */
export interface RoutePayload {
  /** Nom du trajet */
  name: string;
  /** Liste des waypoints avec leurs coordonnées et ordre */
  waypoints: Array<{
    lat: number;
    lng: number;
    label: string;
    order: number;
  }>;
}
