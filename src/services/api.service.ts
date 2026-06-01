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
import {
    ONE_DAY_MS,
    createDefaultGroup,
    normalizeMaxParticipants,
    toApiPointType,
} from '../domain';
import { createEvent, deleteEvent, getEventById, getEvents, updateEvent } from './events.service';
import { deleteParticipation, getParticipations } from './participation.service';
import { createPoint, deletePoint, getPoints, updatePoint } from './points.service';
import { createRoute, deleteRoute, getRoutes, updateRoute } from './routes.service';
import { deleteSegment, getSegments } from './segments.service';

type ApiEntityId = {
    id?: string;
    _id?: string;
};

type RouteWithPoints = {
    route: ApiRouteResponse;
    points: ApiPointResponse[];
    index: number;
};

const ROUTE_ORDER_PATTERN = /^\[tour-map-route-order:(\d+)]\n?/;

function getEntityId(entity: ApiEntityId) {
    return entity.id ?? entity._id;
}

function decodeRouteDescription(description = '') {
    const match = description.match(ROUTE_ORDER_PATTERN);

    if (!match) {
        return { description, order: undefined };
    }

    const order = Number.parseInt(match[1], 10);
    return {
        description: description.replace(ROUTE_ORDER_PATTERN, ''),
        order: Number.isFinite(order) ? order : undefined,
    };
}

function encodeRouteDescription(description: string | undefined, order: number) {
    const cleanDescription = decodeRouteDescription(description).description.trim();
    const metadata = `[tour-map-route-order:${order}]`;

    return cleanDescription ? `${metadata}\n${cleanDescription}` : metadata;
}

function routeSortOrder(entry: RouteWithPoints) {
    const routeOrder = decodeRouteDescription(entry.route.description).order;
    return routeOrder ?? entry.points[0]?.order ?? Number.MAX_SAFE_INTEGER;
}

function sortRoutesWithPoints(routesWithPoints: RouteWithPoints[]) {
    return routesWithPoints.sort((a, b) => {
        const orderDiff = routeSortOrder(a) - routeSortOrder(b);
        return orderDiff || a.index - b.index;
    });
}

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
        endDate: itinerary.endDate || new Date(Date.now() + ONE_DAY_MS).toISOString(),
        maxParticipants: normalizeMaxParticipants(itinerary.maxParticipants),
        organizerId: userId,
    };
}

function assertOrganizer(event: ApiEventResponse, userId: string) {
    if (event.organizerId !== userId) {
        throw new Error("Vous n'etes pas autorise a modifier cet evenement.");
    }
}

function buildRoutePayload(eventId: string, group: Group, order: number): ApiRoutePayload {
    return {
        eventId,
        name: group.name || 'Route sans nom',
        description: encodeRouteDescription(group.description, order),
        routeType: group.routeType || 'MIXTE',
        difficultyLevel: group.difficultyLevel || 'MOYEN',
        totalDistanceKm: 0,
        estimatedDurationMinutes: 0,
    };
}

function buildPointPayload(routeId: string, waypoint: Waypoint): ApiPointPayload {
    return {
        routeId,
        type: toApiPointType(waypoint.type),
        order: waypoint.order,
        latitude: waypoint.lat,
        longitude: waypoint.lng,
        name: waypoint.label || 'Point sans nom',
        address: waypoint.address || '',
        description: waypoint.description || '',
        pauseDurationMinutes: waypoint.pauseDurationMinutes || 0,
    };
}

function getGroupsForSave(itinerary: Itinerary) {
    return itinerary.groups.length > 0 ? itinerary.groups : [createDefaultGroup()];
}

function getGroupWaypoints(itinerary: Itinerary, group: Group, groups: Group[]) {
    const groupIds = new Set(groups.map((item) => item.id));
    const firstGroupId = groups[0]?.id;

    return itinerary.waypoints
        .filter((waypoint) =>
            waypoint.groupId === group.id
            || (group.id === firstGroupId && !groupIds.has(waypoint.groupId))
        )
        .sort((a, b) => a.order - b.order);
}

