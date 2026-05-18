import type { Itinerary } from '../domain';
import { toApiPointType } from '../domain';

const BASE_URL = 'https://c15-tour-back.vercel.app';

// Helper pour gérer les réponses d'API
async function handleResponse(response: Response) {
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur API (${response.status}): ${errorText}`);
    }
    // L'API peut parfois ne renvoyer aucun contenu (ex: 201 Created sans body)
    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

// 1. Créer un Événement
export async function createEvent(token: string, data: any) {
    const res = await fetch(`${BASE_URL}/api/events`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });
    return handleResponse(res);
}

// 2. Créer une Route (Groupe)
export async function createRoute(token: string, data: any) {
    const res = await fetch(`${BASE_URL}/api/routes`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });
    return handleResponse(res);
}

// 3. Créer un Point (Waypoint)
export async function createPoint(token: string, data: any) {
    const res = await fetch(`${BASE_URL}/api/points`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });
    return handleResponse(res);
}

// 4. Fonction principale : Publier un itinéraire complet
export async function publishItinerary(token: string, itinerary: Itinerary, userId: string) {
    console.log("Début de la publication de", itinerary.name);

    // ETAPE A : Créer l'événement (L'itinéraire global)
    // On mappe nos données locales vers ce que l'API attend
    const eventPayload = {
        title: itinerary.name || "Nouvel Itinéraire",
        description: itinerary.description || "",
        startDate: itinerary.startDate || new Date().toISOString(),
        endDate: itinerary.endDate || new Date(Date.now() + 86400000).toISOString(), // +24h par défaut
        maxParticipants: itinerary.maxParticipants || 50,
        organizerId: userId // Requis par l'API !
    };

    const createdEvent = await createEvent(token, eventPayload);
    const eventId = createdEvent.id || createdEvent._id; // Adapter selon ce que le back renvoie exactement

    if (!eventId) {
        throw new Error("L'API n'a pas renvoyé l'ID de l'événement créé.");
    }

    console.log("Événement créé avec l'ID:", eventId);

    // ETAPE B : Traiter chaque Groupe comme une "Route" backend
    for (const group of itinerary.groups) {
        const routePayload = {
            eventId: eventId,
            name: group.name || "Route sans nom",
            description: group.description || "",
            routeType: group.routeType || "MIXTE",
            difficultyLevel: group.difficultyLevel || "MOYEN",
            totalDistanceKm: 0, // Optionnel ou à calculer si tu as la donnée dans le store plus tard
            estimatedDurationMinutes: 0 // Optionnel
        };

        const createdRoute = await createRoute(token, routePayload);
        const routeId = createdRoute.id || createdRoute._id;

        if (!routeId) continue;
        console.log(`Route ${group.name} créée avec l'ID:`, routeId);

        // ETAPE C : Assigner les points de ce groupe
        // On filtre les waypoints pour ne garder que ceux de ce groupe
        const groupWaypoints = itinerary.waypoints.filter(wp => wp.groupId === group.id);

        // On s'assure qu'ils sont envoyés dans le bon ordre (si besoin)
        const sortedWaypoints = [...groupWaypoints].sort((a, b) => a.order - b.order);

        for (const [index, wp] of sortedWaypoints.entries()) {
            const pointPayload = {
                routeId: routeId,
                type: toApiPointType(wp.type), // Convertit EXTREMITY en PASSAGE
                order: index + 1,
                latitude: wp.lat,
                longitude: wp.lng,
                name: wp.label || "Point sans nom",
                address: wp.address || "",
                description: wp.description || "",
                pauseDurationMinutes: wp.pauseDurationMinutes || 0
            };

            await createPoint(token, pointPayload);
        }
        console.log(`  -> ${sortedWaypoints.length} points créés pour cette route.`);
    }

    console.log("✅ Publication terminée avec succès !");
    return eventId;
}
