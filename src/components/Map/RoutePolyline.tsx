/**
 * Composant pour afficher la polyline du trajet entre les waypoints
 */

import { Polyline } from 'react-leaflet';
import { ROUTE_COLORS } from '../../domain/constants';
import type { Waypoint } from '../../domain/waypoint.types';

/**
 * Props du composant RoutePolyline
 */
interface RoutePolylineProps {
  waypoints: Waypoint[];
}

/**
 * RoutePolyline - Affiche le trajet entre les waypoints
 */
export function RoutePolyline({ waypoints }: RoutePolylineProps) {
  // Si moins de 2 waypoints, pas de trajet à afficher
  if (waypoints.length < 2) {
    return null;
  }

  // Conversion des waypoints en positions [lat, lng]
  const positions: [number, number][] = waypoints.map((wp) => [wp.lat, wp.lng]);

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color: ROUTE_COLORS.primary,
        weight: 4,
        opacity: 0.7,
        lineCap: 'round',
        lineJoin: 'round',
      }}
    />
  );
}
