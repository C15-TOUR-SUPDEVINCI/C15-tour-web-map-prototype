import type { Itinerary } from '../domain';
import { toApiPointType } from '../domain';
import type { RouteType, DifficultyLevel } from '../domain/waypoint.types';
import { API_URL } from '../config';

const BASE_URL = API_URL;

type ApiEventPayload = {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    maxParticipants: number;
    organizerId: string;
};

type ApiRoutePayload = {
    eventId: string;
    name: string;
    description: string;
    routeType: RouteType;
    difficultyLevel: DifficultyLevel;
    totalDistanceKm: number;
    estimatedDurationMinutes: number;
};

type ApiPointPayload = {
    routeId: string;
    type: ReturnType<typeof toApiPointType>;
    order: number;
    latitude: number;
    longitude: number;
    name: string;
    address: string;
    description: string;
    pauseDurationMinutes: number;
};

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
export async function createEvent(token: string, data: ApiEventPayload) {
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
export async function createRoute(token: string, data: ApiRoutePayload) {
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
export async function createPoint(token: string, data: ApiPointPayload) {
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
    const eventPayload: ApiEventPayload = {
        title: itinerary.name || "Nouvel Itinéraire",
        description: itinerary.description || "",
        startDate: itinerary.startDate || new Date().toISOString(),
        endDate: itinerary.endDate || new Date(Date.now() + 86400000).toISOString(), // +24h par défaut
        maxParticipants: itinerary.maxParticipants || 50,
        organizerId: userId // Requis par l'API !
    };

    const createdEvent = await createEvent(token, eventPayload);
    const eventId: string = createdEvent.id || createdEvent._id;

    if (!eventId) {
        throw new Error("L'API n'a pas renvoyé l'ID de l'événement créé.");
    }

    for (const group of itinerary.groups) {
        const routePayload: ApiRoutePayload = {
            eventId: eventId,
            name: group.name || "Route sans nom",
            description: group.description || "",
            routeType: group.routeType || "MIXTE",
            difficultyLevel: group.difficultyLevel || "MOYEN",
            totalDistanceKm: 0, // Optionnel ou à calculer si tu as la donnée dans le store plus tard
            estimatedDurationMinutes: 0 // Optionnel
        };

        const createdRoute = await createRoute(token, routePayload);
        const routeId: string = createdRoute.id || createdRoute._id;

        if (!routeId) continue;

        const sortedWaypoints = itinerary.waypoints
            .filter(wp => wp.groupId === group.id)
            .sort((a, b) => a.order - b.order);

        await Promise.all(
            sortedWaypoints.map((wp, index) => {
                const pointPayload: ApiPointPayload = {
                    routeId,
                    type: toApiPointType(wp.type),
                    order: index + 1,
                    latitude: wp.lat,
                    longitude: wp.lng,
                    name: wp.label || 'Point sans nom',
                    address: wp.address || '',
                    description: wp.description || '',
                    pauseDurationMinutes: wp.pauseDurationMinutes || 0,
                };
                return createPoint(token, pointPayload);
            })
        );
    }

    return eventId;
}
