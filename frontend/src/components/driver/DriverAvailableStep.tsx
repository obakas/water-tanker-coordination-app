import { Truck, MapPin, Droplets, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Batch } from "@/types/driver";
import { MOCK_BATCH } from "@/types/driver";

interface DriverAvailableStepProps {
  isOnline: boolean;
  batch: Batch;
  onAcceptBatch: () => void;
}

export const DriverAvailableStep = ({ isOnline, batch, onAcceptBatch }: DriverAvailableStepProps) => {
  if (!isOnline) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
          <Truck className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground">You're Offline</h2>
        <p className="text-muted-foreground mt-2">Go online to see available batches</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
          <Truck className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-xl font-bold text-foreground">You're Online</h2>
        <p className="text-sm text-muted-foreground">Looking for available batches...</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">New Batch</span>
          <span className="text-xs text-muted-foreground">{batch.id}</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">{batch.area}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Droplets className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">{batch.totalLiters.toLocaleString()}L total</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">{batch.members} deliveries</span>
          </div>
        </div>

        <div className="bg-success/5 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">You'll earn</p>
          <p className="text-2xl font-extrabold text-success">{batch.earnings}</p>
        </div>

        <Button variant="success" className="w-full h-12 rounded-xl" onClick={onAcceptBatch}>
          Accept Batch
        </Button>
      </div>
    </div>
  );
};