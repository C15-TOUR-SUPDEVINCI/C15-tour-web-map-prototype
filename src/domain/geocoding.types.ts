/**
 * Types relatifs au géocodage (recherche d'adresses)
 */

/**
 * Résultat d'une recherche de géocodage
 */
export interface GeocodingResult {
  /** Latitude du résultat */
  lat: number;
  /** Longitude du résultat */
  lng: number;
  /** Label/adresse formatée */
  label: string;
  /** Nom affiché */
  displayName?: string;
}
