import { Truck, MapPin, Droplets, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Batch } from "@/types/driver";

interface DriverAvailableStepProps {
  isOnline: boolean;
  batch: Batch;
  onAcceptBatch: () => void;
  onAcceptPriority: () => void;
}

export const DriverAvailableStep = ({
  isOnline,
  batch,
  onAcceptBatch,
  onAcceptPriority,
}: DriverAvailableStepProps) => {
  if (!isOnline) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
          <Truck className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground">You're Offline</h2>
        <p className="text-muted-foreground mt-2">Go online to see available deliveries</p>
      </div>
    );
  }

  const mockPriority = {
    id: "PRIORITY-001",
    area: "Urgent Delivery Zone",
    totalLiters: 10000,
    members: 1,
    earnings: "₦50,000",
  };

  const renderDeliveryCard = (delivery: typeof batch | typeof mockPriority, type: "batch" | "priority") => (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4" key={delivery.id}>
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            type === "batch" ? "text-primary bg-primary/10" : "text-destructive bg-destructive/10"
          }`}
        >
          {type === "batch" ? "New Batch" : "Priority Delivery"}
        </span>
        <span className="text-xs text-muted-foreground">{delivery.id}</span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground">{delivery.area}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Droplets className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground">{delivery.totalLiters.toLocaleString()}L total</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground">{delivery.members} deliveries</span>
        </div>
      </div>

      <div className="bg-success/5 rounded-lg p-3 text-center">
        <p className="text-xs text-muted-foreground">You'll earn</p>
        <p className="text-2xl font-extrabold text-success">{delivery.earnings}</p>
      </div>

      <Button
        variant={type === "batch" ? "success" : "destructive"}
        className="w-full h-12 rounded-xl"
        onClick={type === "batch" ? onAcceptBatch : onAcceptPriority}
      >
        {type === "batch" ? "Accept Batch" : "Accept Priority"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
          <Truck className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-xl font-bold text-foreground">You're Online</h2>
        <p className="text-sm text-muted-foreground">Looking for available deliveries...</p>
      </div>

      <div className="space-y-4">
        {renderDeliveryCard(batch, "batch")}
        {renderDeliveryCard(mockPriority, "priority")}
      </div>
    </div>
  );
};