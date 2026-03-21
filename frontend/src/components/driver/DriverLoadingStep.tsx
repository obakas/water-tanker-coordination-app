import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Batch } from "@/types/driver";

interface DriverLoadingStepProps {
  batch: Batch;
  onStartDeliveries: () => void;
}

export const DriverLoadingStep = ({ batch, onStartDeliveries }: DriverLoadingStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-3">
          <Loader2 className="h-8 w-8 text-warning animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Loading Water</h2>
        <p className="text-sm text-muted-foreground">Update your status when ready</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-5 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Batch</span>
          <span className="font-medium text-foreground">{batch.id}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total volume</span>
          <span className="font-medium text-foreground">{batch.totalLiters.toLocaleString()}L</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Deliveries</span>
          <span className="font-medium text-foreground">{batch.members} stops</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Area</span>
          <span className="font-medium text-foreground">{batch.area}</span>
        </div>
      </div>

      <Button variant="warning" className="w-full h-14 rounded-xl text-base" onClick={onStartDeliveries}>
        <CheckCircle2 className="h-5 w-5 mr-2" />
        Water Loaded — Start Deliveries
      </Button>
    </div>
  );
};