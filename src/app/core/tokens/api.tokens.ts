import { InjectionToken } from '@angular/core';

/**
 * API base URL injection token. Resolves at runtime so the same build can talk
 * to either the direct FastAPI port (dev) or the Traefik gateway (preview/prod).
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => {
    const w = (typeof window !== 'undefined' ? (window as unknown as { __KIPA_API_BASE__?: string }) : null);
    if (w?.__KIPA_API_BASE__) {
      return w.__KIPA_API_BASE__;
    }
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        // Direct FastAPI on host (Docker maps 8000 -> 8007).
        return 'http://localhost:8007/api/v1';
      }
      return `${window.location.origin}/api/v1`;
    }
    return 'http://localhost:8007/api/v1';
  },
});

/**
 * LocalStorage key under which the JWT is persisted. Centralised to avoid
 * string typos around the codebase.
 */
export const TOKEN_STORAGE_KEY = 'kipa_token';
