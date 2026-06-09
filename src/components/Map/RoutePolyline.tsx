// Tracé du trajet sur la carte (polyline calculée par OSRM)

import { Polyline } from 'react-leaflet';
import { useRouteStore } from '../../store/useRouteStore';
import { buildLegCoordinates, findWaypointIndices } from '../../services/routing.service';

const DEFAULT_ROUTE_COLOR = '#bb487c';

export function RoutePolyline() {
  const routeCoordinates = useRouteStore((state) => state.routeCoordinates);
  const waypoints = useRouteStore((state) => state.waypoints);
  const groupColors = useRouteStore((state) => state.groupColors) || {};

  if (routeCoordinates.length < 2 || waypoints.length < 2) {
    return null;
  }

  // Projection des points pour découper le tracé
  const indices = findWaypointIndices(routeCoordinates, waypoints);
  const polylines: React.ReactNode[] = [];

  for (let i = 0; i < waypoints.length - 1; i++) {
    const wp1 = waypoints[i];
    const wp2 = waypoints[i + 1];

    const startIdx = indices[i];
    const endIdx = indices[i + 1];

    // Extraction de la section de tracé pour cette étape
    const legCoords = buildLegCoordinates(routeCoordinates, startIdx, endIdx, wp1, wp2);

    // La liaison inter-groupes (transition) garde la couleur du premier groupe jusqu'au 1er point de l'autre groupe
    const color = groupColors[wp1.groupId] || DEFAULT_ROUTE_COLOR;

    polylines.push(
      <Polyline
        key={`leg-${i}-${wp1.id}-${wp2.id}`}
        positions={legCoords}
        pathOptions={{
          color,
          weight: 5,
          opacity: 0.8,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
    );
  }

  if (polylines.length === 0) {
    return (
      <Polyline
        positions={routeCoordinates}
        pathOptions={{
          color: DEFAULT_ROUTE_COLOR,
          weight: 5,
          opacity: 0.8,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
    );
  }

  return <>{polylines}</>;
}
