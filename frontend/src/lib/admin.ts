import { apiRequest } from "@/lib/api";

export interface AdminOverviewResponse {
  generated_at: string;
  totals: Record<string, number>;
  payment_value: { total: number; paid: number };
  status_breakdown: {
    batches: Record<string, number>;
    tankers: Record<string, number>;
    requests: Record<string, number>;
    deliveries: Record<string, number>;
    payments: Record<string, number>;
  };
}

export interface AdminBatchCard {
  id: number;
  status: string;
  current_volume: number;
  target_volume: number;
  fill_percent: number;
  member_count: number;
  paid_member_count: number;
  tanker_id: number | null;
  search_radius_km: number;
  created_at?: string | null;
  expires_at?: string | null;
  loading_deadline?: string | null;
  completed_at?: string | null;
  deliveries_completed: number;
  deliveries_total: number;
}

export interface AdminTankerCard {
  id: number;
  driver_name: string;
  phone?: string | null;
  tank_plate_number: string;
  status: string;
  is_available: boolean;
  is_online: boolean;
  current_request_id?: number | null;
  active_batch_id?: number | null;
  active_request_status?: string | null;
  pending_offer_type?: string | null;
  pending_offer_id?: number | null;
  offer_expires_at?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  last_location_update_at?: string | null;
  paused_until?: string | null;
}

export interface AdminDeliveryCard {
  id: number;
  job_type: string;
  batch_id?: number | null;
  member_id?: number | null;
  request_id?: number | null;
  tanker_id: number;
  user_id?: number | null;
  user_name?: string | null;
  delivery_status: string;
  stop_order?: number | null;
  planned_liters: number;
  actual_liters_delivered?: number | null;
  measurement_valid: boolean;
  otp_verified: boolean;
  anomaly_flagged: boolean;
  failure_reason?: string | null;
  skip_reason?: string | null;
  notes?: string | null;
  updated_at?: string | null;
  arrived_at?: string | null;
  delivered_at?: string | null;
  failed_at?: string | null;
  skipped_at?: string | null;
}

export interface AdminPriorityRequest {
  id: number;
  status: string;
  user_id: number;
  volume_liters: number;
  is_asap: boolean;
  scheduled_for?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  retry_count: number;
  refund_eligible: boolean;
  latitude: number;
  longitude: number;
}

export interface AdminLiveResponse {
  generated_at: string;
  batches: AdminBatchCard[];
  tankers: AdminTankerCard[];
  deliveries: AdminDeliveryCard[];
  priority_requests: AdminPriorityRequest[];
}

export interface AdminRequestItem {
  id: number;
  user_id: number;
  delivery_type: string;
  status: string;
  volume_liters: number;
  is_asap: boolean;
  scheduled_for?: string | null;
  latitude: number;
  longitude: number;
  retry_count: number;
  assignment_failed_reason?: string | null;
  refund_eligible: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AdminPaymentItem {
  id: number;
  user_id?: number | null;
  batch_id?: number | null;
  member_id?: number | null;
  amount: number;
  status: string;
}

export const getAdminOverview = () => apiRequest<AdminOverviewResponse>("/admin/overview");
export const getAdminLive = (limit = 20) => apiRequest<AdminLiveResponse>(`/admin/live?limit=${limit}`);
export const getAdminRequests = (limit = 50) => apiRequest<{ items: AdminRequestItem[] }>(`/admin/requests?limit=${limit}`);
export const getAdminPayments = (limit = 50) => apiRequest<{ items: AdminPaymentItem[] }>(`/admin/payments?limit=${limit}`);
export const getAdminTankers = (limit = 50) => apiRequest<{ items: AdminTankerCard[] }>(`/admin/tankers?limit=${limit}`);
export const getAdminDeliveries = (limit = 50) => apiRequest<{ items: AdminDeliveryCard[] }>(`/admin/deliveries?limit=${limit}`);

export const adminForceExpireBatch = (batchId: number, refundPaidMembers = true) =>
  apiRequest(`/admin/batches/${batchId}/expire?refund_paid_members=${refundPaidMembers}`, { method: "POST" });

export const adminForceOfferBatch = (batchId: number, tankerId: number) =>
  apiRequest(`/admin/batches/${batchId}/offer/${tankerId}`, { method: "POST" });

export const adminRefundMember = (memberId: number) =>
  apiRequest(`/admin/batch-members/${memberId}/refund`, { method: "POST" });

export const adminResetTanker = (tankerId: number) =>
  apiRequest(`/admin/tankers/${tankerId}/reset`, { method: "POST" });

export const adminCleanupExpired = () =>
  apiRequest(`/admin/maintenance/cleanup-expired`, { method: "POST" });
