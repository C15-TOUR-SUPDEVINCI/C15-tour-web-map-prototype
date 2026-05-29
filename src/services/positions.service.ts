import type { ApiPositionPayload, ApiPositionResponse } from '../domain';
import { apiClient } from '../lib/apiClient';

function withParticipationQuery(endpoint: string, participationId?: string) {
    if (!participationId) return endpoint;
    return `${endpoint}?${new URLSearchParams({ participationId }).toString()}`;
}

export function recordPosition(data: ApiPositionPayload) {
    return apiClient.post<ApiPositionResponse>('/api/positions', data);
}

export function getPositions(participationId?: string) {
    return apiClient.get<ApiPositionResponse[]>(
        withParticipationQuery('/api/positions', participationId)
    );
}
