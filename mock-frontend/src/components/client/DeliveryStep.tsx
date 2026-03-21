import { Truck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RequestMode } from "@/types/client";

interface DeliveryStepProps {
    requestMode: RequestMode;
    otp: string;
    onConfirm: () => void;
}

const DeliveryStep = ({ requestMode, otp, onConfirm }: DeliveryStepProps) => {
    return (
        <div className="space-y-6">
            <div className="text-center py-6">
                <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Truck className="h-10 w-10 text-warning" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                    {requestMode === "priority" ? "Your Delivery Has Arrived!" : "Tanker Has Arrived!"}
                </h2>
                <p className="text-muted-foreground mt-2">
                    Share your OTP with the driver to confirm delivery
                </p>
            </div>

            <div className="bg-primary/5 rounded-xl border border-primary/20 p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">Your OTP</p>
                <div className="flex items-center justify-center gap-3">
                    <span className="text-5xl font-extrabold tracking-[0.3em] text-primary">
                        {otp}
                    </span>
                </div>
            </div>

            <Button
                variant="success"
                className="w-full h-14 rounded-xl text-base"
                onClick={onConfirm}
            >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Delivery Confirmed
            </Button>
        </div>
    );
};

export default DeliveryStep;