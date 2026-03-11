// Tracé du trajet sur la carte (polyline calculée par OSRM)

import { Polyline } from 'react-leaflet';
import { ROUTE_COLORS } from '../../domain/constants';
import { useRouteStore } from '../../store/useRouteStore';

export function RoutePolyline() {
  const routeCoordinates = useRouteStore((state) => state.routeCoordinates);

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
