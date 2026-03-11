// Recalcule automatiquement le tracé quand les waypoints changent
// Ce composant ne rend rien à l'écran, il met juste à jour le store

import { useEffect } from 'react';
import { useRouteStore } from '../../store/useRouteStore';
import { calculateRoute } from '../../services/routing.service';

export function RouteCalculator() {
  const waypoints = useRouteStore((state) => state.waypoints);

  useEffect(() => {
    const computeRoute = async () => {
      if (waypoints.length < 2) {
        useRouteStore.setState({
          routeCoordinates: [],
          routeDistance: null,
          routeDuration: null,
        });
        return;
      }

      const result = await calculateRoute(waypoints);

      if (result) {
        useRouteStore.setState({
          routeCoordinates: result.coordinates,
          routeDistance: result.distance,
          routeDuration: result.duration,
          routeLegs: result.legs,
        });
      } else {
        // Si OSRM ne répond pas, on trace juste des lignes droites
        const straightLine: [number, number][] = waypoints.map((wp) => [
          wp.lat,
          wp.lng,
        ]);
        useRouteStore.setState({
          routeCoordinates: straightLine,
          routeDistance: null,
          routeDuration: null,
          routeLegs: [],
        });
      }
    };

    computeRoute();
  }, [waypoints]);

  return null;
}
