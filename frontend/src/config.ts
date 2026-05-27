/** API base URL (no trailing slash). Empty = same origin (Vite dev proxy). */
export function getApiBase(): string {
  const base = import.meta.env.VITE_API_URL as string | undefined;
  return base ? base.replace(/\/$/, "") : "";
}

/** Build full API path, e.g. /api/responses */
export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const base = getApiBase();
  return base ? `${base}${normalized}` : normalized;
}
