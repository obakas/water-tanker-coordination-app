const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

type DeliveryType = "batch" | "priority";

export type CreateRequestPayload = {
  user_id: number;
  liquid_id: number;
  volume_liters: number;
  latitude: number;
  longitude: number;
  delivery_type: DeliveryType;
  is_asap?: boolean;
  scheduled_for?: string;
};

export type CreateRequestResponse = {
  request_id: number;
  delivery_type: DeliveryType;
  request_status?: string;
  batch_id?: number | null;
  member_id?: number | null;
  payment_deadline?: string | null;
  tanker_id?: number | null;
  tanker_status?: string | null;
  scheduled_for?: string | null;
  is_asap?: boolean;
  message?: string;
};

async function apiRequest<T>(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof data?.detail === "string"
        ? data.detail
        : "Something went wrong";
    throw new Error(message);
  }

  return data as T;
}

export function createWaterRequest(payload: CreateRequestPayload) {
  return apiRequest<CreateRequestResponse>("/requests/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}