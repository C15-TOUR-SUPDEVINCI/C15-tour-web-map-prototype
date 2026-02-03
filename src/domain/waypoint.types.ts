/**
 * Types relatifs aux waypoints (points d'étape)
 */


export type TypeOfPoint = "PAUSE" | "PASSAGE" | "EXTREMITY" | "USER";

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
  /** Type du waypoint */
  type: TypeOfPoint;
}
