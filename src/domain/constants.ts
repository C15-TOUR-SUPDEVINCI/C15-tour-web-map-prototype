/**
 * Constantes de l'application
 */

import type { MapConfig } from './map.types';

/**
 * Coordonnées de Nantes (centre par défaut)
 */
export const NANTES_COORDS: [number, number] = [47.218371, -1.553621];

/**
 * Configuration par défaut de la carte
 */
export const DEFAULT_MAP_CONFIG: MapConfig = {
  center: NANTES_COORDS,
  zoom: 13,
  minZoom: 3,
  maxZoom: 18,
};

/**
 * URL des tiles OpenStreetMap
 */
export const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

/**
 * Attribution pour OpenStreetMap
 */
export const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/**
 * Configuration du geocoder (Nominatim)
 */
export const GEOCODER_CONFIG = {
  placeholder: 'Rechercher une adresse...',
  defaultMarkGeocode: false, // On gère manuellement l'ajout de waypoint
  geocoder: undefined, // Sera configuré dans le composant
};

/**
 * Couleurs pour la polyline du trajet
 */
export const ROUTE_COLORS = {
  primary: '#3b82f6', // Bleu
  hover: '#2563eb',   // Bleu foncé
};

/**
 * Messages utilisateur
 */
export const MESSAGES = {
  noWaypoints: 'Aucune étape ajoutée. Recherchez une adresse ou cliquez sur la carte.',
  routeEmpty: 'Le trajet est vide',
  routeCreated: 'Trajet créé avec succès',
  waypointAdded: 'Étape ajoutée',
  waypointRemoved: 'Étape supprimée',
  routeCleared: 'Trajet vidé',
};

export const WAYPOINT_COLORS = {
  PAUSE: '#3b82f6', // Bleu
  PASSAGE: '#10b981', // Vert
  EXTREMITY: '#ef4444', // Rouge
  USER: '#f59e0b', // Orange
};
