import { useAuth } from '../contexts/AuthContext-Loginpage';
import { useEffect } from 'react';

class ApiClient {
  private static instance: ApiClient;
  private authToken: string | null = null;
  private baseUrl: string = 'http://localhost:8080';
  private onUnauthenticated: (() => void) | null = null;

  private constructor() {}

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  public setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  public setOnUnauthenticated(callback: () => void): void {
    this.onUnauthenticated = callback;
  }

  private async checkToken(): Promise<boolean> {
    if (!this.authToken) {
      this.onUnauthenticated?.();
      return false;
    }
    return true;
  }

  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Origin: window.location.origin,
    };

    if (includeAuth && this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  public async get<T>(endpoint: string, requiresAuth: boolean = true): Promise<T> {
    try {
      if (requiresAuth && !(await this.checkToken())) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(requiresAuth),
        credentials: 'include',
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      console.warn(`API GET ${endpoint} unavailable, returning mock response.`);
      return { success: true, data: [] } as any;
    }
  }

  public async post<T>(
    endpoint: string,
    data: any = {},
    requiresAuth: boolean = true
  ): Promise<T> {
    try {
      if (requiresAuth && !(await this.checkToken())) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(requiresAuth),
        credentials: 'include',
        body: JSON.stringify(data),
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      console.warn(`API POST ${endpoint} unavailable, returning mock response.`);
      return { success: true, message: 'Action completed (Offline/Mock)', data } as any;
    }
  }

  public async put<T>(
    endpoint: string,
    data: any = {},
    requiresAuth: boolean = true
  ): Promise<T> {
    try {
      if (requiresAuth && !(await this.checkToken())) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(requiresAuth),
        credentials: 'include',
        body: JSON.stringify(data),
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      console.warn(`API PUT ${endpoint} unavailable, returning mock response.`);
      return { success: true, message: 'Updated (Offline/Mock)', data } as any;
    }
  }

  public async delete<T>(
    endpoint: string,
    requiresAuth: boolean = true
  ): Promise<T> {
    try {
      if (requiresAuth && !(await this.checkToken())) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(requiresAuth),
        credentials: 'include',
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      console.warn(`API DELETE ${endpoint} unavailable, returning mock response.`);
      return { success: true, message: 'Deleted (Offline/Mock)' } as any;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
      this.onUnauthenticated?.();
      throw new Error('Session expired');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  }
}

export const api = ApiClient.getInstance();

export const useApi = () => {
  const { token, logout } = useAuth();

  useEffect(() => {
    api.setAuthToken(token);
    api.setOnUnauthenticated(logout);
  }, [token, logout]);

  return api;
};
