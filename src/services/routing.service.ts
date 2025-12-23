/**
 * Service de calcul d'itinéraire avec OSRM
 */

import type { Waypoint } from '../domain/waypoint.types';

/**
 * Coordonnées [longitude, latitude] pour OSRM
 */
type OSRMCoordinate = [number, number];

/**
 * Résultat du routing OSRM
 */
export interface RouteResult {
  /** Coordonnées de la route [lat, lng][] */
  coordinates: [number, number][];
  /** Distance totale en mètres */
  distance: number;
  /** Durée totale en secondes */
  duration: number;
  /** Ordre optimisé des waypoints (si optimisation activée) */
  waypointOrder?: number[];
}

/**
 * Options de calcul de route
 */
export interface RouteOptions {
  /** Optimiser l'ordre des waypoints pour minimiser la distance */
  optimize?: boolean;
  /** Algorithme : 'fastest' (par défaut) ou 'shortest' */
  algorithm?: 'fastest' | 'shortest';
}

/**
 * URL du serveur OSRM public (démo)
 * Pour production, utilisez votre propre instance
 */
const OSRM_BASE_URL = 'https://router.project-osrm.org';

/**
 * Calcule un itinéraire entre plusieurs waypoints
 * @param waypoints Liste ordonnée des waypoints
 * @param options Options de calcul (optimisation, algorithme)
 * @returns Résultat avec coordonnées de la route, distance et durée
 */
export async function calculateRoute(
  waypoints: Waypoint[],
  options: RouteOptions = {}
): Promise<RouteResult | null> {
  if (waypoints.length < 2) {
    return null;
  }

  const { optimize = false, algorithm = 'fastest' } = options;

  try {
    // Conversion des waypoints en coordonnées OSRM (lng, lat)
    const coordinates: OSRMCoordinate[] = waypoints.map((wp) => [
      wp.lng,
      wp.lat,
    ]);

    // Construction de l'URL OSRM
    const coordinatesString = coordinates
      .map((coord) => `${coord[0]},${coord[1]}`)
      .join(';');

    // Paramètres de l'URL
    const params = new URLSearchParams({
      overview: 'full',
      geometries: 'geojson',
      // Annotations pour plus de détails
      annotations: 'true',
    });

    // Si optimisation demandée, on utilise l'API trip au lieu de route
    let endpoint = 'route';
    if (optimize && waypoints.length > 2) {
      endpoint = 'trip';
      params.set('source', 'first'); // Le premier waypoint reste fixe
      params.set('destination', 'last'); // Le dernier waypoint reste fixe
      params.set('roundtrip', 'false'); // Pas de retour au point de départ
    }

    const url = `${OSRM_BASE_URL}/${endpoint}/v1/driving/${coordinatesString}?${params.toString()}`;

    console.log('OSRM Request:', { endpoint, optimize, waypointsCount: waypoints.length });

    // Appel à l'API OSRM
    const response = await fetch(url);

    if (!response.ok) {
      console.error('OSRM API error:', response.statusText);
      return null;
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      console.error('No route found');
      return null;
    }

    const route = data.routes[0];

    // Conversion des coordonnées GeoJSON (lng, lat) en Leaflet (lat, lng)
    const routeCoordinates: [number, number][] =
      route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);

    const result: RouteResult = {
      coordinates: routeCoordinates,
      distance: route.distance, // en mètres
      duration: route.duration, // en secondes
    };

    // Si optimisation, récupérer l'ordre des waypoints
    if (optimize && data.waypoints) {
      result.waypointOrder = data.waypoints.map((wp: any) => wp.waypoint_index);
      console.log('Optimized waypoint order:', result.waypointOrder);
    }

    return result;
  } catch (error) {
    console.error('Error calculating route:', error);
    return null;
  }
}

/**
 * Formate la distance en km ou m
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Formate la durée en heures/minutes
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
}
