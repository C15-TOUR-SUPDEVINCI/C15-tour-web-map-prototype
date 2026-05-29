import type {
    ApiSegmentPayload,
    ApiSegmentPolylineResponse,
    ApiSegmentProgressPayload,
    ApiSegmentProgressResponse,
    ApiSegmentResponse,
} from '../domain';
import { apiClient } from '../lib/apiClient';

function withRouteQuery(endpoint: string, routeId?: string) {
    if (!routeId) return endpoint;
    return `${endpoint}?${new URLSearchParams({ routeId }).toString()}`;
}

export function createSegment(data: ApiSegmentPayload) {
    return apiClient.post<ApiSegmentResponse>('/api/segments', data);
}

export function getSegments(routeId?: string) {
    return apiClient.get<ApiSegmentResponse[]>(withRouteQuery('/api/segments', routeId));
}

export function getSegmentById(id: string) {
    return apiClient.get<ApiSegmentResponse>(`/api/segments/${id}`);
}

export function updateSegment(id: string, data: Partial<ApiSegmentPayload>) {
    return apiClient.patch<ApiSegmentResponse>(`/api/segments/${id}`, data);
}

export function deleteSegment(id: string) {
    return apiClient.delete<void>(`/api/segments/${id}`);
}

export function getSegmentPolyline(id: string) {
    return apiClient.get<ApiSegmentPolylineResponse>(`/api/segments/${id}/polyline`);
}

export function checkSegmentProgress(id: string, data: ApiSegmentProgressPayload) {
    return apiClient.post<ApiSegmentProgressResponse>(`/api/segments/${id}/check-progress`, data);
}
