/**
 * Composant pour afficher les marqueurs des waypoints sur la carte
 */

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Waypoint, TypeOfPoint } from '../../domain/waypoint.types';
import { WAYPOINT_COLORS } from '../../domain/constants';

/**
 * Props du composant MapMarkers
 */
interface MapMarkersProps {
  waypoints: Waypoint[];
}

/**
 * Icône personnalisée pour les marqueurs
 */
const createCustomIcon = (order: number, type: TypeOfPoint) => {
  return L.divIcon({
    className: 'custom-marker', 
    html: `
      <div style="
        background-color: ${WAYPOINT_COLORS[type]};
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        <span style="transform: rotate(45deg); font-weight: bold; font-size: 14px;">
          ${order}
        </span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

/**
 * MapMarkers - Affiche tous les marqueurs des waypoints
 */
export function MapMarkers({ waypoints }: MapMarkersProps) {
  return (
    <>
      {waypoints.map((waypoint) => (
        <Marker
          key={waypoint.id}
          position={[waypoint.lat, waypoint.lng]}
          icon={createCustomIcon(waypoint.order, waypoint.type)}
        >
          <Popup>
            <div style={{ minWidth: '150px' }}>
              <strong>Étape {waypoint.order}</strong>
              <br />
              {waypoint.label}
              <br />
              <small style={{ color: '#666' }}>
                {waypoint.lat.toFixed(5)}, {waypoint.lng.toFixed(5)}
              </small>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
