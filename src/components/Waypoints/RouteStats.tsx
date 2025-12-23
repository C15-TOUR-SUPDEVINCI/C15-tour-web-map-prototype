/**
 * Composant affichant les statistiques du trajet (distance, durée)
 */

import { MapPin, Clock } from 'lucide-react';
import { useRouteStore } from '../../store/useRouteStore';
import { formatDistance, formatDuration } from '../../services/routing.service';
import './RouteStats.css';

/**
 * RouteStats - Affiche distance et durée du trajet
 */
export function RouteStats() {
  const routeDistance = useRouteStore((state) => state.routeDistance);
  const routeDuration = useRouteStore((state) => state.routeDuration);
  const waypointsCount = useRouteStore((state) => state.waypoints.length);

  if (waypointsCount < 2 || !routeDistance || !routeDuration) {
    return null;
  }

  return (
    <div className="route-stats">
      <div className="stat-item">
        <MapPin size={18} className="stat-icon" />
        <div className="stat-content">
          <span className="stat-label">Distance</span>
          <span className="stat-value">{formatDistance(routeDistance)}</span>
        </div>
      </div>

      <div className="stat-divider" />

      <div className="stat-item">
        <Clock size={18} className="stat-icon" />
        <div className="stat-content">
          <span className="stat-label">Durée estimée</span>
          <span className="stat-value">{formatDuration(routeDuration)}</span>
        </div>
      </div>
    </div>
  );
}
