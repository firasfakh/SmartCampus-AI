// SmartCampus AI — Client HTTP centralisé.
//
// - Ajoute automatiquement le JWT (Authorization: Bearer) et le jeton visiteur (X-Visitor-Token).
// - Normalise les erreurs du backend ({ success:false, error:{code,message} }) en ApiError.
// - Si le JWT est refusé (401), il est supprimé et l'événement `smartcampus:auth-expired`
//   est émis : l'application repasse en mode visiteur au lieu de rester bloquée.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const STORAGE_KEYS = {
  token: 'smartcampus_token',
  visitorToken: 'smartcampus_visitor_token',
} as const;

export const AUTH_EXPIRED_EVENT = 'smartcampus:auth-expired';

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.name = 'ApiError';
  }
}

export function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function storageSet(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* stockage indisponible (navigation privée stricte) : on ignore */
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = storageGet(STORAGE_KEYS.token);
  const visitorToken = storageGet(STORAGE_KEYS.visitorToken);

  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (visitorToken) headers.set('X-Visitor-Token', visitorToken);

  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch {
    throw new ApiError(
      0,
      "Impossible de joindre le serveur SmartCampus AI. Vérifiez que le backend est lancé (uvicorn).",
      'NETWORK_ERROR',
    );
  }

  if (response.status === 204) return null as T;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      data?.error?.message || data?.detail || 'Une erreur est survenue lors de la communication avec le serveur.';
    const code = data?.error?.code || `HTTP_${response.status}`;

    // JWT expiré ou compte désactivé : on nettoie et on prévient l'application.
    if (response.status === 401 && token && /token|compte/i.test(String(message))) {
      storageSet(STORAGE_KEYS.token, null);
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    throw new ApiError(response.status, message, code, data?.error?.details);
  }
  return data as T;
}

const jsonBody = (body: unknown) => (body instanceof FormData ? body : JSON.stringify(body ?? {}));

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { method: 'GET', ...options }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, { method: 'POST', body: jsonBody(body), ...options }),
  put: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, { method: 'PUT', body: jsonBody(body), ...options }),
  patch: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, { method: 'PATCH', body: jsonBody(body), ...options }),
  delete: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { method: 'DELETE', ...options }),
};

/** Message d'erreur lisible pour l'utilisateur. */
export function errorMessage(error: unknown, fallback = 'Une erreur est survenue.'): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}
