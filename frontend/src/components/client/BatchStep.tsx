import { Copy, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLiveBatch } from "@/hooks/useLiveBatch";
import { BatchLifecycleCard } from "@/components/client/BatchLifecycleCard";

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
}: BatchStepProps) => {
    const { batch, isLoading, error } = useLiveBatch(batchId, 8000);

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

            {!batchId && (
                <div className="bg-card rounded-xl border border-border p-5">
                    <p className="text-sm text-muted-foreground">
                        No batch has been linked to this request yet.
                    </p>
                </div>
            )}

            {batchId && isLoading && !batch && (
                <div className="bg-card rounded-xl border border-border p-5">
                    <p className="text-sm text-muted-foreground">Loading live batch status...</p>
                </div>
            )}

            {batchId && error && (
                <div className="bg-card rounded-xl border border-destructive/30 p-5">
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            )}

            {batch && <BatchLifecycleCard batch={batch} isLoading={isLoading} />}

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
                    disabled={!batch || !["assigned", "loading", "delivering", "completed"].includes(batch.status)}
                >
                    {batch && ["assigned", "loading", "delivering", "completed"].includes(batch.status)
                        ? "View Tanker"
                        : "Waiting for Tanker"}
                </Button>

                <Button
                    variant="outline"
                    className="w-full h-12 rounded-xl text-base border-destructive/30 text-destructive hover:bg-destructive/5"
                    onClick={onLeaveBatch}
                    disabled={batch?.status === "assigned" || batch?.status === "loading" || batch?.status === "delivering"}
                >
                    Leave Batch
                </Button>
            </div>
        </div>
    );
};

export default BatchStep;

// import { Copy, Users, Clock } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { useLiveBatch } from "@/hooks/useLiveBatch";
// import { BatchLifecycleCard } from "@/components/client/BatchLifecycleCard";

// interface BatchStepProps {
//     otp: string;
//     selectedSize: number | null;
//     price: number;
//     onCopyOtp: () => void;
//     onViewTanker: () => void;
//     onLeaveBatch: () => void;
//     batchId?: number | null;
//     requestId?: number | null;
//     paymentDeadline?: string | null;
// }

// // const { batch, isLoading, error } = useLiveBatch(batchId, 8000);

// const BatchStep = ({
//     otp,
//     selectedSize,
//     price,
//     onCopyOtp,
//     onViewTanker,
//     onLeaveBatch,
// }: BatchStepProps) => {
//     return (
//         <div className="space-y-6">
//             <div className="bg-primary/5 rounded-xl border border-primary/20 p-6 text-center">
//                 <p className="text-sm text-muted-foreground mb-2">Your Delivery OTP</p>
//                 <div className="flex items-center justify-center gap-3">
//                     <span className="text-4xl font-extrabold tracking-[0.3em] text-primary">
//                         {otp}
//                     </span>
//                     <button onClick={onCopyOtp} className="text-primary hover:text-primary/70">
//                         <Copy className="h-5 w-5" />
//                     </button>
//                 </div>
//                 <p className="text-xs text-muted-foreground mt-3">
//                     Share this with the driver to confirm delivery
//                 </p>
//             </div>

//             <div className="bg-card rounded-xl border border-border p-5 space-y-4">
//                 <div className="flex items-center justify-between">
//                     <h3 className="font-semibold text-foreground">Batch Progress</h3>
//                     <span className="text-sm font-medium text-primary">7,500L / 10,000L</span>
//                 </div>

//                 <div className="w-full h-4 bg-secondary rounded-full overflow-hidden">
//                     <div
//                         className="h-full bg-primary rounded-full transition-all duration-700"
//                         style={{ width: "75%" }}
//                     />
//                 </div>

//                 <div className="space-y-2">
//                     <div className="flex items-center gap-2 text-sm">
//                         <Users className="h-4 w-4 text-muted-foreground" />
//                         <span className="text-muted-foreground">4 members in this batch</span>
//                     </div>
//                     <div className="flex items-center gap-2 text-sm">
//                         <Clock className="h-4 w-4 text-muted-foreground" />
//                         <span className="text-muted-foreground">
//                             Waiting for 2,500L more to fill batch
//                         </span>
//                     </div>
//                 </div>
//             </div>

//             <div className="bg-card rounded-xl border border-border p-5">
//                 <h3 className="font-semibold text-foreground mb-3">Your Order</h3>
//                 <div className="flex justify-between text-sm">
//                     <span className="text-muted-foreground">Delivery type</span>
//                     <span className="text-foreground font-medium">Batch Saver</span>
//                 </div>
//                 <div className="flex justify-between text-sm mt-2">
//                     <span className="text-muted-foreground">Quantity</span>
//                     <span className="text-foreground font-medium">
//                         {selectedSize?.toLocaleString()}L
//                     </span>
//                 </div>
//                 <div className="flex justify-between text-sm mt-2">
//                     <span className="text-muted-foreground">Amount paid</span>
//                     <span className="text-foreground font-medium">₦{price.toLocaleString()}</span>
//                 </div>
//             </div>

//             <div className="space-y-3">
//                 <Button
//                     variant="success"
//                     className="w-full h-14 rounded-xl text-base"
//                     onClick={onViewTanker}
//                 >
//                     Batch Filled — View Tanker
//                 </Button>

//                 <Button
//                     variant="outline"
//                     className="w-full h-12 rounded-xl text-base border-destructive/30 text-destructive hover:bg-destructive/5"
//                     onClick={onLeaveBatch}
//                 >
//                     Leave Batch
//                 </Button>
//             </div>
//         </div>
//     );
// };

// export default BatchStep;