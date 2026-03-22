const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

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

  // if (!response.ok) {
  //   const message =
  //     typeof data === "object" && data !== null && "detail" in data
  //       ? String((data as { detail?: string }).detail)
  //       : "Something went wrong";
  //   throw new Error(message);
  // }

  if (!response.ok) {
    let message = "Something went wrong";

    if (typeof data === "object" && data !== null && "detail" in data) {
      const detail = (data as { detail?: unknown }).detail;

      if (Array.isArray(detail)) {
        message = detail
          .map((item: any) => `${item.loc?.join(".")}: ${item.msg}`)
          .join(" | ");
      } else if (typeof detail === "string") {
        message = detail;
      }
    }

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


export interface CreateUserPayload {
  name: string;
  phone: string;
  address: string;
}

export interface UserResponse {
  id: number;
  name: string;
  phone: string;
  address: string;
}

export function createUser(payload: CreateUserPayload) {
  return apiRequest<UserResponse>("/users/", {
    method: "POST",
    body: payload,
  });
}

export interface LoginUserPayload {
  phone: string;
}

export function loginUser(payload: LoginUserPayload) {
  return apiRequest<UserResponse>("/auth/login", {
    method: "POST",
    body: payload,
  });
}