import type { DeliveryMember, DriverBatch } from "@/types/driver";

export const MOCK_BATCH: DriverBatch = {
  id: "B-2847",
  totalLiters: 10000,
  members: 5,
  area: "Lekki Phase 1",
  earnings: "₦50,000",
};

export const MOCK_DELIVERIES: DeliveryMember[] = [
  {
    name: "Adewale O.",
    address: "12 Admiralty Way, Lekki Phase 1",
    liters: 2000,
    otp: "4829",
    delivered: false,
  },
  {
    name: "Chioma N.",
    address: "5 Fola Osibo St, Lekki Phase 1",
    liters: 1500,
    otp: "7361",
    delivered: false,
  },
  {
    name: "Grace T.",
    address: "Plot 8, Bisola Durosinmi-Etti Dr",
    liters: 2000,
    otp: "1954",
    delivered: false,
  },
  {
    name: "Yusuf M.",
    address: "3 Agungi Ajiran Rd, Lekki",
    liters: 2500,
    otp: "6482",
    delivered: false,
  },
  {
    name: "Fatima B.",
    address: "Block C, Ikate Elegushi",
    liters: 2000,
    otp: "3197",
    delivered: false,
  },
];