function pickRouteMatch(
    group: Group,
    existingRoutes: RouteWithPoints[],
    usedRouteIds: Set<string>,
    groupIndex: number,
    allowIndexFallback: boolean
) {
    const routeById = existingRoutes.find((entry) => entry.route.id === group.id);

    if (routeById && !usedRouteIds.has(routeById.route.id)) {
        usedRouteIds.add(routeById.route.id);
        return routeById;
    }

    if (allowIndexFallback) {
        const routeByIndex = existingRoutes[groupIndex];
        if (routeByIndex && !usedRouteIds.has(routeByIndex.route.id)) {
            usedRouteIds.add(routeByIndex.route.id);
            return routeByIndex;
        }

        const fallbackRoute = existingRoutes.find((entry) => !usedRouteIds.has(entry.route.id));
        if (fallbackRoute) {
            usedRouteIds.add(fallbackRoute.route.id);
        }

        return fallbackRoute;
    }

    return undefined;
}

function pickPointMatch(
    waypoint: Waypoint,
    existingPoints: ApiPointResponse[],
    usedPointIds: Set<string>,
    waypointIndex: number,
    allowIndexFallback: boolean
) {
    const pointById = existingPoints.find((point) => point.id === waypoint.id);

    if (pointById && !usedPointIds.has(pointById.id)) {
        usedPointIds.add(pointById.id);
        return pointById;
    }

    if (allowIndexFallback) {
        const pointByIndex = existingPoints[waypointIndex];
        if (pointByIndex && !usedPointIds.has(pointByIndex.id)) {
            usedPointIds.add(pointByIndex.id);
            return pointByIndex;
        }
    }

    return undefined;
}

async function getEventRoutesWithPoints(eventId: string) {
    const routes = await getRoutes();
    const eventRoutes = routes.filter((route) => route.eventId === eventId);
    const routesWithPoints = await Promise.all(
        eventRoutes.map(async (route, index) => {
            const points = await getPoints(route.id).catch(() => []);
            return {
                route,
                index,
                points: points
                    .filter((point) => point.routeId === route.id)
                    .sort((a, b) => a.order - b.order),
            };
        })
    );

    return sortRoutesWithPoints(routesWithPoints);
}

async function deleteRouteTree(entry: RouteWithPoints) {
    const segments = await getSegments(entry.route.id).catch(() => []);

    await Promise.all([
        ...segments
            .filter((segment) => segment.routeId === entry.route.id)
            .map((segment) => deleteSegment(segment.id)),
        ...entry.points
            .filter((point) => point.routeId === entry.route.id)
            .map((point) => deletePoint(point.id)),
    ]);

    await deleteRoute(entry.route.id);
}

async function deleteRoutesForEvent(eventId: string) {
    const eventRoutes = await getEventRoutesWithPoints(eventId);
    await Promise.all(eventRoutes.map((routeEntry) => deleteRouteTree(routeEntry)));
}

async function syncPointsForRoute(
    routeId: string,
    group: Group,
    groups: Group[],
    itinerary: Itinerary,
    existingPoints: ApiPointResponse[]
) {
    const sortedWaypoints = getGroupWaypoints(itinerary, group, groups);
    const usedPointIds = new Set<string>();
    const savedWaypoints: Waypoint[] = [];
    const allowIndexFallback = !sortedWaypoints.some((waypoint) =>
        existingPoints.some((point) => point.id === waypoint.id)
    );

    for (const [index, waypoint] of sortedWaypoints.entries()) {
        const existingPoint = pickPointMatch(
            waypoint,
            existingPoints,
            usedPointIds,
            index,
            allowIndexFallback
        );
        const pointPayload = buildPointPayload(routeId, waypoint);

        if (existingPoint) {
            const updatedPoint = await updatePoint(existingPoint.id, pointPayload);
            savedWaypoints.push({
                ...waypoint,
                id: getEntityId(updatedPoint) ?? existingPoint.id,
                groupId: routeId,
            });
        } else {
            const createdPoint = await createPoint(pointPayload);
            const pointId = getEntityId(createdPoint);

            if (pointId) {
                savedWaypoints.push({
                    ...waypoint,
                    id: pointId,
                    groupId: routeId,
                });
            }
        }
    }

    const pointsToDelete = existingPoints.filter((point) => !usedPointIds.has(point.id));
    await Promise.all(pointsToDelete.map((point) => deletePoint(point.id)));

    return savedWaypoints;
}

