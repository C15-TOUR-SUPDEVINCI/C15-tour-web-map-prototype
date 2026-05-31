// Tracé du trajet sur la carte (polyline calculée par OSRM)

import { Polyline } from 'react-leaflet';
import { useRouteStore } from '../../store/useRouteStore';
import type { Waypoint } from '../../domain/waypoint.types';

// Trouve pour chaque waypoint l'index correspondant dans les coordonnées calculées par OSRM
function findWaypointIndices(routeCoords: [number, number][], wps: Waypoint[]): number[] {
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
    const legCoords = routeCoordinates.slice(startIdx, endIdx + 1);

    if (legCoords.length < 2) continue;

    const inSameGroup = wp1.groupId === wp2.groupId;
    // Les liaisons inter-groupes (transition) reprennent le rose signature de base pour lier l'ensemble
    const color = inSameGroup ? (groupColors[wp1.groupId] || '#bb487c') : '#bb487c';

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

  return <>{polylines}</>;
}
