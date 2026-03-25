import { Button } from "@/components/ui/button";
import { CheckCircle2, MapPin } from "lucide-react";
import { DeliveryProgress } from "@/components/driver/DeliveryProgress";
import { CurrentDeliveryCard } from "@/components/driver/CurrentDeliveryCard";
import { DeliveryList } from "@/components/driver/DeliveryList";
import type { DriverJob, DriverStop } from "@/types/driver";

interface DriverDeliveringStepProps {
  job: DriverJob;
  deliveries: DriverStop[];
  activeDeliveryIdx: number;
  currentDelivery: DriverStop | null;
  deliveredCount: number;
  allDelivered: boolean;
  otpInput: string;
  isLoading: boolean;
  onOtpChange: (value: string) => void;
  onMarkArrived: () => void | Promise<void>;
  onCompleteDelivery: () => void | Promise<void>;
}

export const DriverDeliveringStep = ({
  job,
  deliveries,
  activeDeliveryIdx,
  currentDelivery,
  deliveredCount,
  allDelivered,
  otpInput,
  isLoading,
  onOtpChange,
  onMarkArrived,
  onCompleteDelivery,
}: DriverDeliveringStepProps) => {
  const isArrived = job.status === "arrived";

  return (
    <div className="space-y-6">
      <DeliveryProgress
        deliveredCount={deliveredCount}
        totalCount={deliveries.length}
      />

      {!allDelivered && currentDelivery && (
        <CurrentDeliveryCard
          delivery={currentDelivery}
          otpInput={otpInput}
          onOtpChange={onOtpChange}
          onConfirm={isArrived ? onCompleteDelivery : onMarkArrived}
          confirmLabel={isArrived ? "Confirm Delivery" : "Mark as Arrived"}
          isLoading={isLoading}
          showOtpInput={isArrived}
        />
      )}

      <DeliveryList
        deliveries={deliveries}
        activeDeliveryIdx={activeDeliveryIdx}
      />

      {allDelivered && (
        <Button
          variant="success"
          className="h-14 w-full rounded-xl text-base"
          onClick={onCompleteDelivery}
          disabled={isLoading}
        >
          <CheckCircle2 className="mr-2 h-5 w-5" />
          {isLoading ? "Completing..." : "Finish Delivery"}
        </Button>
      )}

      {!isArrived && currentDelivery && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <MapPin className="h-4 w-4" />
            Current stop
          </div>
          <p className="text-sm text-muted-foreground">
            When you reach the customer’s address, mark yourself as arrived before confirming delivery.
          </p>
        </div>
      )}
    </div>
  );
};

