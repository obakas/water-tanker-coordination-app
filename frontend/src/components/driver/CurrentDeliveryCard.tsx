import { Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DeliveryMember } from "@/types/driver";

interface CurrentDeliveryCardProps {
  delivery: DeliveryMember;
  otpInput: string;
  onOtpChange: (value: string) => void;
  onConfirm: () => void;
}

export const CurrentDeliveryCard = ({
  delivery,
  otpInput,
  onOtpChange,
  onConfirm,
}: CurrentDeliveryCardProps) => {
  return (
    <div className="bg-primary/5 rounded-xl border border-primary/20 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
          Current Delivery
        </span>
        <span className="text-sm font-medium text-foreground">{delivery.liters.toLocaleString()}L</span>
      </div>

      <div>
        <h3 className="font-bold text-foreground text-lg">{delivery.name}</h3>
        <div className="flex items-start gap-2 mt-1">
          <Navigation className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">{delivery.address}</p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Enter Client OTP</label>
        <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 font-mono">
          🐞 Debug: OTP is <span className="font-bold text-primary">{delivery.otp}</span>
        </p>
        <div className="flex gap-3">
          <Input
            value={otpInput}
            onChange={(e) => onOtpChange(e.target.value)}
            placeholder="Enter 4-digit OTP"
            maxLength={4}
            className="h-12 rounded-lg text-center text-lg tracking-[0.3em] font-bold"
          />
          <Button
            variant="success"
            className="h-12 px-6 rounded-lg"
            onClick={onConfirm}
            disabled={otpInput.length !== 4}
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};