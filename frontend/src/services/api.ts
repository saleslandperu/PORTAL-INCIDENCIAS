export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public payload?: unknown,
  ) {
    super(message);
  }
}

async function parse(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { error: text };
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "include",
  });
  const payload = await parse(response);
  if (!response.ok) {
    throw new ApiError(
      String(payload.error ?? "Error de comunicación con el servidor."),
      response.status,
      typeof payload.code === "string" ? payload.code : undefined,
      payload,
    );
  }
  return payload as T;
}

export async function apiOptional<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  try {
    return await api<T>(path, init);
  } catch {
    return null;
  }
}
