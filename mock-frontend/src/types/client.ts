export type ClientStep =
  | "request"
  | "payment"
  | "batch"
  | "tanker"
  | "delivery"
  | "completed";

export type RequestMode = "batch" | "priority";

export interface ClientViewProps {
  onBack: () => void;
}