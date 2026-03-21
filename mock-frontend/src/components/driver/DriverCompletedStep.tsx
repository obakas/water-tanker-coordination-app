import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Batch, DeliveryMember } from "@/types/driver";

interface DriverCompletedStepProps {
  batch: Batch;
  deliveries: DeliveryMember[];
  onBackToDashboard: () => void;
}

export const DriverCompletedStep = ({ batch, deliveries, onBackToDashboard }: DriverCompletedStepProps) => {
  return (
    <div className="space-y-6 text-center py-10">
      <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mx-auto">
        <CheckCircle2 className="h-12 w-12 text-success" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-foreground">Trip Complete!</h2>
        <p className="text-muted-foreground mt-2">All {deliveries.length} deliveries confirmed</p>
      </div>

      <div className="bg-success/5 rounded-xl border border-success/20 p-6">
        <p className="text-sm text-muted-foreground">You earned</p>
        <p className="text-4xl font-extrabold text-success">{batch.earnings}</p>
        <p className="text-xs text-muted-foreground mt-2">Payment has been sent to your account</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-5 text-left">
        <h3 className="font-semibold text-foreground mb-3">Trip Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Batch</span>
            <span className="text-foreground font-medium">{batch.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total delivered</span>
            <span className="text-foreground font-medium">{batch.totalLiters.toLocaleString()}L</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Deliveries</span>
            <span className="text-foreground font-medium">{deliveries.length} completed</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Area</span>
            <span className="text-foreground font-medium">{batch.area}</span>
          </div>
        </div>
      </div>

      <Button variant="hero" className="w-full h-14 rounded-xl text-base" onClick={onBackToDashboard}>
        Back to Dashboard
      </Button>
    </div>
  );
};