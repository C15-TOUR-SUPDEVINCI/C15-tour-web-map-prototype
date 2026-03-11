// Résultat renvoyé par la recherche d'adresse (Nominatim)
export interface GeocodingResult {
  lat: number;
  lng: number;
  label: string;
  displayName?: string;
}
