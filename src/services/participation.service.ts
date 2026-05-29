import type { ApiParticipationPayload, ApiParticipationResponse } from '../domain';
import { apiClient } from '../lib/apiClient';

export function joinEvent(data: ApiParticipationPayload) {
    return apiClient.post<ApiParticipationResponse>('/api/participation/join', data);
}

export function getParticipations() {
    return apiClient.get<ApiParticipationResponse[]>('/api/participation');
}

export function getParticipationById(id: string) {
    return apiClient.get<ApiParticipationResponse>(`/api/participation/${id}`);
}

export function updateParticipation(id: string, data: ApiParticipationPayload) {
    return apiClient.patch<ApiParticipationResponse>(`/api/participation/${id}`, data);
}

export function deleteParticipation(id: string) {
    return apiClient.delete<void>(`/api/participation/${id}`);
}
