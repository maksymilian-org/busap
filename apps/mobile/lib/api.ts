import * as SecureStore from 'expo-secure-store';
import type { AuthResponse, AuthTokens, User } from '@busap/shared';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
const BASE_URL = `${API_URL}/api/v1`;

const TOKEN_KEYS = {
  ACCESS: 'busap_access_token',
  REFRESH: 'busap_refresh_token',
} as const;

class ApiClient {
  private async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEYS.ACCESS);
  }

  private async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEYS.REFRESH);
  }

  private async setTokens(tokens: AuthTokens): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEYS.ACCESS, tokens.accessToken);
    await SecureStore.setItemAsync(TOKEN_KEYS.REFRESH, tokens.refreshToken);
  }

  private async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS);
    await SecureStore.deleteItemAsync(TOKEN_KEYS.REFRESH);
  }

  async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });

    // Auto-refresh on 401
    if (response.status === 401 && (await this.getRefreshToken())) {
      const refreshed = await this.refresh();
      if (refreshed) {
        const newToken = await this.getAccessToken();
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(`${BASE_URL}${path}`, {
          ...options,
          headers,
        });
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await this.fetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await this.setTokens(data.tokens);
    return data;
  }

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<AuthResponse> {
    const data = await this.fetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName }),
    });
    await this.setTokens(data.tokens);
    return data;
  }

  async refresh(): Promise<boolean> {
    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        await this.clearTokens();
        return false;
      }

      const data = await response.json();
      await this.setTokens(data.tokens);
      return true;
    } catch {
      await this.clearTokens();
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.fetch('/auth/logout', { method: 'POST', body: JSON.stringify({}) });
    } finally {
      await this.clearTokens();
    }
  }

  async getMe(): Promise<User> {
    return this.fetch<User>('/auth/me');
  }

  async hasTokens(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }
}

export const api = new ApiClient();
