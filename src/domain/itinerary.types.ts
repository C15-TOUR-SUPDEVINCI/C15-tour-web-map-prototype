import type { Waypoint, Group } from './waypoint.types';

// Un itinéraire sauvegardé (contient tout ce qu'il faut pour le restaurer)
export interface Itinerary {
    id: string;
    name: string;
    lastModified: string; // date ISO
    waypoints: Waypoint[];
    groups: Group[];
}
