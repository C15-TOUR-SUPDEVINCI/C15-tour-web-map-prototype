import type {
    ApiEventPayload,
    ApiPointPayload,
    ApiRoutePayload,
    Itinerary,
} from '../domain';
import { toApiPointType } from '../domain';
import { createEvent, deleteEvent } from './events.service';
import { deleteParticipation, getParticipations } from './participation.service';
import { createPoint, deletePoint, getPoints } from './points.service';
import { createRoute, deleteRoute, getRoutes } from './routes.service';
import { deleteSegment, getSegments } from './segments.service';

type ApiEntityId = {
    id?: string;
    _id?: string;
};

function getEntityId(entity: ApiEntityId) {
    return entity.id ?? entity._id;
}

export async function publishItinerary(itinerary: Itinerary, userId: string) {
    const eventPayload: ApiEventPayload = {
        title: itinerary.name || 'Nouvel itineraire',
        description: itinerary.description || '',
        startDate: itinerary.startDate || new Date().toISOString(),
        endDate: itinerary.endDate || new Date(Date.now() + 86400000).toISOString(),
        maxParticipants: itinerary.maxParticipants || 50,
        organizerId: userId,
    };

    const createdEvent = await createEvent(eventPayload);
    const eventId = getEntityId(createdEvent);

    if (!eventId) {
        throw new Error("L'API n'a pas renvoye l'ID de l'evenement cree.");
    }

    for (const group of itinerary.groups) {
        const routePayload: ApiRoutePayload = {
            eventId,
            name: group.name || 'Route sans nom',
            description: group.description || '',
            routeType: group.routeType || 'MIXTE',
            difficultyLevel: group.difficultyLevel || 'MOYEN',
            totalDistanceKm: 0,
            estimatedDurationMinutes: 0,
        };

        const createdRoute = await createRoute(routePayload);
        const routeId = getEntityId(createdRoute);

        if (!routeId) continue;

        const sortedWaypoints = itinerary.waypoints
            .filter((wp) => wp.groupId === group.id)
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
                return createPoint(pointPayload);
            })
        );
    }

    return eventId;
}

export async function deletePublishedItinerary(eventId: string) {
    const [routes, participations] = await Promise.all([
        getRoutes(),
        getParticipations().catch(() => []),
    ]);

    const eventRoutes = routes.filter((route) => route.eventId === eventId);
    const eventParticipations = participations.filter((participation) => participation.eventId === eventId);

    await Promise.all(
        eventRoutes.map(async (route) => {
            const [points, segments] = await Promise.all([
                getPoints(route.id).catch(() => []),
                getSegments(route.id).catch(() => []),
            ]);

            await Promise.all([
                ...segments
                    .filter((segment) => segment.routeId === route.id)
                    .map((segment) => deleteSegment(segment.id)),
                ...points
                    .filter((point) => point.routeId === route.id)
                    .map((point) => deletePoint(point.id)),
            ]);

            await deleteRoute(route.id);
        })
    );

    await Promise.all(
        eventParticipations.map((participation) => deleteParticipation(participation.id))
    );

    await deleteEvent(eventId);
}
