/**
 * Composant de recherche d'adresse (Geocoding)
 * Utilise leaflet-control-geocoder avec Nominatim
 */

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-control-geocoder';
import { useRouteStore } from '../../store/useRouteStore';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';

/**
 * SearchControl - Barre de recherche d'adresse intégrée à la carte
 */
export function SearchControl() {
  const map = useMap();
  const addWaypoint = useRouteStore((state) => state.addWaypoint);

  useEffect(() => {
    // Configuration du geocoder Nominatim
    const geocoder = (L.Control as any).Geocoder.photon({
      serviceUrl: 'https://photon.komoot.io/api/',
      geocodingQueryParams: {
        lang: 'fr',
        limit: 5,
      },
    });

    // Création du contrôle de recherche
    const searchControl = (L.Control as any).geocoder({
      geocoder: geocoder,
      defaultMarkGeocode: false, // On gère manuellement l'ajout de waypoint
      placeholder: 'Rechercher une adresse...',
      errorMessage: 'Adresse non trouvée',
      showResultIcons: true,
      suggestMinLength: 3,
      suggestTimeout: 250,
      suggest: true,
      position: 'topright',
    });

    // Ajout du contrôle à la carte
    searchControl.addTo(map);

    // Gestion de l'événement de sélection d'un résultat
    searchControl.on('markgeocode', (e: any) => {
      const { center, name } = e.geocode;
      const { lat, lng } = center;

      // Ajout du waypoint au store
      addWaypoint(lat, lng, name || 'Adresse');

      // Centrer la carte sur le résultat
      map.setView(center, 15);
    });

    // Nettoyage lors du démontage
    return () => {
      map.removeControl(searchControl);
    };
  }, [map, addWaypoint]);

  return null;
}
