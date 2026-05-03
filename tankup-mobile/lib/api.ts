import Constants from "expo-constants";

const API_BASE_URL =
  (Constants.expoConfig?.extra?.API_BASE_URL as string) ||
  "http://127.0.0.1:8000";

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
    headers: { "Content-Type": "application/json", ...headers },
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
    let message = "Something went wrong";
    if (typeof data === "object" && data !== null && "detail" in data) {
      const detail = (data as { detail?: unknown }).detail;
      if (Array.isArray(detail)) {
        message = detail
          .map((i: any) => `${i.loc?.join(".")}: ${i.msg}`)
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
  is_asap?: boolean;
  scheduled_for?: string;
}

export interface CreateRequestResponse {
  request_id: number;
  delivery_type: DeliveryType;
  request_status?: string;
  message?: string;
  batch_id?: number | null;
  member_id?: number | null;
  payment_deadline?: string | null;
  tanker_id?: number | null;
  tanker_status?: string | null;
  scheduled_for?: string | null;
  is_asap?: boolean;
}

export const createWaterRequest = (p: CreateRequestPayload) =>
  apiRequest<CreateRequestResponse>("/requests/", { method: "POST", body: p });

export interface UserResponse {
  id: number;
  name: string;
  phone: string;
  address: string;
}

export const createUser = (p: { name: string; phone: string; address: string }) =>
  apiRequest<UserResponse>("/users/", { method: "POST", body: p });

export const loginUser = (p: { phone: string }) =>
  apiRequest<UserResponse>("/auth/login", { method: "POST", body: p });

export const leaveBatchMember = (memberId: number) =>
  apiRequest(`/batch-members/${memberId}/leave`, { method: "POST" });

export const confirmPayment = (memberId: number) =>
  apiRequest(`/batch-members/${memberId}/confirm-payment`, { method: "POST" });
