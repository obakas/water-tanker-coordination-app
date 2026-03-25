// import api from "@/lib/api";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
import type { DriverJob } from "@/types/driver";
import { mapCurrentJobResponseToDriverJob } from "@/lib/driverMappers";


const api = {
  get: async (url: string) => {
    const response = await fetch(`${API_BASE_URL}${url}`);
    return response.json();
  },
  post: async (url: string, data?: any) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};


export async function getCurrentDriverJob(
  driverId: number
): Promise<DriverJob | null> {
  const response = await api.get(`/tankers/${driverId}/current-job`);
  return mapCurrentJobResponseToDriverJob(response.data);
}

export async function acceptDriverBatch(
  driverId: number,
  batchId: number
): Promise<void> {
  await api.post(`/tankers/${driverId}/accept/${batchId}`);
}

export async function markDriverLoaded(
  driverId: number,
  batchId: number
): Promise<void> {
  await api.post(`/tankers/${driverId}/loaded/${batchId}`);
}

export async function markDriverArrived(
  driverId: number,
  batchId: number
): Promise<void> {
  await api.post(`/tankers/${driverId}/arrived/${batchId}`);
}

export async function completeDriverBatch(
  driverId: number,
  batchId: number,
  otp: string
): Promise<void> {
  await api.post(`/tankers/${driverId}/complete/${batchId}`, {
    otp,
  });
}

export async function completeDriverPriority(
  driverId: number,
  otp: string
): Promise<void> {
  await api.post(`/tankers/${driverId}/complete-priority`, {
    otp,
  });
}