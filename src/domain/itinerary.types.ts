import type { Waypoint, Group } from './waypoint.types';

// Un itinéraire sauvegardé (contient tout ce qu'il faut pour le restaurer)
// Ces champs correspondent au payload "Event" de l'API backend
export interface Itinerary {
    id: string;

    // Champs de base (déjà existants)
    name: string;           // → "title" dans l'API
    lastModified: string;   // date ISO (gestion locale)

    // Nouveaux champs pour l'API
    description: string;            // description de l'événement
    startDate: string;              // ex: "2024-12-25T10:00:00Z"
    endDate: string;                // ex: "2024-12-25T18:00:00Z"
    maxParticipants: number;        // nombre max de participants

    // Code de partage généré par le back-end
    shareCode?: string;

    // Contenu de l'itinéraire
    waypoints: Waypoint[];
    groups: Group[];
}
