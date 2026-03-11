import type { Waypoint, TypeOfPoint, Group } from './waypoint.types';

// Un trajet complet avec ses waypoints
export interface Route {
  name: string;
  waypoints: Waypoint[];
}

// Format d'export JSON (pour le backend ou l'export fichier)
export interface RoutePayload {
  name: string;
  groups: Group[];
  waypoints: Array<{
    lat: number;
    lng: number;
    label: string;
    order: number;
    type: TypeOfPoint;
    groupId: string;
  }>;
}
