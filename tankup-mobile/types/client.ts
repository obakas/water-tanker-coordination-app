export type RequestMode = "batch" | "priority";
export type PriorityMode = "asap" | "scheduled";
export type ClientStep = "request" | "payment" | "batch" | "tanker" | "delivery" | "completed";

export type ClientViewProps = {
  onBack?: () => void;
};
