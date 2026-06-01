import type { MapConfig } from './map.types';
import type { Group } from './waypoint.types';

export const ONE_DAY_MS = 86400000;
export const AUTOSAVE_DELAY_MS = 2000;
export const DEFAULT_MAX_PARTICIPANTS = 50;
export const DEFAULT_GROUP_ID = 'default-group';

export const createDefaultGroup = (): Group => ({
  id: DEFAULT_GROUP_ID,
  name: 'Groupe par defaut',
  routeType: 'MIXTE',
  difficultyLevel: 'MOYEN',
});

export function normalizeMaxParticipants(value: number | undefined, fallback = DEFAULT_MAX_PARTICIPANTS) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.trunc(value as number));
}

// Centre par défaut : Nantes
export const NANTES_COORDS: [number, number] = [47.218371, -1.553621];

// Config par défaut de la carte
export const DEFAULT_MAP_CONFIG: MapConfig = {
  center: NANTES_COORDS,
  zoom: 13,
  minZoom: 3,
  maxZoom: 18,
};

export const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Config du geocoder Nominatim
export const GEOCODER_CONFIG = {
  placeholder: 'Rechercher une adresse...',
  defaultMarkGeocode: false, // on gère l'ajout de waypoint nous-mêmes
  geocoder: undefined, // configuré dans le composant
};

// Couleurs du tracé sur la carte
export const ROUTE_COLORS = {
  primary: '#bb487c',
  hover: '#8e355d',
};

// Messages affichés à l'utilisateur
export const MESSAGES = {
  noWaypoints: 'Aucune étape ajoutée. Recherchez une adresse ou cliquez sur la carte.',
  routeEmpty: 'Le trajet est vide',
  routeCreated: 'Trajet créé avec succès',
  waypointAdded: 'Étape ajoutée',
  waypointRemoved: 'Étape supprimée',
  routeCleared: 'Trajet vidé',
};

// Couleurs des marqueurs selon le type de waypoint
export const WAYPOINT_COLORS = {
  PAUSE: '#bb487c',
  PASSAGE: '#bb487c',
  EXTREMITY: '#8e355d', // plus foncé pour départ/arrivée
  USER: '#d16b9a',
  INTERET: '#facc15', // Jaune/Or pour les points d'intérêt
};
