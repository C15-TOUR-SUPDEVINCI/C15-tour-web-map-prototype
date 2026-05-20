// Recalcule automatiquement le tracé quand les waypoints changent
// Ce composant ne rend rien à l'écran, il met juste à jour le store

import { useEffect } from 'react';
import { useRouteStore } from '../../store/useRouteStore';
import { calculateRoute } from '../../services/routing.service';

export function RouteCalculator() {
  const coordsKey = useRouteStore((state) =>
    state.waypoints.map((wp) => `${wp.lat},${wp.lng}`).join('|')
  );

  useEffect(() => {
    const timer = setTimeout(async () => {
      const { waypoints } = useRouteStore.getState();

      if (waypoints.length < 2) {
        useRouteStore.setState({ routeCoordinates: [], routeDistance: null, routeDuration: null });
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
        useRouteStore.setState({
          routeCoordinates: waypoints.map((wp) => [wp.lat, wp.lng] as [number, number]),
          routeDistance: null,
          routeDuration: null,
          routeLegs: [],
        });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [coordsKey]);

  return null;
}
