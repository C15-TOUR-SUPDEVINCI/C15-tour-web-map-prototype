import type { ApiUserPayload, ApiUserResponse, ApiUserUpdatePayload } from '../domain';
import { apiClient } from '../lib/apiClient';

export function createUser(data: ApiUserPayload) {
    return apiClient.post<ApiUserResponse>('/api/users', data);
}

export function getUsers() {
    return apiClient.get<ApiUserResponse[]>('/api/users');
}

export function getUserById(id: string) {
    return apiClient.get<ApiUserResponse>(`/api/users/${id}`);
}

export function updateUser(id: string, data: ApiUserUpdatePayload) {
    return apiClient.patch<ApiUserResponse>(`/api/users/${id}`, data);
}

export function deleteUser(id: string) {
    return apiClient.delete<void>(`/api/users/${id}`);
}
