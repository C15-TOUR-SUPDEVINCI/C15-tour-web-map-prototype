/**
 * Composant pour afficher la polyline du trajet calculé par OSRM
 */

import { Polyline } from 'react-leaflet';
import { ROUTE_COLORS } from '../../domain/constants';
import { useRouteStore } from '../../store/useRouteStore';

/**
 * RoutePolyline - Affiche le trajet calculé
 */
export function RoutePolyline() {
  const routeCoordinates = useRouteStore((state) => state.routeCoordinates);

  // Si pas de coordonnées de route, pas de trajet à afficher
  if (routeCoordinates.length < 2) {
    return null;
  }

  return (
    <Polyline
      positions={routeCoordinates}
      pathOptions={{
        color: ROUTE_COLORS.primary,
        weight: 5,
        opacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round',
      }}
    />
  );
}
