import type { DifficultyLevel, RouteType } from './waypoint.types';

export type EventStatus = 'BROUILLON' | 'PLANIFIE' | 'EN_COURS' | 'TERMINE' | 'ANNULE';
export type ApiPointType = 'PASSAGE' | 'INTERET' | 'PAUSE';

export interface ApiAuthLoginResponse {
    access_token: string;
}

export interface ApiUserResponse {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}

export interface ApiEventResponse {
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    maxParticipants: number;
    organizerId: string;
    shareCode: string;
    status: EventStatus;
}

export interface ApiRouteResponse {
    id: string;
    eventId: string;
    name: string;
    description: string;
    routeType: RouteType;
    difficultyLevel: DifficultyLevel;
    totalDistanceKm: number;
    estimatedDurationMinutes: number;
}

export interface ApiPointResponse {
    id: string;
    routeId: string;
    type: ApiPointType;
    order: number;
    latitude: number;
    longitude: number;
    name: string;
    address: string;
    description: string;
    pauseDurationMinutes?: number;
}

export interface ApiGpsCoordinate {
    lat: number;
    lon: number;
}

export interface ApiSegmentResponse {
    id: string;
    routeId: string;
    startPointId: string;
    endPointId: string;
    order: number;
    distanceKm?: number;
    estimatedDurationMinutes?: number;
    gpsCoordinates?: ApiGpsCoordinate[];
    roadType?: string;
}

export interface ApiParticipationResponse {
    id: string;
    eventId: string;
    userId?: string;
    status: string;
    progress?: number;
}

export interface ApiPositionResponse {
    id: string;
    participationId: string;
    latitude: number;
    longitude: number;
    timestamp: string;
}

export interface ApiLoginPayload {
    email: string;
    password: string;
}

export interface ApiAuthRegisterPayload {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
}

export interface ApiParticipantJoinPayload {
    shareCode: string;
    firstName: string;
    lastName: string;
    email?: string;
}

export interface ApiUserPayload {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
}

export type ApiUserUpdatePayload = Partial<ApiUserPayload>;

export interface ApiEventPayload {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    maxParticipants: number;
    organizerId: string;
}

export interface ApiRoutePayload {
    eventId: string;
    name: string;
    description: string;
    routeType: RouteType;
    difficultyLevel: DifficultyLevel;
    totalDistanceKm: number;
    estimatedDurationMinutes: number;
}

export interface ApiPointPayload {
    routeId: string;
    type: ApiPointType;
    order: number;
    latitude: number;
    longitude: number;
    name: string;
    address: string;
    description: string;
    pauseDurationMinutes?: number;
}

export interface ApiSegmentPayload {
    routeId: string;
    startPointId: string;
    endPointId: string;
    order: number;
    distanceKm?: number;
    estimatedDurationMinutes?: number;
    gpsCoordinates?: ApiGpsCoordinate[];
    roadType?: string;
}

export interface ApiSegmentPolylineResponse {
    id: string;
    polyline: string;
}

export interface ApiSegmentProgressPayload {
    participationId?: string;
    latitude: number;
    longitude: number;
}

export interface ApiSegmentProgressResponse {
    segmentId: string;
    completed: boolean;
    progress?: number;
    distanceMeters?: number;
}

export interface ApiRouteCalculationResponse {
    route: ApiRouteResponse;
    segments: ApiSegmentResponse[];
    totalDistanceKm: number;
    estimatedDurationMinutes: number;
}

export interface ApiParticipationPayload {
    eventId?: string;
    shareCode?: string;
    userId?: string;
    status?: string;
    progress?: number;
}

export interface ApiPositionPayload {
    participationId: string;
    latitude: number;
    longitude: number;
    timestamp?: string;
}