async function syncRoutesAndPoints(eventId: string, itinerary: Itinerary) {
    const groups = getGroupsForSave(itinerary);
    const existingRoutes = await getEventRoutesWithPoints(eventId);
    const usedRouteIds = new Set<string>();
    const savedGroups: Group[] = [];
    const savedWaypoints: Waypoint[] = [];
    const allowIndexFallback = !groups.some((group) =>
        existingRoutes.some((entry) => entry.route.id === group.id)
    );

    for (const [index, group] of groups.entries()) {
        const routeOrder = index + 1;
        const existingRoute = pickRouteMatch(group, existingRoutes, usedRouteIds, index, allowIndexFallback);
        const routePayload = buildRoutePayload(eventId, group, routeOrder);
        let routeId: string | undefined;

        if (existingRoute) {
            const updatedRoute = await updateRoute(existingRoute.route.id, routePayload);
            routeId = getEntityId(updatedRoute) ?? existingRoute.route.id;
        } else {
            const createdRoute = await createRoute(routePayload);
            routeId = getEntityId(createdRoute);
        }

        if (!routeId) continue;

        savedGroups.push({
            ...group,
            id: routeId,
            description: group.description || '',
            routeType: group.routeType || 'MIXTE',
            difficultyLevel: group.difficultyLevel || 'MOYEN',
        });

        const savedRouteWaypoints = await syncPointsForRoute(
            routeId,
            group,
            groups,
            itinerary,
            existingRoute?.points ?? []
        );
        savedWaypoints.push(...savedRouteWaypoints);
    }

    const routesToDelete = existingRoutes.filter((entry) => !usedRouteIds.has(entry.route.id));
    await Promise.all(routesToDelete.map((routeEntry) => deleteRouteTree(routeEntry)));

    return {
        groups: savedGroups.length > 0 ? savedGroups : [createDefaultGroup()],
        waypoints: savedWaypoints
            .sort((a, b) => a.order - b.order)
            .map((waypoint, index) => ({ ...waypoint, order: index + 1 })),
    };
}

function eventToItinerary(
    event: ApiEventResponse,
    groups: Group[] = [],
    waypoints: Waypoint[] = []
): Itinerary {
    const startDate = toDateTimeLocal(event.startDate, new Date().toISOString().slice(0, 16));
    const endDate = toDateTimeLocal(
        event.endDate,
        new Date(Date.now() + ONE_DAY_MS).toISOString().slice(0, 16)
    );

    return {
        id: event.id,
        name: event.title || 'Nouvel itineraire',
        description: event.description || '',
        startDate,
        endDate,
        maxParticipants: normalizeMaxParticipants(event.maxParticipants),
        lastModified: startDate,
        groups,
        waypoints,
    };
}

function routeToGroup(route: ApiRouteResponse): Group {
    const { description } = decodeRouteDescription(route.description);

    return {
        id: route.id,
        name: route.name || 'Route sans nom',
        description,
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

function withSavedContent(itinerary: Itinerary, eventId: string, content: Pick<Itinerary, 'groups' | 'waypoints'>) {
    return {
        ...itinerary,
        ...content,
        id: eventId,
        maxParticipants: normalizeMaxParticipants(itinerary.maxParticipants),
        lastModified: new Date().toISOString(),
    };
}

export async function publishItinerary(itinerary: Itinerary, userId: string): Promise<Itinerary> {
    const eventPayload = buildEventPayload(itinerary, userId);
    const createdEvent = await createEvent(eventPayload);
    const eventId = getEntityId(createdEvent);

    if (!eventId) {
        throw new Error("L'API n'a pas renvoye l'ID de l'evenement cree.");
    }

    const savedContent = await syncRoutesAndPoints(eventId, itinerary);
    return withSavedContent(itinerary, eventId, savedContent);
}

export async function saveItineraryToServer(
    itinerary: Itinerary,
    userId: string,
    serverEventId?: string
): Promise<Itinerary> {
    if (!serverEventId) {
        return publishItinerary(itinerary, userId);
    }

    const existingEvent = await getEventById(serverEventId);
    assertOrganizer(existingEvent, userId);

    await updateEvent(serverEventId, buildEventPayload(itinerary, userId));
    const savedContent = await syncRoutesAndPoints(serverEventId, itinerary);

    return withSavedContent(itinerary, serverEventId, savedContent);
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

    const routesWithPoints = await getEventRoutesWithPoints(eventId);
    const groups = routesWithPoints.length > 0
        ? routesWithPoints.map(({ route }) => routeToGroup(route))
        : [createDefaultGroup()];

    let nextOrder = 1;
    const waypoints = routesWithPoints
        .flatMap(({ points }) => points)
        .sort((a, b) => a.order - b.order)
        .map((point) => pointToWaypoint(point, nextOrder++));

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
