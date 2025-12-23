/**
 * Types relatifs aux waypoints (points d'étape)
 */

/**
 * Représente un point d'étape (waypoint) dans le trajet
 */
export interface Waypoint {
  /** Identifiant unique du waypoint */
  id: string;
  /** Latitude (coordonnée géographique) */
  lat: number;
  /** Longitude (coordonnée géographique) */
  lng: number;
  /** Label/adresse du waypoint */
  label: string;
  /** Ordre dans le trajet (1-indexed) */
  order: number;
}
