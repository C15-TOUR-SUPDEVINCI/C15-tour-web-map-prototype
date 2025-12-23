/**
 * Actions sur le trajet (vider, etc.)
 */

import { Trash2 } from 'lucide-react';
import { useRouteStore } from '../../store/useRouteStore';
import './RouteActions.css';

/**
 * RouteActions - Boutons d'action sur le trajet
 */
export function RouteActions() {
  const waypoints = useRouteStore((state) => state.waypoints);
  const clearWaypoints = useRouteStore((state) => state.clearWaypoints);

  const handleClear = () => {
    if (window.confirm('Voulez-vous vraiment vider le trajet ?')) {
      clearWaypoints();
    }
  };

  return (
    <div className="route-actions">
      <button
        className="clear-button"
        onClick={handleClear}
        disabled={waypoints.length === 0}
      >
        <Trash2 size={18} />
        <span>Vider le trajet</span>
      </button>
    </div>
  );
}
