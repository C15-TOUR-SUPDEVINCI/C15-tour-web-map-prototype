import type {
    ApiEventPayload,
    ApiEventResponse,
    ApiPointPayload,
    ApiPointResponse,
    ApiRoutePayload,
    ApiRouteResponse,
    Group,
    Itinerary,
    Waypoint,
} from '../domain';
import { toApiPointType } from '../domain';
import { createEvent, deleteEvent, getEventById, getEvents, updateEvent } from './events.service';
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

const DEFAULT_GROUP_ID = 'default-group';

const createDefaultGroup = (): Group => ({
    id: DEFAULT_GROUP_ID,
    name: 'Groupe par defaut',
    routeType: 'MIXTE',
    difficultyLevel: 'MOYEN',
});

function toDateTimeLocal(value: string | undefined, fallback: string) {
    if (!value) return fallback;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
}

function buildEventPayload(itinerary: Itinerary, userId: string): ApiEventPayload {
    return {
        title: itinerary.name || 'Nouvel itineraire',
        description: itinerary.description || '',
        startDate: itinerary.startDate || new Date().toISOString(),
        endDate: itinerary.endDate || new Date(Date.now() + 86400000).toISOString(),
        maxParticipants: itinerary.maxParticipants || 50,
        organizerId: userId,
    };
}

function assertOrganizer(event: ApiEventResponse, userId: string) {
    if (event.organizerId !== userId) {
        throw new Error("Vous n'etes pas autorise a modifier cet evenement.");
    }
}

async function createRoutesAndPoints(eventId: string, itinerary: Itinerary) {
    const groups = itinerary.groups.length > 0 ? itinerary.groups : [createDefaultGroup()];
    const groupIds = new Set(groups.map((group) => group.id));
    const firstGroupId = groups[0].id;

    for (const group of groups) {
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
            .filter((wp) =>
                wp.groupId === group.id
                || (group.id === firstGroupId && !groupIds.has(wp.groupId))
            )
            .sort((a, b) => a.order - b.order);

        await Promise.all(
            sortedWaypoints.map((wp) => {
                const pointPayload: ApiPointPayload = {
                    routeId,
                    type: toApiPointType(wp.type),
                    order: wp.order,
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
}

async function deleteRoutesForEvent(eventId: string) {
    const routes = await getRoutes();
    const eventRoutes = routes.filter((route) => route.eventId === eventId);

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
}

function eventToItinerary(
    event: ApiEventResponse,
    groups: Group[] = [],
    waypoints: Waypoint[] = []
): Itinerary {
    const startDate = toDateTimeLocal(event.startDate, new Date().toISOString().slice(0, 16));
    const endDate = toDateTimeLocal(
        event.endDate,
        new Date(Date.now() + 86400000).toISOString().slice(0, 16)
    );

    return {
        id: event.id,
        name: event.title || 'Nouvel itineraire',
        description: event.description || '',
        startDate,
        endDate,
        maxParticipants: event.maxParticipants || 50,
        lastModified: startDate,
        groups,
        waypoints,
    };
}

function routeToGroup(route: ApiRouteResponse): Group {
    return {
        id: route.id,
        name: route.name || 'Route sans nom',
        description: route.description || '',
        routeType: route.routeType || 'MIXTE',
        difficultyLevel: route.difficultyLevel || 'MOYEN',
    };
}

function pointToWaypoint(point: ApiPointResponse, globalOrder: number): Waypoint {
    return {
        id: point.id,
        lat: point.latitude,
        lng: point.longitude,
        label: point.name || point.address || 'Point sans nom',
        address: point.address || '',
        description: point.description || '',
        pauseDurationMinutes: point.pauseDurationMinutes || 0,
        order: globalOrder,
        type: point.type,
        groupId: point.routeId,
        isCustomName: Boolean(point.name && point.address && point.name !== point.address),
    };
}

export async function publishItinerary(itinerary: Itinerary, userId: string) {
    const eventPayload = buildEventPayload(itinerary, userId);
    const createdEvent = await createEvent(eventPayload);
    const eventId = getEntityId(createdEvent);

    if (!eventId) {
        throw new Error("L'API n'a pas renvoye l'ID de l'evenement cree.");
    }

    await createRoutesAndPoints(eventId, itinerary);

    return eventId;
}

export async function saveItineraryToServer(
    itinerary: Itinerary,
    userId: string,
    serverEventId?: string
): Promise<string> {
    if (!serverEventId) {
        return publishItinerary(itinerary, userId);
    }

    const existingEvent = await getEventById(serverEventId);
    assertOrganizer(existingEvent, userId);

    await updateEvent(serverEventId, buildEventPayload(itinerary, userId));
    await deleteRoutesForEvent(serverEventId);
    await createRoutesAndPoints(serverEventId, itinerary);

    return serverEventId;
}

export async function getItinerariesFromServer(userId: string): Promise<Itinerary[]> {
    const events = await getEvents();

    return events
        .filter((event) => event.organizerId === userId)
        .map((event) => eventToItinerary(event, [createDefaultGroup()]));
}

export async function getItineraryFromServer(eventId: string, userId: string): Promise<Itinerary> {
    const event = await getEventById(eventId);
    assertOrganizer(event, userId);

    const routes = await getRoutes();
    const eventRoutes = routes.filter((route) => route.eventId === eventId);
    const routesWithPoints = await Promise.all(
        eventRoutes.map(async (route) => {
            const points = await getPoints(route.id).catch(() => []);
            return {
                route,
                points: points
                    .filter((point) => point.routeId === route.id)
                    .sort((a, b) => a.order - b.order),
            };
        })
    );
    routesWithPoints.sort((a, b) =>
        (a.points[0]?.order ?? Number.MAX_SAFE_INTEGER)
        - (b.points[0]?.order ?? Number.MAX_SAFE_INTEGER)
    );

    const groups = routesWithPoints.length > 0
        ? routesWithPoints.map(({ route }) => routeToGroup(route))
        : [createDefaultGroup()];

    let nextOrder = 1;
    const waypoints = routesWithPoints.flatMap(({ points }) =>
        points.map((point) => pointToWaypoint(point, nextOrder++))
    );

    return eventToItinerary(event, groups, waypoints);
}

export async function deletePublishedItinerary(eventId: string, userId: string) {
    const event = await getEventById(eventId);
    assertOrganizer(event, userId);

    const [participations] = await Promise.all([
        getParticipations().catch(() => []),
    ]);

    const eventParticipations = participations.filter((participation) => participation.eventId === eventId);

    await deleteRoutesForEvent(eventId);

    await Promise.all(
        eventParticipations.map((participation) => deleteParticipation(participation.id))
    );

    await deleteEvent(eventId);
}
