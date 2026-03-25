// export type DriverStep = "available" | "loading" | "delivering" | "completed";

// export type DeliveryType = "batch" | "priority";

// export type DriverJobStatus = "assigned" | "loading" | "delivering" | "completed";

// export interface DeliveryStop {
//   requestId: number;
//   name: string;
//   phone: string;
//   address: string;
//   liters: number;
//   otp: string;
//   delivered: boolean;
//   latitude?: number;
//   longitude?: number;
// }

// export interface DriverJob {
//   id: string;
//   tankerId: number;
//   deliveryType: DeliveryType;
//   status: DriverJobStatus;
//   area: string;
//   totalLiters: number;
//   earnings: number;
//   scheduledFor?: string;
//   stops: DeliveryStop[];
// }

// export const MOCK_BATCH_JOB: DriverJob = {
//   id: "B-2847",
//   tankerId: 1,
//   deliveryType: "batch",
//   status: "assigned",
//   area: "Lekki Phase 1",
//   totalLiters: 10000,
//   earnings: 50000,
//   stops: [
//     {
//       requestId: 101,
//       name: "Adewale O.",
//       phone: "08030000001",
//       address: "12 Admiralty Way, Lekki Phase 1",
//       liters: 2000,
//       otp: "4829",
//       delivered: false,
//     },
//     {
//       requestId: 102,
//       name: "Chioma N.",
//       phone: "08030000002",
//       address: "5 Fola Osibo St, Lekki Phase 1",
//       liters: 1500,
//       otp: "7361",
//       delivered: false,
//     },
//     {
//       requestId: 103,
//       name: "Grace T.",
//       phone: "08030000003",
//       address: "Plot 8, Bisola Durosinmi-Etti Dr",
//       liters: 2000,
//       otp: "1954",
//       delivered: false,
//     },
//     {
//       requestId: 104,
//       name: "Yusuf M.",
//       phone: "08030000004",
//       address: "3 Agungi Ajiran Rd, Lekki",
//       liters: 2500,
//       otp: "6482",
//       delivered: false,
//     },
//     {
//       requestId: 105,
//       name: "Fatima B.",
//       phone: "08030000005",
//       address: "Block C, Ikate Elegushi",
//       liters: 2000,
//       otp: "3197",
//       delivered: false,
//     },
//   ],
// };

// export const MOCK_PRIORITY_JOB: DriverJob = {
//   id: "P-3901",
//   tankerId: 1,
//   deliveryType: "priority",
//   status: "assigned",
//   area: "Lekki",
//   totalLiters: 10000,
//   earnings: 50000,
//   scheduledFor: "2026-03-23T14:30:00",
//   stops: [
//     {
//       requestId: 201,
//       name: "David A.",
//       phone: "08030000006",
//       address: "22 Freedom Way, Lekki Phase 1",
//       liters: 10000,
//       otp: "4321",
//       delivered: false,
//     },
//   ],
// };


export type DriverStep =
  | "offline"
  | "available"
  | "assigned"
  | "loading"
  | "delivering"
  | "arrived"
  | "completed";

export type DriverJobType = "batch" | "priority";

export type DriverJobStatus =
  | "assigned"
  | "loading"
  | "delivering"
  | "arrived"
  | "completed";

export type DriverStop = {
  id: number;
  name: string;
  address: string;
  phone?: string;
  volumeLiters: number;
  otp?: string;
  delivered: boolean;
  latitude?: number;
  longitude?: number;
};

export type DriverJob = {
  batchId: number;
  jobType: DriverJobType;
  status: DriverJobStatus;
  liquidName?: string;
  totalVolumeLiters?: number;
  stops: DriverStop[];
};