import { CheckCircle2, Circle, Truck, Users, Droplets, Loader2 } from "lucide-react";
import type { BatchLiveResponse } from "@/lib/batches";

interface BatchLifecycleCardProps {
    batch: BatchLiveResponse;
    isLoading?: boolean;
}

const steps = [
    "forming",
    "near_ready",
    "ready_for_assignment",
    "assigned",
    "loading",
    "delivering",
    "completed",
];

const stepLabels: Record<string, string> = {
    forming: "Forming",
    near_ready: "Near Ready",
    ready_for_assignment: "Ready for Assignment",
    assigned: "Assigned",
    loading: "Loading",
    delivering: "Delivering",
    completed: "Completed",
    expired: "Expired",
};

export function BatchLifecycleCard({ batch, isLoading = false }: BatchLifecycleCardProps) {
    const currentIndex = steps.indexOf(batch.status);

    return (
        <div className="rounded-2xl border bg-card p-5 space-y-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold">Batch Progress</h3>
                    <p className="text-sm text-muted-foreground">{batch.next_action_hint}</p>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>{stepLabels[batch.status]}</span>
                </div>
            </div>

            <div className="space-y-3">
                {steps.map((step, index) => {
                    const isDone = currentIndex >= index;
                    const isCurrent = batch.status === step;

                    return (
                        <div key={step} className="flex items-center gap-3">
                            <div>
                                {isDone ? (
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground" />
                                )}
                            </div>

                            <div className="flex-1">
                                <p className={`text-sm ${isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                                    {stepLabels[step]}
                                </p>
                            </div>
                        </div>
                    );
                })}

                {batch.status === "expired" && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                        <p className="text-sm font-medium text-destructive">This batch expired before dispatch.</p>
                    </div>
                )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <Droplets className="h-4 w-4" />
                        <span>Volume</span>
                    </div>
                    <p className="text-2xl font-bold">{batch.fill_percentage}%</p>
                    <p className="text-sm text-muted-foreground">
                        {batch.current_volume}L / {batch.target_volume}L filled
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {batch.remaining_volume}L remaining
                    </p>
                </div>

                <div className="rounded-xl border p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <Users className="h-4 w-4" />
                        <span>Members</span>
                    </div>
                    <p className="text-2xl font-bold">{batch.member_count}</p>
                    <p className="text-sm text-muted-foreground">
                        {batch.paid_member_count} paid / {batch.unpaid_member_count} unpaid
                    </p>
                </div>

                <div className="rounded-xl border p-4">
                    <p className="text-sm font-medium">Health Score</p>
                    <p className="text-2xl font-bold">{batch.health_score}</p>
                    <p className="text-sm text-muted-foreground">
                        Payment ratio: {batch.payment_ratio}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Geo compactness: {batch.geo_compactness}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Wait urgency: {batch.wait_urgency}
                    </p>
                </div>

                <div className="rounded-xl border p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <Truck className="h-4 w-4" />
                        <span>Dispatch</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Search radius: {batch.search_radius_km ?? 1} km
                    </p>

                    {batch.assigned_tanker ? (
                        <>
                            <p className="mt-2 font-semibold">{batch.assigned_tanker.driver_name}</p>
                            <p className="text-sm text-muted-foreground">
                                {batch.assigned_tanker.tank_plate_number}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {batch.assigned_tanker.phone}
                            </p>
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground">No tanker assigned yet</p>
                    )}
                </div>
            </div>

            {batch.delivery_plan.length > 0 && (
                <div className="rounded-xl border p-4 space-y-3">
                    <h4 className="font-semibold">Delivery Plan</h4>
                    <div className="space-y-2">
                        {batch.delivery_plan.map((stop) => (
                            <div
                                key={stop.member_id}
                                className="flex items-center justify-between rounded-lg border p-3"
                            >
                                <div>
                                    <p className="font-medium">Stop #{stop.sequence}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Member #{stop.member_id}
                                    </p>
                                </div>
                                <div className="text-right text-sm text-muted-foreground">
                                    <p>{stop.volume_liters ?? 0}L</p>
                                    <p>
                                        {stop.latitude}, {stop.longitude}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}