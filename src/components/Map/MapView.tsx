/**
 * Composant principal de la carte Leaflet
 * Gère l'affichage de la carte, les clics, et intègre les sous-composants
 */

import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { useRouteStore } from '../../store/useRouteStore';
import { DEFAULT_MAP_CONFIG, OSM_TILE_URL, OSM_ATTRIBUTION } from '../../domain/constants';
import { SearchControl } from './SearchControl';
import { MapMarkers } from './MapMarkers';
import { RoutePolyline } from './RoutePolyline';
import './MapView.css';

/**
 * Composant interne pour gérer les événements de clic sur la carte
 */
function MapClickHandler() {
  const addWaypoint = useRouteStore((state) => state.addWaypoint);

  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      // Ajout d'un waypoint avec un label générique
      addWaypoint(lat, lng, `Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    },
  });

  return null;
}

/**
 * Composant MapView - Carte interactive Leaflet
 */
export function MapView() {
  const waypoints = useRouteStore((state) => state.waypoints);

  return (
    <div className="map-container">
      <MapContainer
        center={DEFAULT_MAP_CONFIG.center}
        zoom={DEFAULT_MAP_CONFIG.zoom}
        minZoom={DEFAULT_MAP_CONFIG.minZoom}
        maxZoom={DEFAULT_MAP_CONFIG.maxZoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        {/* Tiles OpenStreetMap */}
        <TileLayer
          attribution={OSM_ATTRIBUTION}
          url={OSM_TILE_URL}
        />

        {/* Contrôle de recherche d'adresse */}
        <SearchControl />

        {/* Gestion des clics sur la carte */}
        <MapClickHandler />

        {/* Marqueurs des waypoints */}
        <MapMarkers waypoints={waypoints} />

        {/* Polyline du trajet */}
        <RoutePolyline waypoints={waypoints} />
      </MapContainer>
    </div>
  );
}
