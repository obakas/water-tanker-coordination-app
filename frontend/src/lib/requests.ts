const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export interface PriorityLiveResponse {
  request_id: number;
  delivery_type: "priority";
  request_status: string;

  is_asap: boolean;
  scheduled_for: string | null;

  tanker_id: number | null;
  driver_name: string | null;
  tanker_phone: string | null;
  tanker_status: string | null;

  delivery_id: number | null;
  delivery_status:
    | "pending"
    | "en_route"
    | "arrived"
    | "measuring"
    | "awaiting_otp"
    | "delivered"
    | "failed"
    | "skipped"
    | null;

  otp: string | null;
  otp_verified: boolean;
  otp_required: boolean;

  planned_liters: number | null;
  actual_liters_delivered: number | null;

  meter_start_reading: number | null;
  meter_end_reading: number | null;

  arrived_at: string | null;
  measurement_started_at: string | null;
  measurement_completed_at: string | null;
  delivered_at: string | null;

  customer_confirmed: boolean;
  failure_reason: string | null;
  notes: string | null;
}

export async function fetchLivePriorityRequest(
  requestId: number
): Promise<PriorityLiveResponse | null> {
  const url = `${API_BASE_URL}/requests/${requestId}/live`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const rawText = await response.text();

  let data: unknown = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = rawText;
  }

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch priority live request: ${response.status} ${JSON.stringify(data)}`
    );
  }

  return data as PriorityLiveResponse;
}