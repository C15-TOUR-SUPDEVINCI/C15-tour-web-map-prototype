import type {
    ApiEventPayload,
    ApiEventResponse,
    EventStatus,
} from '../domain';
import { apiClient } from '../lib/apiClient';

export function createEvent(data: ApiEventPayload) {
    return apiClient.post<ApiEventResponse>('/api/events', data);
}

export function getEvents() {
    return apiClient.get<ApiEventResponse[]>('/api/events');
}

export function getEventById(id: string) {
    return apiClient.get<ApiEventResponse>(`/api/events/${id}`);
}

export function updateEvent(id: string, data: Partial<ApiEventPayload>) {
    return apiClient.patch<ApiEventResponse>(`/api/events/${id}`, data);
}

export function deleteEvent(id: string) {
    return apiClient.delete<void>(`/api/events/${id}`);
}

export function updateEventStatus(id: string, status: EventStatus) {
    return apiClient.patch<ApiEventResponse>(`/api/events/${id}/status`, { status });
}
