const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
// const API_BASE_URL = import.meta.

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get("content-type");

  let data: unknown = null;

  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "detail" in data
        ? String((data as { detail?: string }).detail)
        : "Something went wrong";
    throw new Error(message);
  }

  return data as T;
}

export type DeliveryType = "batch" | "priority";

export interface CreateRequestPayload {
  user_id: number;
  liquid_id: number;
  volume_liters: number;
  latitude: number;
  longitude: number;
  delivery_type: DeliveryType;
  scheduled_time?: string | null;
}

export interface CreateRequestResponse {
  request_id: number;
  batch_id: number | null;
  member_id: number | null;
  payment_deadline: string | null;
  delivery_type: DeliveryType;
}

export function createWaterRequest(payload: CreateRequestPayload) {
  return apiRequest<CreateRequestResponse>("/requests/", {
    method: "POST",
    body: payload,
  });
}