// Affiche la distance et la durée totale du trajet

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useRouteStore } from '../../store/useRouteStore';
import { formatDistance, formatDuration } from '../../services/routing.service';
import './RouteStats.css';

export function RouteStats() {
  const routeDistance = useRouteStore((state) => state.routeDistance);
  const routeDuration = useRouteStore((state) => state.routeDuration);
  const waypointsCount = useRouteStore((state) => state.waypoints.length);
  const shareCode = useRouteStore((state) => state.shareCode);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyShareCode = () => {
    if (!shareCode) return;
    void navigator.clipboard.writeText(shareCode).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

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

        {/* Badge share code — visible uniquement sur mobile, intégré dans la barre */}
        {shareCode && (
          <button
            className={`route-stats-share-badge${isCopied ? ' route-stats-share-badge--copied' : ''}`}
            onClick={handleCopyShareCode}
            title={isCopied ? 'Copié !' : 'Cliquer pour copier le code de partage'}
          >
            {isCopied ? <Check size={12} /> : <Copy size={12} />}
            {shareCode}
          </button>
        )}
      </div>
    </div>
  );
}
