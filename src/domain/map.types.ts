/**
 * Types relatifs à la configuration de la carte
 */

/**
 * Configuration de la carte
 */
export interface MapConfig {
  /** Centre de la carte [lat, lng] */
  center: [number, number];
  /** Niveau de zoom initial */
  zoom: number;
  /** Zoom minimum */
  minZoom: number;
  /** Zoom maximum */
  maxZoom: number;
}
