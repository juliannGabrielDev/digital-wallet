import * as SecureStore from 'expo-secure-store';

export const SERVICE_URLS = {
    USERS: 'http://10.221.64.173:8000/api/v1',
    WALLET: 'http://10.221.64.173:8001/api/v1',
};

const DEFAULT_BASE_URL = SERVICE_URLS.USERS;

interface ApiOptions extends RequestInit {
    headers?: Record<string, string>;
    baseUrl?: string;
}

export const api = {
    async request<T = any>(endpoint: string, options: ApiOptions = {}): Promise<{ data: T }> {
        const token = await SecureStore.getItemAsync('access_token');
        const baseUrl = options.baseUrl || DEFAULT_BASE_URL;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${baseUrl}${endpoint}`, {
                ...options,
                headers,
            });

            // Parseamos la respuesta JSON
            const responseData = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw { response: { data: responseData, status: response.status } };
            }

            return { data: responseData };
        } catch (error) {
            throw error;
        }
    },

    get<T = any>(endpoint: string, options?: ApiOptions) {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    },

    post<T = any>(endpoint: string, body: any, options?: ApiOptions) {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(body)
        });
    }
}
