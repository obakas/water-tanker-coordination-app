import { Truck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RequestMode } from "@/types/client";
import { formatScheduledDateTime } from "@/lib/utils";

interface TankerStepProps {
  requestMode: RequestMode;
  priorityMode?: "asap" | "scheduled";
  scheduledFor?: string;
  selectedSize: number;
  onArrived: () => void;
}

const TankerStep = ({
    requestMode,
    priorityMode,
    scheduledFor,
    selectedSize,
    onArrived,
}: TankerStepProps) => {
    const batchSteps = [
        { label: "Tanker accepted batch", done: true },
        { label: "Loading water", done: true },
        { label: "Water loaded — en route", done: true },
        { label: "Delivering to members", done: false, active: true },
    ];

    const prioritySteps = [
        { label: "Priority request accepted", done: true },
        { label: "Scheduling your delivery", done: true },
        { label: "Tanker loaded and en route", done: false, active: true },
    ];

    const steps = requestMode === "batch" ? batchSteps : prioritySteps;

    return (
        <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center">
                        <Truck className="h-7 w-7 text-success" />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground text-lg">
                            {requestMode === "priority"
                                ? "Priority Delivery Scheduled"
                                : "Tanker Assigned"}
                        </h3>
                        <p className="text-sm text-muted-foreground">Toyota Dyna • ABC-123-XY</p>
                    </div>
                </div>

                {requestMode === "priority" && formatScheduledDateTime(scheduledFor) && (
                    <div className="mb-5 rounded-xl bg-warning/5 border border-warning/20 p-4">
                        <p className="text-sm text-muted-foreground">Preferred delivery period</p>
                        <p className="font-semibold text-foreground mt-1">{formatScheduledDateTime(scheduledFor)}</p>
                    </div>
                )}

                <div className="space-y-4">
                    {steps.map((s, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${s.done
                                        ? "bg-success"
                                        : s.active
                                            ? requestMode === "priority"
                                                ? "bg-warning animate-pulse"
                                                : "bg-primary animate-pulse"
                                            : "bg-secondary"
                                    }`}
                            >
                                {s.done ? (
                                    <CheckCircle2 className="h-4 w-4 text-success-foreground" />
                                ) : (
                                    <span
                                        className={`text-xs font-bold ${s.active ? "text-primary-foreground" : "text-muted-foreground"
                                            }`}
                                    >
                                        {i + 1}
                                    </span>
                                )}
                            </div>

                            <span
                                className={`text-sm ${s.done
                                        ? "text-foreground"
                                        : s.active
                                            ? requestMode === "priority"
                                                ? "text-warning font-semibold"
                                                : "text-primary font-semibold"
                                            : "text-muted-foreground"
                                    }`}
                            >
                                {s.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {requestMode === "batch" && (
                <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="font-semibold text-foreground mb-3">Delivery Queue</h3>
                    <div className="space-y-3">
                        {[
                            { name: "Adewale O.", liters: 2000, status: "Delivered" },
                            { name: "Chioma N.", liters: 1500, status: "Delivering" },
                            { name: "You", liters: selectedSize ?? 0, status: "Next" },
                            { name: "Fatima B.", liters: 2000, status: "Waiting" },
                        ].map((m, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`w-2 h-2 rounded-full ${m.status === "Delivered"
                                                ? "bg-success"
                                                : m.status === "Delivering"
                                                    ? "bg-warning"
                                                    : m.status === "Next"
                                                        ? "bg-primary"
                                                        : "bg-muted-foreground/30"
                                            }`}
                                    />
                                    <span
                                        className={`${m.name === "You" ? "font-bold text-primary" : "text-foreground"
                                            }`}
                                    >
                                        {m.name}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="text-muted-foreground">
                                        {m.liters.toLocaleString()}L
                                    </span>
                                    <span
                                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${m.status === "Delivered"
                                                ? "bg-success/10 text-success"
                                                : m.status === "Delivering"
                                                    ? "bg-warning/10 text-warning"
                                                    : m.status === "Next"
                                                        ? "bg-primary/10 text-primary"
                                                        : "bg-secondary text-muted-foreground"
                                            }`}
                                    >
                                        {m.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Button
                variant="hero"
                className="w-full h-14 rounded-xl text-base"
                onClick={onArrived}
            >
                {requestMode === "priority" ? "Driver Is Arriving" : "Tanker Is Here"}
            </Button>
        </div>
    );
};

export default TankerStep;