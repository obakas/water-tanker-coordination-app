// // src/lib/batches.ts

import { apiRequest } from "./api";

// export interface DeliveryPlanStop {
//   member_id: number;
//   request_id?: number | null;
//   latitude: number;
//   longitude: number;
//   volume_liters?: number | null;
//   sequence: number;
// }

// export interface AssignedTankerSnapshot {
//   tanker_id: number;
//   driver_name: string;
//   phone: string;
//   tank_plate_number: string;
//   status: string;
// }

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
  | "expired";
  current_volume: number;
  target_volume: number;
  fill_percentage: number;
  member_count: number;
  paid_member_count: number;
  unpaid_member_count: number;
  remaining_volume: number;
  payment_ratio: number;
  geo_compactness: number;
  wait_urgency: number;
  health_score: number;
  search_radius_km?: number | null;
  // assigned_tanker?: AssignedTankerSnapshot | null;
  // delivery_plan: DeliveryPlanStop[];
  next_action_hint: string;
}


// // export async function fetchLiveBatch(batchId: number, memberId?: number | null) {
// //   const url = memberId
// //     ? `/batches/${batchId}/live?member_id=${memberId}`
// //     : `/batches/${batchId}/live`;

// //   const response = await fetch(url);

// //   if (response.status === 404) {
// //     return null;
// //   }

// //   if (!response.ok) {
// //     throw new Error("Failed to fetch live batch");
// //   }

// //   return response.json();
// // }
// export async function fetchLiveBatch(batchId: number, memberId?: number | null) {
//   const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

//   const url = memberId
//     ? `${baseUrl}/batches/${batchId}/live?member_id=${memberId}`
//     : `${baseUrl}/batches/${batchId}/live`;

//   console.log("fetchLiveBatch URL:", url);

//   const response = await fetch(url);

//   if (response.status === 404) {
//     return null;
//   }

//   if (!response.ok) {
//     const text = await response.text();
//     console.error("fetchLiveBatch failed:", response.status, text);
//     throw new Error(`Failed to fetch live batch: ${response.status}`);
//   }

//   return response.json();
// }

export async function leaveBatchMember(memberId: number) {
  return apiRequest(`/batch-members/${memberId}/leave`, {
    method: "POST",
  });
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

// export interface BatchLiveResponse {
//   batch_id: number;
//   status: string;
//   current_volume: number;
//   target_volume: number;
//   progress_percent: number;
//   member_count: number;
//   tanker_id?: number | null;
//   driver_name?: string | null;
//   otp?: string | null;
//   is_member_active?: boolean;
//   refund_eligible?: boolean;
//   // add any other backend fields you return
// }

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

  console.log("fetchLiveBatch ->", {
    url,
    status: response.status,
    data,
  });

  if (response.status === 404) {
    console.warn("Live batch not found:", { batchId, memberId, url, data });
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch live batch: ${response.status} ${JSON.stringify(data)}`
    );
  }

  return data as BatchLiveResponse;
}