// Service de calcul d'itinéraire via l'API OSRM

import type { Waypoint } from '../domain/waypoint.types';
import type { RouteCoordinate } from '../domain/itinerary.types';

type OSRMCoordinate = [number, number]; // [lng, lat] (inversé par rapport à Leaflet)

interface OSRMLeg {
  distance: number;
  duration: number;
}

interface OSRMRoute {
  distance: number;
  duration: number;
  geometry: {
    coordinates: OSRMCoordinate[];
  };
  legs: OSRMLeg[];
}

interface OSRMWaypoint {
  waypoint_index: number;
}

interface OSRMResponse {
  code?: string;
  routes?: OSRMRoute[];
  waypoints?: OSRMWaypoint[];
}

// Ce que renvoie le calcul de route
export interface RouteResult {
  coordinates: RouteCoordinate[]; // tracé complet [lat, lng][]
  distance: number; // en mètres
  duration: number; // en secondes
  legs: { distance: number; duration: number }[];
  waypointOrder?: number[]; // rempli seulement si on optimise l'ordre
}

export interface RouteOptions {
  optimize?: boolean; // réorganiser les points pour le trajet le plus court
  algorithm?: 'fastest' | 'shortest';
}

// Serveur OSRM public (démo) — en prod il faudra notre propre instance
const OSRM_BASE_URL = 'https://router.project-osrm.org';

// Trouve pour chaque waypoint l'index correspondant dans les coordonnées calculées par OSRM
export function findWaypointIndices(routeCoords: RouteCoordinate[], wps: Waypoint[]): number[] {
  const indices: number[] = [];
  let searchStart = 0;

  for (let i = 0; i < wps.length; i++) {
    const wp = wps[i];
    let minDistance = Infinity;
    let bestIdx = searchStart;

    // Recherche de l'index le plus proche en maintenant l'ordre
    for (let j = searchStart; j < routeCoords.length; j++) {
      const coord = routeCoords[j];
      const dLat = coord[0] - wp.lat;
      const dLng = coord[1] - wp.lng;
      const dist = dLat * dLat + dLng * dLng;

      if (dist < minDistance) {
        minDistance = dist;
        bestIdx = j;
      }
    }

    indices.push(bestIdx);
    searchStart = bestIdx;
  }

  return indices;
}

export function getWaypointPosition(waypoint: Waypoint): RouteCoordinate {
  return [waypoint.lat, waypoint.lng];
}

export function buildLegCoordinates(
  routeCoordinates: RouteCoordinate[],
  startIndex: number,
  endIndex: number,
  startWaypoint: Waypoint,
  endWaypoint: Waypoint
) {
  const start = Math.min(startIndex, endIndex);
  const end = Math.max(startIndex, endIndex);
  const legCoords = routeCoordinates.slice(start, end + 1);

  if (legCoords.length >= 2) {
    return legCoords;
  }

  return [getWaypointPosition(startWaypoint), getWaypointPosition(endWaypoint)];
}

// Lance le calcul de route entre les waypoints donnés
export async function calculateRoute(
  waypoints: Waypoint[],
  options: RouteOptions = {}
): Promise<RouteResult | null> {
  if (waypoints.length < 2) {
    return null;
  }

  const optimize = options.optimize ?? false;

  try {
    // OSRM attend [lng, lat], Leaflet utilise [lat, lng]
    const coordinates: OSRMCoordinate[] = waypoints.map((wp) => [
      wp.lng,
      wp.lat,
    ]);

    const coordinatesString = coordinates
      .map((coord) => `${coord[0]},${coord[1]}`)
      .join(';');

    const params = new URLSearchParams({
      overview: 'full',
      geometries: 'geojson',
      annotations: 'true',
    });

    // En mode optimisation on passe par l'endpoint "trip" au lieu de "route"
    let endpoint = 'route';
    if (optimize && waypoints.length > 2) {
      endpoint = 'trip';
      params.set('source', 'first');
      params.set('destination', 'last');
      params.set('roundtrip', 'false');
    }

    const url = `${OSRM_BASE_URL}/${endpoint}/v1/driving/${coordinatesString}?${params.toString()}`;

    console.log('OSRM Request:', { endpoint, optimize, waypointsCount: waypoints.length });

    const response = await fetch(url);

    if (!response.ok) {
      console.error('OSRM API error:', response.statusText);
      return null;
    }

    const data = await response.json() as OSRMResponse;

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      console.error('No route found');
      return null;
    }

    const route = data.routes[0];

    // On remet les coordonnées dans le bon sens pour Leaflet
    const routeCoordinates: RouteCoordinate[] =
      route.geometry.coordinates.map((coord) => [coord[1], coord[0]]);

    const result: RouteResult = {
      coordinates: routeCoordinates,
      distance: route.distance,
      duration: route.duration,
      legs: route.legs.map((leg) => ({
        distance: leg.distance,
        duration: leg.duration,
      })),
    };

    // Récupère l'ordre optimisé si dispo
    if (optimize && data.waypoints) {
      result.waypointOrder = data.waypoints.map((wp) => wp.waypoint_index);
      console.log('Optimized waypoint order:', result.waypointOrder);
    }

    return result;
  } catch (error) {
    console.error('Error calculating route:', error);
    return null;
  }
}

// Affiche la distance en km ou m
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

// Affiche la durée en heures + minutes
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
}
