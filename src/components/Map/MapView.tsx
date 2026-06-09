import { useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents, useMap, ZoomControl } from 'react-leaflet';
import { useRouteStore } from '../../store/useRouteStore';
import { DEFAULT_MAP_CONFIG, OSM_TILE_URL, OSM_ATTRIBUTION } from '../../domain/constants';
import { SearchControl } from './SearchControl';
import { MapMarkers } from './MapMarkers';
import { RoutePolyline } from './RoutePolyline';
import { RouteCalculator } from './RouteCalculator';
import { reverseGeocode } from '../../services/geocoding.service';
import './MapView.css';

// Force Leaflet à recalculer sa taille après le rendu (sinon la carte peut bugger)
function MapInvalidator() {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

// Gère le clic sur la carte pour ajouter un waypoint
function MapClickHandler() {
  const addWaypoint = useRouteStore((state) => state.addWaypoint);
  const updateWaypointAddress = useRouteStore((state) => state.updateWaypointAddress);

  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      addWaypoint(lat, lng, `Chargement de l'adresse...`);
      const newId = useRouteStore.getState().waypoints.at(-1)?.id;

      if (newId) {
        reverseGeocode(lat, lng).then(address => {
          updateWaypointAddress(newId, address);
        });
      }
    },
  });

  return null;
}

// Gère le centrage automatique de la carte (Fly-To) lorsqu'un waypoint est ciblé dans la liste
function MapFocusHandler() {
  const map = useMap();
  const focusedCoordinate = useRouteStore((state) => state.focusedCoordinate);
  const focusCoordinate = useRouteStore((state) => state.focusCoordinate);

  useEffect(() => {
    if (focusedCoordinate) {
      map.flyTo(focusedCoordinate, 16, {
        animate: true,
        duration: 1.2,
      });
      // Réinitialise la coordonnée pour pouvoir recentrer si on reclique sur le même point
      focusCoordinate(null);
    }
  }, [focusedCoordinate, map, focusCoordinate]);

  return null;
}

// Carte Leaflet avec tous les contrôles et couches
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
        zoomControl={false}
      >
        <TileLayer
          attribution={OSM_ATTRIBUTION}
          url={OSM_TILE_URL}
        />

        <MapInvalidator />
        <MapFocusHandler />
        <ZoomControl position="topright" />
        <SearchControl />
        <MapClickHandler />
        <RouteCalculator />
        <MapMarkers waypoints={waypoints} />
        <RoutePolyline />
      </MapContainer>
    </div>
  );
}
