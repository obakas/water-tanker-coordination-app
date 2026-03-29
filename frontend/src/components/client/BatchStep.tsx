import { Copy, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BatchLifecycleCard } from "@/components/client/BatchLifecycleCard";
import type { BatchLiveResponse } from "@/lib/batches";

interface BatchStepProps {
    otp: string;
    selectedSize: number | null;
    price: number;
    onCopyOtp: () => void;
    onViewTanker: () => void;
    onLeaveBatch: () => void;
    batchId?: number | null;
    requestId?: number | null;
    paymentDeadline?: string | null;
    liveBatch?: BatchLiveResponse | null;
    liveBatchLoading?: boolean;
    liveBatchError?: string | null;
}

const BatchStep = ({
    otp,
    selectedSize,
    price,
    onCopyOtp,
    onViewTanker,
    onLeaveBatch,
    batchId = null,
    paymentDeadline = null,
    liveBatch = null,
    liveBatchLoading = false,
    liveBatchError = null,
}: BatchStepProps) => {
    return (
        <div className="space-y-6">
            <div className="bg-primary/5 rounded-xl border border-primary/20 p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">Your Delivery OTP</p>

                <div className="flex items-center justify-center gap-3">
                    <span className="text-4xl font-extrabold tracking-[0.3em] text-primary">
                        {otp}
                    </span>

                    <button onClick={onCopyOtp} className="text-primary hover:text-primary/70">
                        <Copy className="h-5 w-5" />
                    </button>
                </div>

                <p className="text-xs text-muted-foreground mt-3">
                    Share this with the driver to confirm delivery
                </p>
            </div>

            {paymentDeadline && (
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Payment deadline: {paymentDeadline}</span>
                    </div>
                </div>
            )}

            {batchId && liveBatchLoading && !liveBatch && (
                <div className="bg-card rounded-xl border border-border p-5">
                    <p className="text-sm text-muted-foreground">Loading live batch status...</p>
                </div>
            )}

            {batchId && liveBatchError && (
                <div className="bg-card rounded-xl border border-destructive/30 p-5">
                    <p className="text-sm text-destructive">{liveBatchError}</p>
                </div>
            )}

            {batchId && liveBatch && (
                <BatchLifecycleCard batch={liveBatch} isLoading={liveBatchLoading} />
            )}

            <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="font-semibold text-foreground mb-3">Your Order</h3>

                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery type</span>
                    <span className="text-foreground font-medium">Batch Saver</span>
                </div>

                <div className="flex justify-between text-sm mt-2">
                    <span className="text-muted-foreground">Quantity</span>
                    <span className="text-foreground font-medium">
                        {selectedSize?.toLocaleString()}L
                    </span>
                </div>

                <div className="flex justify-between text-sm mt-2">
                    <span className="text-muted-foreground">Amount paid</span>
                    <span className="text-foreground font-medium">
                        ₦{price.toLocaleString()}
                    </span>
                </div>
            </div>

            <div className="space-y-3">
                <Button
                    variant="success"
                    className="w-full h-14 rounded-xl text-base"
                    onClick={onViewTanker}
                    disabled={
                        !liveBatch ||
                        !["assigned", "loading", "delivering", "completed"].includes(liveBatch.status)
                    }
                >
                    {liveBatch && ["assigned", "loading", "delivering", "completed"].includes(liveBatch.status)
                        ? "View Tanker"
                        : "Waiting for Tanker"}
                </Button>

                <Button
                    variant="outline"
                    className="w-full h-12 rounded-xl text-base border-destructive/30 text-destructive hover:bg-destructive/5"
                    onClick={onLeaveBatch}
                    disabled={
                        liveBatch?.status === "assigned" ||
                        liveBatch?.status === "loading" ||
                        liveBatch?.status === "delivering"
                    }
                >
                    Leave Batch
                </Button>
            </div>
        </div>
    );
};

export default BatchStep;