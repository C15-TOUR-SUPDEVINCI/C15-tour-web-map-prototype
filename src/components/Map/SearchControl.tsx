// Barre de recherche d'adresse sur la carte (Nominatim via leaflet-control-geocoder)

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { geocoder, geocoders } from 'leaflet-control-geocoder';
import type { Control } from 'leaflet';
import { useRouteStore } from '../../store/useRouteStore';

type GeocodeEvent = {
  geocode?: {
    center: { lat: number; lng: number };
    name?: string;
  };
};

type GeocoderControl = Control & {
  addTo: (map: unknown) => void;
  on: (event: 'markgeocode', handler: (e: GeocodeEvent) => void) => void;
};

export function SearchControl() {
  const map = useMap();
  const addWaypoint = useRouteStore((state) => state.addWaypoint);
  useEffect(() => {
    if (!map) return;

    let searchControl: GeocoderControl | null = null;

    try {
      const nominatimGeocoder = new (geocoders as unknown as { Nominatim: new (o: unknown) => unknown }).Nominatim({
        geocodingQueryParams: {
          countrycodes: 'fr',
          limit: 5,
        },
      }) as { geocode: (q: string) => Promise<unknown[]>; suggest?: (q: string) => Promise<unknown[]> };

      // Nominatim n'implémente pas suggest() → on le branche sur geocode() pour activer l'autocomplétion
      nominatimGeocoder.suggest = (query: string) => nominatimGeocoder.geocode(query);

      searchControl = (geocoder as unknown as (opts: unknown) => GeocoderControl)({
        geocoder: nominatimGeocoder,
        defaultMarkGeocode: false,
        placeholder: 'Rechercher une adresse...',
        errorMessage: 'Adresse non trouvée',
        collapsed: false,
        showResultIcons: true,
        suggestMinLength: 3,
        suggestTimeout: 250,
        position: 'topleft',
      });

      searchControl.addTo(map);

      // Quand l'utilisateur sélectionne un résultat, on l'ajoute comme waypoint
      searchControl.on('markgeocode', (e) => {
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
        } catch {
          // pas grave
        }
      }
    };
  }, [map, addWaypoint]);

  return null;
}
