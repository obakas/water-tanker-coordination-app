import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { DeliveryProgress } from "@/components/driver/DeliveryProgress";
import { CurrentDeliveryCard } from "@/components/driver/CurrentDeliveryCard";
import { DeliveryList } from "@/components/driver/DeliveryList";
import { DeliveryMember } from "@/types/driver";

interface DriverDeliveringStepProps {
  deliveries: DeliveryMember[];
  activeDeliveryIdx: number;
  currentDelivery: DeliveryMember | undefined;
  deliveredCount: number;
  allDelivered: boolean;
  otpInput: string;
  onOtpChange: (value: string) => void;
  onConfirmDelivery: () => void;
  onCompleteTrip: () => void;
}

export const DriverDeliveringStep = ({
  deliveries,
  activeDeliveryIdx,
  currentDelivery,
  deliveredCount,
  allDelivered,
  otpInput,
  onOtpChange,
  onConfirmDelivery,
  onCompleteTrip,
}: DriverDeliveringStepProps) => {
  return (
    <div className="space-y-6">
      <DeliveryProgress deliveredCount={deliveredCount} totalCount={deliveries.length} />

      {!allDelivered && currentDelivery && (
        <CurrentDeliveryCard
          delivery={currentDelivery}
          otpInput={otpInput}
          onOtpChange={onOtpChange}
          onConfirm={onConfirmDelivery}
        />
      )}

      <DeliveryList deliveries={deliveries} activeDeliveryIdx={activeDeliveryIdx} />

      {allDelivered && (
        <Button variant="success" className="w-full h-14 rounded-xl text-base" onClick={onCompleteTrip}>
          <CheckCircle2 className="h-5 w-5 mr-2" />
          All Deliveries Complete
        </Button>
      )}
    </div>
  );
};