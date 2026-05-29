import type { ApiPointPayload, ApiPointResponse } from '../domain';
import { apiClient } from '../lib/apiClient';

function withRouteQuery(endpoint: string, routeId?: string) {
    if (!routeId) return endpoint;
    return `${endpoint}?${new URLSearchParams({ routeId }).toString()}`;
}

export function createPoint(data: ApiPointPayload) {
    return apiClient.post<ApiPointResponse>('/api/points', data);
}

export function getPoints(routeId?: string) {
    return apiClient.get<ApiPointResponse[]>(withRouteQuery('/api/points', routeId));
}

export function getPointById(id: string) {
    return apiClient.get<ApiPointResponse>(`/api/points/${id}`);
}

export function updatePoint(id: string, data: Partial<ApiPointPayload>) {
    return apiClient.patch<ApiPointResponse>(`/api/points/${id}`, data);
}

export function deletePoint(id: string) {
    return apiClient.delete<void>(`/api/points/${id}`);
}
