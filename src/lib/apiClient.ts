import { API_URL } from '../config';
import { useAuthStore } from '../store/useAuthStore';

export interface ApiClientOptions extends RequestInit {
    authToken?: string;
    skipAuth?: boolean;
}

export class ApiHttpError extends Error {
    status: number;
    body: string;

    constructor(status: number, body: string) {
        super(`Erreur API (${status}): ${body || 'Aucun detail fourni.'}`);
        this.name = 'ApiHttpError';
        this.status = status;
        this.body = body;
    }
}

function buildUrl(endpoint: string) {
    if (/^https?:\/\//i.test(endpoint)) return endpoint;
    const base = API_URL.replace(/\/$/, '');
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${base}${path}`;
}

async function request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    options: ApiClientOptions = {}
): Promise<T> {
    const { authToken, skipAuth, headers, ...init } = options;
    const requestHeaders = new Headers(headers);

    if (!requestHeaders.has('Accept')) {
        requestHeaders.set('Accept', 'application/json');
    }

    let requestBody: BodyInit | undefined;
    if (body !== undefined) {
        if (!requestHeaders.has('Content-Type')) {
            requestHeaders.set('Content-Type', 'application/json');
        }
        requestBody = JSON.stringify(body);
    }

    const token = skipAuth ? null : authToken ?? useAuthStore.getState().token;
    if (token) {
        requestHeaders.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(buildUrl(endpoint), {
        ...init,
        method,
        headers: requestHeaders,
        body: requestBody,
    });

    const responseText = await response.text();

    if (!response.ok) {
        throw new ApiHttpError(response.status, responseText);
    }

    if (!responseText) {
        return undefined as T;
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
        return JSON.parse(responseText) as T;
    }

    return responseText as T;
}

export const apiClient = {
    get<T>(endpoint: string, options?: ApiClientOptions) {
        return request<T>('GET', endpoint, undefined, options);
    },
    post<T>(endpoint: string, body?: unknown, options?: ApiClientOptions) {
        return request<T>('POST', endpoint, body, options);
    },
    patch<T>(endpoint: string, body?: unknown, options?: ApiClientOptions) {
        return request<T>('PATCH', endpoint, body, options);
    },
    delete<T>(endpoint: string, options?: ApiClientOptions) {
        return request<T>('DELETE', endpoint, undefined, options);
    },
};
