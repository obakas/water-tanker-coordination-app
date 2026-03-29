import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export default function ExpiredBatchStep({
    liveBatch,
    memberId,
    onBackHome,
    refreshLiveBatch,
}) {
    const [isRefunding, setIsRefunding] = useState(false);

    const refundEligible = liveBatch?.refund_eligible ?? false;
    const refundStatus = liveBatch?.refund_status ?? "none";

    const handleRefund = async () => {
        if (!memberId) return;

        try {
            setIsRefunding(true);

            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/refunds/batch-members/${memberId}`,
                { method: "POST" }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || "Refund failed");
            }

            toast.success(
                data.already_refunded
                    ? "Refund already processed"
                    : "Refund successful"
            );

            await refreshLiveBatch?.();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Refund failed");
        } finally {
            setIsRefunding(false);
        }
    };

    return (
        <div className="space-y-6 text-center">
            <h2 className="text-xl font-bold">Batch Expired</h2>

            {/* Refund states */}
            {!refundEligible && refundStatus === "none" && (
                <p>No refund available.</p>
            )}

            {refundEligible && refundStatus === "none" && (
                <Button onClick={handleRefund} disabled={isRefunding}>
                    {isRefunding ? "Processing..." : "Claim Refund"}
                </Button>
            )}

            {refundStatus === "processing" && <p>Processing refund...</p>}

            {refundStatus === "refunded" && (
                <p className="text-green-600">Refund completed ✅</p>
            )}

            {refundStatus === "failed" && (
                <div>
                    <p className="text-red-500">Refund failed</p>
                    <Button onClick={handleRefund}>Retry</Button>
                </div>
            )}

            {refundStatus === "forfeited" && (
                <p>You forfeited this batch earlier.</p>
            )}

            <Button variant="secondary" onClick={onBackHome}>
                Back Home
            </Button>
        </div>
    );
}