/**
 * Point d'entrée centralisé pour tous les types du domaine
 * Permet d'importer facilement : import { Waypoint, Route } from '@/domain'
 */

// Waypoints
export type { Waypoint } from './waypoint.types';

// Routes
export type { Route, RoutePayload } from './route.types';

// Geocoding
export type { GeocodingResult } from './geocoding.types';

// Map
export type { MapConfig } from './map.types';

// Constants
export * from './constants';
