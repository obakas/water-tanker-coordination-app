export type DriverStep =
  | "available"
  | "loading"
  | "delivering"
  | "completed";

export interface DriverViewProps {
  onBack: () => void;
}

export interface DeliveryMember {
  name: string;
  address: string;
  liters: number;
  otp: string;
  delivered: boolean;
}

export interface DriverBatch {
  id: string;
  totalLiters: number;
  members: number;
  area: string;
  earnings: string;
}