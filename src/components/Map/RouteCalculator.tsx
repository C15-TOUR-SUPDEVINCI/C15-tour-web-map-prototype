/**
 * Composant pour calculer automatiquement la route quand les waypoints changent
 */

import { useEffect } from 'react';
import { useRouteStore } from '../../store/useRouteStore';
import { calculateRoute } from '../../services/routing.service';

/**
 * RouteCalculator - Calcule la route en arrière-plan
 * Ce composant n'affiche rien, il met juste à jour le store
 */
export function RouteCalculator() {
  const waypoints = useRouteStore((state) => state.waypoints);

  useEffect(() => {
    const computeRoute = async () => {
      if (waypoints.length < 2) {
        // Pas assez de waypoints, on réinitialise
        useRouteStore.setState({
          routeCoordinates: [],
          routeDistance: null,
          routeDuration: null,
        });
        return;
      }

      // Calcul de la route avec OSRM (sans optimisation)
      const result = await calculateRoute(waypoints);

      if (result) {
        useRouteStore.setState({
          routeCoordinates: result.coordinates,
          routeDistance: result.distance,
          routeDuration: result.duration,
        });
      } else {
        // Fallback : ligne droite si OSRM échoue
        const straightLine: [number, number][] = waypoints.map((wp) => [
          wp.lat,
          wp.lng,
        ]);
        useRouteStore.setState({
          routeCoordinates: straightLine,
          routeDistance: null,
          routeDuration: null,
        });
      }
    };

    computeRoute();
  }, [waypoints]);

  return null;
}
