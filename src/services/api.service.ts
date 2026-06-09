import type {
    ApiEventPayload,
    ApiEventResponse,
    ApiPointPayload,
    ApiPointResponse,
    ApiRoutePayload,
    ApiRouteResponse,
    ApiSegmentPayload,
    ApiSegmentResponse,
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
import { buildLegCoordinates, findWaypointIndices } from './routing.service';
import { createSegment, deleteSegment, getSegments, updateSegment } from './segments.service';

type ApiEntityId = {
    id?: string;
    _id?: string;
};

type RouteWithPoints = {
    route: ApiRouteResponse;
    points: ApiPointResponse[];
    index: number;
};

type SavedRoutePoints = {
    waypoints: Waypoint[];
    pointBySourceId: Map<string, Waypoint>;
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

function buildRoutePayload(
    eventId: string,
    group: Group,
    groups: Group[],
    itinerary: Itinerary,
    order: number
): ApiRoutePayload {
    const totals = getRouteTotals(itinerary, group, groups);

    return {
        eventId,
        name: group.name || 'Route sans nom',
        description: encodeRouteDescription(group.description, order),
        routeType: group.routeType || 'MIXTE',
        difficultyLevel: group.difficultyLevel || 'MOYEN',
        totalDistanceKm: totals.totalDistanceKm,
        estimatedDurationMinutes: totals.estimatedDurationMinutes,
    };
}

function buildPointPayload(routeId: string, waypoint: Waypoint): ApiPointPayload {
    const apiType = toApiPointType(waypoint.type);
    const payload: ApiPointPayload = {
        routeId,
        type: apiType,
        order: waypoint.order,
        latitude: waypoint.lat,
        longitude: waypoint.lng,
        name: waypoint.label || 'Point sans nom',
        address: waypoint.address || '',
        description: waypoint.description || '',
    };

    if (apiType === 'PAUSE') {
        const rawPauseDuration = waypoint.pauseDurationMinutes;
        const pauseDuration = typeof rawPauseDuration === 'number' && Number.isFinite(rawPauseDuration)
            ? rawPauseDuration
            : 15;

        payload.pauseDurationMinutes = Math.max(1, pauseDuration);
    }

    return payload;
}

function getGroupsForSave(itinerary: Itinerary) {
    return itinerary.groups.length > 0 ? itinerary.groups : [createDefaultGroup()];
}

function getSortedWaypoints(itinerary: Itinerary) {
    return [...itinerary.waypoints].sort((a, b) => a.order - b.order);
}

function getWaypointGroupIdForSave(waypoint: Waypoint, groups: Group[]) {
    const groupIds = new Set(groups.map((item) => item.id));

    if (groupIds.has(waypoint.groupId)) {
        return waypoint.groupId;
    }

    return groups[0]?.id;
}

function areWaypointsInGroup(start: Waypoint, end: Waypoint, group: Group, groups: Group[]) {
    return getWaypointGroupIdForSave(start, groups) === group.id
        && getWaypointGroupIdForSave(end, groups) === group.id;
}

function getRouteTotals(itinerary: Itinerary, group: Group, groups: Group[]) {
    const routeLegs = itinerary.routeLegs ?? [];

    if (routeLegs.length === 0) {
        return { totalDistanceKm: 0, estimatedDurationMinutes: 0 };
    }

    const sortedWaypoints = getSortedWaypoints(itinerary);
    let totalDistanceMeters = 0;
    let totalDurationSeconds = 0;

    for (let index = 0; index < sortedWaypoints.length - 1; index++) {
        const start = sortedWaypoints[index];
        const end = sortedWaypoints[index + 1];
        const leg = routeLegs[index];

        if (!leg || !areWaypointsInGroup(start, end, group, groups)) {
            continue;
        }

        totalDistanceMeters += Number.isFinite(leg.distance) ? leg.distance : 0;
        totalDurationSeconds += Number.isFinite(leg.duration) ? leg.duration : 0;
    }

    return {
        totalDistanceKm: totalDistanceMeters / 1000,
        estimatedDurationMinutes: Math.round(totalDurationSeconds / 60),
    };
}

function getGroupWaypoints(itinerary: Itinerary, group: Group, groups: Group[]) {
    return itinerary.waypoints
        .filter((waypoint) => getWaypointGroupIdForSave(waypoint, groups) === group.id)
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
): Promise<SavedRoutePoints> {
    const sortedWaypoints = getGroupWaypoints(itinerary, group, groups);
    const usedPointIds = new Set<string>();
    const savedWaypoints: Waypoint[] = [];
    const pointBySourceId = new Map<string, Waypoint>();
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
            const savedWaypoint = {
                ...waypoint,
                id: getEntityId(updatedPoint) ?? existingPoint.id,
                groupId: routeId,
            };

            savedWaypoints.push(savedWaypoint);
            pointBySourceId.set(waypoint.id, savedWaypoint);
        } else {
            const createdPoint = await createPoint(pointPayload);
            const pointId = getEntityId(createdPoint);

            if (pointId) {
                const savedWaypoint = {
                    ...waypoint,
                    id: pointId,
                    groupId: routeId,
                };

                savedWaypoints.push(savedWaypoint);
                pointBySourceId.set(waypoint.id, savedWaypoint);
            }
        }
    }

    const pointsToDelete = existingPoints.filter((point) => !usedPointIds.has(point.id));
    await Promise.all(pointsToDelete.map((point) => deletePoint(point.id)));

    return { waypoints: savedWaypoints, pointBySourceId };
}

