// Base URL every API request is built from.
// - In development, defaults to the local backend (http://localhost:4000/api)
//   unless VITE_API_URL overrides it.
// - In a production build, defaults to a relative '/api' path, assuming the
//   frontend and backend are served from the same origin.
const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api');

// Thrown whenever the backend responds with a non-2xx status. Carries the
// HTTP status code alongside the message so callers can react differently
// to e.g. 401 (not logged in) vs 404 (not found) if needed, and so UI code
// can safely display `err.message` (never a raw stack trace) to the user.
export class ApiError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: object;
}

// The single function every service module (authService, menuService, etc.)
// uses to talk to the backend. This is the one place that knows how to
// build a URL, attach the auth cookie, encode the body, and turn a failed
// response into a thrown ApiError — so feature code never has to repeat
// that logic.
//
// Data flow through the app: React Page -> Service function -> apiRequest
// (here) -> HTTP request -> Express route -> Controller -> Service ->
// MongoDB -> JSON response -> back up through apiRequest -> React state -> UI.
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(`${API_URL}${path}`, window.location.origin);

  // Query params (e.g. { page, limit } for pagination, or { preset, from,
  // to } for reports) are appended to the URL as ?key=value pairs.
  // `undefined` values are skipped so optional filters don't get sent as
  // the literal string "undefined".
  if (options.query) {
    for (const [key, value] of Object.entries(options.query as Record<string, unknown>)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url.toString(), {
    method: options.method ?? 'GET',
    // Always sends the browser's cookies (including the httpOnly JWT auth
    // cookie) with every request — this is what keeps the admin API calls
    // authenticated without ever touching the token in JavaScript.
    credentials: 'include',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // Not every response has a JSON body (e.g. a 204 No Content from a
  // DELETE), so this only attempts to parse JSON when the response
  // actually declares that content type.
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : undefined;

  if (!res.ok) {
    const message = (data as { message?: string } | undefined)?.message ?? 'Request failed';
    throw new ApiError(message, res.status);
  }

  return data as T;
}
