/**
 * Service pour transformer des coordonnées en adresse postale (Reverse Geocoding)
 * Utilise l'API publique Nominatim d'OpenStreetMap.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      {
        headers: {
          'Accept-Language': 'fr-FR',
          'User-Agent': 'C15-Tour-Web-Map-Prototype'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Erreur lors du géocodage inverse');
    }

    const data = await response.json();
    
    // On privilégie display_name, sinon on construit une adresse courte
    if (data.display_name) {
      return data.display_name;
    }

    const { road, house_number, city, town, village, postcode } = data.address || {};
    const parts = [
      house_number,
      road,
      postcode,
      city || town || village
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(' ') : `Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  } catch (error) {
    console.error('Geocoding error:', error);
    return `Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  }
}
