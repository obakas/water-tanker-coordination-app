export type ClientStep =
  | "request"
  | "payment"
  | "batch"
  | "tanker"
  | "delivery"
  | "arrived"
  | "completed"
  | "expired";

export type RequestMode = "batch" | "priority";

export interface ClientViewProps {
  onBack: () => void;
}