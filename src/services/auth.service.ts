import type {
    ApiAuthLoginResponse,
    ApiAuthRegisterPayload,
    ApiLoginPayload,
    ApiParticipantJoinPayload,
    ApiUserResponse,
} from '../domain';
import { apiClient } from '../lib/apiClient';

export function loginUser(email: string, password: string) {
    const payload: ApiLoginPayload = { email, password };
    return apiClient.post<ApiAuthLoginResponse>('/api/auth/login', payload, { skipAuth: true });
}

export function registerAdmin(data: ApiAuthRegisterPayload) {
    return apiClient.post<ApiUserResponse>('/api/auth/register', data);
}

export function joinAsParticipant(data: ApiParticipantJoinPayload) {
    return apiClient.post<ApiAuthLoginResponse>('/api/auth/participant/join', data, { skipAuth: true });
}

export function getProfile(authToken?: string) {
    return apiClient.get<ApiUserResponse>(
        '/api/auth/profile',
        authToken ? { authToken } : undefined
    );
}

export function refreshToken() {
    return apiClient.post<ApiAuthLoginResponse>(
        '/api/auth/refresh',
        undefined,
        { credentials: 'include', skipAuth: true }
    );
}
