// Barre de recherche d'adresse sur la carte (Nominatim via leaflet-control-geocoder)

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { geocoder, geocoders } from 'leaflet-control-geocoder';
import { useRouteStore } from '../../store/useRouteStore';

export function SearchControl() {
  const map = useMap();
  const addWaypoint = useRouteStore((state) => state.addWaypoint);

  useEffect(() => {
    if (!map) return;

    let searchControl: any = null;

    try {
      const nominatimGeocoder = new (geocoders as any).Nominatim({
        geocodingQueryParams: {
          countrycodes: 'fr',
          limit: 5,
        },
      });

      searchControl = (geocoder as any)({
        geocoder: nominatimGeocoder,
        defaultMarkGeocode: false,
        placeholder: 'Rechercher une adresse...',
        errorMessage: 'Adresse non trouvée',
        showResultIcons: true,
        suggestMinLength: 3,
        suggestTimeout: 250,
        position: 'topright',
      });

      searchControl.addTo(map);

      // Quand l'utilisateur sélectionne un résultat, on l'ajoute comme waypoint
      searchControl.on('markgeocode', (e: any) => {
        if (e && e.geocode) {
          const { center, name } = e.geocode;
          const { lat, lng } = center;
          addWaypoint(lat, lng, name || 'Adresse');
          map.setView(center, 15);
        }
      });
    } catch (err) {
      console.error('Failed to initialize SearchControl:', err);
    }

    return () => {
      if (map && searchControl) {
        try {
          map.removeControl(searchControl);
        } catch (e) {
          // pas grave
        }
      }
    };
  }, [map, addWaypoint]);

  return null;
}