function buildSegmentPayloadsForRoute(
    routeId: string,
    group: Group,
    groups: Group[],
    itinerary: Itinerary,
    pointBySourceId: Map<string, Waypoint>
) {
    const sortedWaypoints = getSortedWaypoints(itinerary);
    const routeLegs = itinerary.routeLegs ?? [];
    const routeCoordinates = itinerary.routeCoordinates ?? [];
    const hasCompleteRoutingData = routeLegs.length >= sortedWaypoints.length - 1
        && routeCoordinates.length >= 2;
    const waypointIndices = hasCompleteRoutingData
        ? findWaypointIndices(routeCoordinates, sortedWaypoints)
        : [];
    const payloads: ApiSegmentPayload[] = [];
    let segmentOrder = 1;

    for (let index = 0; index < sortedWaypoints.length - 1; index++) {
        const start = sortedWaypoints[index];
        const end = sortedWaypoints[index + 1];

        if (!areWaypointsInGroup(start, end, group, groups)) {
            continue;
        }

        const savedStart = pointBySourceId.get(start.id);
        const savedEnd = pointBySourceId.get(end.id);

        if (!savedStart || !savedEnd) {
            continue;
        }

        const payload: ApiSegmentPayload = {
            routeId,
            startPointId: savedStart.id,
            endPointId: savedEnd.id,
            order: segmentOrder,
        };

        if (hasCompleteRoutingData) {
            const leg = routeLegs[index];

            if (leg && Number.isFinite(leg.distance)) {
                payload.distanceKm = leg.distance / 1000;
            }

            if (leg && Number.isFinite(leg.duration)) {
                payload.estimatedDurationMinutes = Math.round(leg.duration / 60);
            }

            const startIndex = waypointIndices[index];
            const endIndex = waypointIndices[index + 1];

            if (Number.isInteger(startIndex) && Number.isInteger(endIndex)) {
                payload.gpsCoordinates = buildLegCoordinates(
                    routeCoordinates,
                    startIndex,
                    endIndex,
                    start,
                    end
                ).map(([lat, lng]) => ({ lat, lon: lng }));
            }
        }

        payloads.push(payload);
        segmentOrder += 1;
    }

    return payloads;
}

function pickSegmentMatch(
    payload: ApiSegmentPayload,
    existingSegments: ApiSegmentResponse[],
    usedSegmentIds: Set<string>
) {
    const pairMatch = existingSegments.find((segment) =>
        !usedSegmentIds.has(segment.id)
        && segment.startPointId === payload.startPointId
        && segment.endPointId === payload.endPointId
    );

    if (pairMatch) {
        usedSegmentIds.add(pairMatch.id);
        return pairMatch;
    }

    const canFallbackByOrder = !existingSegments.some((segment) =>
        segment.startPointId && segment.endPointId
    );

    if (!canFallbackByOrder) {
        return undefined;
    }

    const orderMatch = existingSegments.find((segment) =>
        !usedSegmentIds.has(segment.id)
        && segment.order === payload.order
    );

    if (orderMatch) {
        usedSegmentIds.add(orderMatch.id);
    }

    return orderMatch;
}

async function syncSegmentsForRoute(
    routeId: string,
    group: Group,
    groups: Group[],
    itinerary: Itinerary,
    pointBySourceId: Map<string, Waypoint>,
    existingSegments: ApiSegmentResponse[]
) {
    const desiredSegments = buildSegmentPayloadsForRoute(
        routeId,
        group,
        groups,
        itinerary,
        pointBySourceId
    );
    const usedSegmentIds = new Set<string>();

    for (const payload of desiredSegments) {
        const existingSegment = pickSegmentMatch(payload, existingSegments, usedSegmentIds);

        if (existingSegment) {
            await updateSegment(existingSegment.id, payload);
        } else {
            await createSegment(payload);
        }
    }

    const segmentsToDelete = existingSegments.filter((segment) => !usedSegmentIds.has(segment.id));
    await Promise.all(segmentsToDelete.map((segment) => deleteSegment(segment.id)));
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
        const routePayload = buildRoutePayload(eventId, group, groups, itinerary, routeOrder);
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

        const savedRoutePoints = await syncPointsForRoute(
            routeId,
            group,
            groups,
            itinerary,
            existingRoute?.points ?? []
        );

        const existingSegments = await getSegments(routeId);
        await syncSegmentsForRoute(
            routeId,
            group,
            groups,
            itinerary,
            savedRoutePoints.pointBySourceId,
            existingSegments.filter((segment) => segment.routeId === routeId)
        );

        savedWaypoints.push(...savedRoutePoints.waypoints);
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
    const rawPauseDuration = point.pauseDurationMinutes;
    const pauseDuration = typeof rawPauseDuration === 'number' && Number.isFinite(rawPauseDuration)
        ? Math.max(1, rawPauseDuration)
        : 15;

    return {
        id: point.id,
        lat: point.latitude,
        lng: point.longitude,
        label: point.name || point.address || 'Point sans nom',
        address: point.address || '',
        description: point.description || '',
        pauseDurationMinutes: point.type === 'PAUSE' ? pauseDuration : undefined,
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
