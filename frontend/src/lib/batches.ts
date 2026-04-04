import { apiRequest } from "./api";

export interface BatchLiveResponse {
  batch_id: number;
  status:
  | "forming"
  | "near_ready"
  | "ready_for_assignment"
  | "assigned"
  | "loading"
  | "delivering"
  | "arrived"
  | "completed"
  | "partially_completed"
  | "failed"
  | "expired";

  current_volume: number;
  target_volume: number;
  progress_percent: number;
  member_count: number;

  tanker_id?: number | null;
  driver_name?: string | null;

  otp?: string | null;
  is_member_active?: boolean | null;
  refund_eligible?: boolean | null;

  member_id?: number | null;
  member_status?: string | null;
  member_payment_status?: string | null;

  refund_status?: string | null;
  refund_amount?: number | null;
  refunded_at?: string | null;
  refund_reference?: string | null;
  failure_reason?: string | null;
  notes?: string | null;
}

export async function leaveBatchMember(memberId: number) {
  return apiRequest(`/batch-members/${memberId}/leave`, {
    method: "POST",
  });
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function fetchLiveBatch(
  batchId: number,
  memberId?: number | null
): Promise<BatchLiveResponse | null> {
  const query =
    memberId !== undefined && memberId !== null
      ? `?member_id=${memberId}`
      : "";

  const url = `${API_BASE_URL}/batches/${batchId}/live${query}`;

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
      `Failed to fetch live batch: ${response.status} ${JSON.stringify(data)}`
    );
  }

  return data as BatchLiveResponse;
}
