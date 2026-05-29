// Rassemble tous les types du domaine pour simplifier les imports
export type { Waypoint, Group, TypeOfPoint, DifficultyLevel, RouteType } from './waypoint.types';
export { toApiPointType } from './waypoint.types';
export type { Itinerary } from './itinerary.types';
export type { Route, RoutePayload } from './route.types';
export type { GeocodingResult } from './geocoding.types';
export type { MapConfig } from './map.types';
export type * from './api.types';
export * from './constants';
