// Affiche la distance et la durée totale du trajet

import { useRouteStore } from '../../store/useRouteStore';
import { formatDistance, formatDuration } from '../../services/routing.service';
import './RouteStats.css';

export function RouteStats() {
  const routeDistance = useRouteStore((state) => state.routeDistance);
  const routeDuration = useRouteStore((state) => state.routeDuration);
  const waypointsCount = useRouteStore((state) => state.waypoints.length);

  if (waypointsCount < 2 || !routeDistance || !routeDuration) {
    return null;
  }

  return (
    <div className="route-stats">
      <div className="stat-header">TOTAL</div>

      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-value">{formatDistance(routeDistance)}</span>
          <span className="stat-label">Distance</span>
        </div>

        <div className="stat-item">
          <span className="stat-value">{formatDuration(routeDuration)}</span>
          <span className="stat-label">Durée est.</span>
        </div>
      </div>
    </div>
  );
}
