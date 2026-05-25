export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

interface RequestOptions {
  signal?: AbortSignal;
  query?: Record<string, string | number | boolean | undefined | null>;
}

interface BodyOptions extends RequestOptions {
  body?: unknown;
}

function buildUrl(path: string, query?: RequestOptions["query"]) {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

async function request<T>(method: Method, path: string, opts: BodyOptions = {}): Promise<T> {
  const init: RequestInit = {
    method,
    signal: opts.signal,
    headers: opts.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  };

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), init);
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ApiError(0, "Network error. Please check your connection.");
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      // non-JSON body; fall through
    }
  }

  if (!res.ok) {
    const body = parsed as { error?: string; code?: string } | null;
    throw new ApiError(res.status, body?.error || res.statusText || "Request failed", body?.code);
  }

  return parsed as T;
}

export const apiGet = <T>(path: string, opts?: RequestOptions) => request<T>("GET", path, opts);
export const apiPost = <T>(path: string, body?: unknown, opts?: RequestOptions) =>
  request<T>("POST", path, { ...opts, body });
export const apiPatch = <T>(path: string, body?: unknown, opts?: RequestOptions) =>
  request<T>("PATCH", path, { ...opts, body });
export const apiPut = <T>(path: string, body?: unknown, opts?: RequestOptions) =>
  request<T>("PUT", path, { ...opts, body });
export const apiDelete = <T = void>(path: string, opts?: RequestOptions) =>
  request<T>("DELETE", path, opts);

export interface ListResponse<T> {
  items: T[];
  nextCursor?: string | null;
}
