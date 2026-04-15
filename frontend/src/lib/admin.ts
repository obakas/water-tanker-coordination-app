import { apiRequest } from "@/lib/api";

const ADMIN_TOKEN_STORAGE_KEY = "water-admin-token";

export const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || "";
export const setAdminToken = (token: string) => localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token.trim());
export const clearAdminToken = () => localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);

function adminRequest<T>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
  } = {}
) {
  const token = getAdminToken();

  return apiRequest<T>(endpoint, {
    ...options,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export interface AdminLoginResponse {
  access_token: string;
  token_type: string;
}

export interface AdminMeResponse {
  id: number;
  username: string;
  email?: string | null;
  role: string;
  is_active: boolean;
}

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
  created_at?: string | null;
  updated_at?: string | null;
  arrived_at?: string | null;
  delivered_at?: string | null;
  failed_at?: string | null;
  skipped_at?: string | null;
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

export interface AdminRequestDetailResponse {
  request: AdminRequestItem;
  user?: { id: number; name: string; phone: string; address: string } | null;
  member?: { id: number; status?: string | null; payment_status?: string | null; amount_paid?: number | null; joined_at?: string | null } | null;
  batch?: AdminBatchCard | null;
  tanker?: AdminTankerCard | null;
  payments: AdminPaymentItem[];
  deliveries: AdminDeliveryCard[];
}

export interface AdminLiveResponse {
  generated_at: string;
  batches: AdminBatchCard[];
  tankers: AdminTankerCard[];
  deliveries: AdminDeliveryCard[];
  priority_requests: AdminRequestItem[];
}

export const loginAdmin = (payload: { username: string; password: string }) =>
  apiRequest<AdminLoginResponse>("/admin-auth/login", {
    method: "POST",
    body: payload,
  });

export const getAdminMe = () => adminRequest<AdminMeResponse>("/admin-auth/me");

export const getAdminOverview = () => adminRequest<AdminOverviewResponse>("/admin/overview");
export const getAdminLive = (limit = 20) => adminRequest<AdminLiveResponse>(`/admin/live?limit=${limit}`);

export const getAdminRequests = (params?: { limit?: number; deliveryType?: string; status?: string; search?: string }) => {
  const q = new URLSearchParams();
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.deliveryType) q.set("delivery_type", params.deliveryType);
  if (params?.status) q.set("status", params.status);
  if (params?.search) q.set("search", params.search);
  return adminRequest<{ items: AdminRequestItem[] }>(`/admin/requests?${q.toString()}`);
};

export const getAdminRequestDetail = (requestId: number) =>
  adminRequest<AdminRequestDetailResponse>(`/admin/requests/${requestId}`);

export const getAdminPayments = (params?: { limit?: number; status?: string; search?: string }) => {
  const q = new URLSearchParams();
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.status) q.set("status", params.status);
  if (params?.search) q.set("search", params.search);
  return adminRequest<{ items: AdminPaymentItem[] }>(`/admin/payments?${q.toString()}`);
};

export const getAdminTankers = (params?: { limit?: number; status?: string; search?: string }) => {
  const q = new URLSearchParams();
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.status) q.set("status", params.status);
  if (params?.search) q.set("search", params.search);
  return adminRequest<{ items: AdminTankerCard[] }>(`/admin/tankers?${q.toString()}`);
};

export const getAdminDeliveries = (params?: { limit?: number; status?: string; jobType?: string; search?: string }) => {
  const q = new URLSearchParams();
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.status) q.set("status", params.status);
  if (params?.jobType) q.set("job_type", params.jobType);
  if (params?.search) q.set("search", params.search);
  return adminRequest<{ items: AdminDeliveryCard[] }>(`/admin/deliveries?${q.toString()}`);
};

export const adminForceExpireBatch = (batchId: number, refundPaidMembers = true) =>
  adminRequest(`/admin/batches/${batchId}/expire?refund_paid_members=${refundPaidMembers}`, { method: "POST" });

export const adminForceOfferBatch = (batchId: number, tankerId: number) =>
  adminRequest(`/admin/batches/${batchId}/offer/${tankerId}`, { method: "POST" });

export const adminRefundMember = (memberId: number) =>
  adminRequest(`/admin/batch-members/${memberId}/refund`, { method: "POST" });

export const adminResetTanker = (tankerId: number) =>
  adminRequest(`/admin/tankers/${tankerId}/reset`, { method: "POST" });

export const adminCleanupExpired = () =>
  adminRequest(`/admin/maintenance/cleanup-expired`, { method: "POST" });

export const adminManualCompleteDelivery = (
  deliveryId: number,
  payload?: { notes?: string; actual_liters_delivered?: number }
) =>
  adminRequest(`/admin/deliveries/${deliveryId}/complete-manual`, {
    method: "POST",
    body: payload || {},
  });

export const adminManualFailDelivery = (deliveryId: number, reason: string) =>
  adminRequest(`/admin/deliveries/${deliveryId}/fail-manual`, {
    method: "POST",
    body: { reason },
  });

export const adminManualSkipDelivery = (deliveryId: number, reason: string) =>
  adminRequest(`/admin/deliveries/${deliveryId}/skip-manual`, {
    method: "POST",
    body: { reason },
  });