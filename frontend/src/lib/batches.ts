// src/lib/batches.ts

export interface DeliveryPlanStop {
  member_id: number;
  request_id?: number | null;
  latitude: number;
  longitude: number;
  volume_liters?: number | null;
  sequence: number;
}

export interface AssignedTankerSnapshot {
  tanker_id: number;
  driver_name: string;
  phone: string;
  tank_plate_number: string;
  status: string;
}

export interface BatchLiveResponse {
  batch_id: number;
  status:
    | "forming"
    | "near_ready"
    | "ready_for_assignment"
    | "assigned"
    | "loading"
    | "delivering"
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
  assigned_tanker?: AssignedTankerSnapshot | null;
  delivery_plan: DeliveryPlanStop[];
  next_action_hint: string;
}

export async function fetchLiveBatch(batchId: number): Promise<BatchLiveResponse> {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/batches/${batchId}/live`);
  if (!res.ok) {
    throw new Error("Failed to fetch live batch");
  }
  return res.json();
}