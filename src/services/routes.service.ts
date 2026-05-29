import type {
    ApiRouteCalculationResponse,
    ApiRoutePayload,
    ApiRouteResponse,
} from '../domain';
import { apiClient } from '../lib/apiClient';

export function createRoute(data: ApiRoutePayload) {
    return apiClient.post<ApiRouteResponse>('/api/routes', data);
}

export function getRoutes() {
    return apiClient.get<ApiRouteResponse[]>('/api/routes');
}

export function getRouteById(id: string) {
    return apiClient.get<ApiRouteResponse>(`/api/routes/${id}`);
}

export function updateRoute(id: string, data: Partial<ApiRoutePayload>) {
    return apiClient.patch<ApiRouteResponse>(`/api/routes/${id}`, data);
}

export function deleteRoute(id: string) {
    return apiClient.delete<void>(`/api/routes/${id}`);
}

export function calculateRoute(id: string) {
    return apiClient.post<ApiRouteCalculationResponse>(`/api/routes/${id}/calculate`);
}
