import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Activity, ArrowLeft, CircleAlert, Droplets, Moon, RefreshCw, Shield, Sun, Truck, Wallet } from "lucide-react";

import {
    adminCleanupExpired,
    adminForceExpireBatch,
    adminForceOfferBatch,
    adminResetTanker,
    getAdminDeliveries,
    getAdminLive,
    getAdminOverview,
    getAdminPayments,
    getAdminRequests,
    getAdminTankers,
} from "@/lib/admin";
import { formatNigeriaDateTime } from "@/lib/datetime";
import { toast } from "sonner";

const POLL_MS = 10000;

const statusTone = (status?: string | null) => {
    const s = (status || "").toLowerCase();
    if (["completed", "delivered", "paid", "available"].includes(s)) return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    if (["failed", "expired", "cancelled", "skipped", "refunded"].includes(s)) return "bg-red-500/10 text-red-700 dark:text-red-300";
    if (["assigned", "loading", "delivering", "arrived", "awaiting_otp", "measuring"].includes(s)) return "bg-blue-500/10 text-blue-700 dark:text-blue-300";
    return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
};

const formatNumber = (value?: number | null) => new Intl.NumberFormat("en-NG").format(Number(value || 0));

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
    return (
        <section className="rounded-2xl border bg-card p-4 sm:p-5 shadow-sm space-y-4">
            <div>
                <h2 className="text-lg font-bold text-foreground">{title}</h2>
                {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
            </div>
            {children}
        </section>
    );
}

function StatusPill({ status }: { status?: string | null }) {
    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusTone(status)}`}>
            {status || "unknown"}
        </span>
    );
}

export default function AdminDashboard() {
    const queryClient = useQueryClient();
    const [offerBatchId, setOfferBatchId] = useState("");
    const [offerTankerId, setOfferTankerId] = useState("");
    const [expireBatchId, setExpireBatchId] = useState("");
    const [resetTankerId, setResetTankerId] = useState("");
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [theme, setTheme] = useState<"light" | "dark">("light");

    const overviewQuery = useQuery({ queryKey: ["admin-overview"], queryFn: getAdminOverview, refetchInterval: POLL_MS });
    const liveQuery = useQuery({ queryKey: ["admin-live"], queryFn: () => getAdminLive(20), refetchInterval: POLL_MS });
    const requestsQuery = useQuery({ queryKey: ["admin-requests"], queryFn: () => getAdminRequests(30), refetchInterval: POLL_MS });
    const paymentsQuery = useQuery({ queryKey: ["admin-payments"], queryFn: () => getAdminPayments(30), refetchInterval: POLL_MS });
    const tankersQuery = useQuery({ queryKey: ["admin-tankers"], queryFn: () => getAdminTankers(30), refetchInterval: POLL_MS });
    const deliveriesQuery = useQuery({ queryKey: ["admin-deliveries"], queryFn: () => getAdminDeliveries(30), refetchInterval: POLL_MS });

    const loading = [overviewQuery, liveQuery, requestsQuery, paymentsQuery, tankersQuery, deliveriesQuery].some((query) => query.isLoading);
    const hasError = [overviewQuery, liveQuery, requestsQuery, paymentsQuery, tankersQuery, deliveriesQuery].find((query) => query.error);


    useEffect(() => {
        const savedTheme = localStorage.getItem("tankup-theme") as "light" | "dark" | null;

        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.classList.toggle("dark", savedTheme === "dark");
        } else {
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            const initialTheme = prefersDark ? "dark" : "light";
            setTheme(initialTheme);
            document.documentElement.classList.toggle("dark", initialTheme === "dark");
        }

    }, []);

    const toggleTheme = () => {
        const nextTheme = theme === "light" ? "dark" : "light";
        setTheme(nextTheme);
        localStorage.setItem("tankup-theme", nextTheme);
        document.documentElement.classList.toggle("dark", nextTheme === "dark");
    };


    const metricCards = useMemo(() => {
        const totals = overviewQuery.data?.totals || {};
        return [
            { label: "Active batches", value: totals.active_batches ?? 0, icon: Droplets },
            { label: "Active deliveries", value: totals.active_deliveries ?? 0, icon: Activity },
            { label: "Online tankers", value: totals.online_tankers ?? 0, icon: Truck },
            { label: "Payments", value: totals.payments ?? 0, icon: Wallet },
        ];
    }, [overviewQuery.data]);

    const refreshAll = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["admin-overview"] }),
            queryClient.invalidateQueries({ queryKey: ["admin-live"] }),
            queryClient.invalidateQueries({ queryKey: ["admin-requests"] }),
            queryClient.invalidateQueries({ queryKey: ["admin-payments"] }),
            queryClient.invalidateQueries({ queryKey: ["admin-tankers"] }),
            queryClient.invalidateQueries({ queryKey: ["admin-deliveries"] }),
        ]);
    };

    const runAction = async (action: () => Promise<unknown>, successMessage: string) => {
        try {
            setIsActionLoading(true);
            await action();
            toast.success(successMessage);
            await refreshAll();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Action failed");
        } finally {
            setIsActionLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-4 sm:p-6">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex justify-end">
                    <button
                        onClick={toggleTheme}
                        className="h-11 w-11 rounded-full border border-border bg-card flex items-center justify-center text-foreground hover:scale-105 transition"
                        aria-label="Toggle theme"
                    >
                        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </button>
                </div>
                <div className="flex flex-col gap-4 rounded-3xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                            <Shield className="h-4 w-4" />
                            Operations control room
                        </div>
                        <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">Admin Dashboard</h1>
                        <p className="text-sm text-muted-foreground">
                            Live system view for batches, drivers, payments, and delivery flow. No glitter. Just the truth.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back home
                        </Link>
                        <button
                            onClick={refreshAll}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Refresh now
                        </button>
                    </div>
                </div>

                {loading ? <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">Loading admin data…</div> : null}
                {hasError ? (
                    <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-700 dark:text-red-300">
                        {(hasError.error as Error)?.message || "Could not load admin dashboard data."}
                    </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {metricCards.map((item) => {
                        const Icon = item.icon;
                        return (
                            <div key={item.label} className="rounded-2xl border bg-card p-4 shadow-sm">
                                <div className="mb-3 flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">{item.label}</p>
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <p className="text-3xl font-extrabold text-foreground">{formatNumber(item.value)}</p>
                            </div>
                        );
                    })}
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
                    <SectionCard title="Live operations" subtitle={`Updated ${formatNigeriaDateTime(liveQuery.data?.generated_at)}`}>
                        <div className="grid gap-4 lg:grid-cols-3">
                            <div className="space-y-3">
                                <h3 className="font-semibold text-foreground">Active batches</h3>
                                {(liveQuery.data?.batches || []).length === 0 ? <p className="text-sm text-muted-foreground">No active batches.</p> : null}
                                {(liveQuery.data?.batches || []).map((batch) => (
                                    <div key={batch.id} className="rounded-xl border p-3 space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="font-semibold text-foreground">Batch #{batch.id}</div>
                                            <StatusPill status={batch.status} />
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {formatNumber(batch.current_volume)}L / {formatNumber(batch.target_volume)}L • {batch.fill_percent}% full
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Members: {batch.member_count} • Paid: {batch.paid_member_count}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Tanker: {batch.tanker_id ? `#${batch.tanker_id}` : "Unassigned"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Created: {formatNigeriaDateTime(batch.created_at)}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3">
                                <h3 className="font-semibold text-foreground">Active tankers</h3>
                                {(liveQuery.data?.tankers || []).length === 0 ? <p className="text-sm text-muted-foreground">No active tankers.</p> : null}
                                {(liveQuery.data?.tankers || []).map((tanker) => (
                                    <div key={tanker.id} className="rounded-xl border p-3 space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="font-semibold text-foreground">{tanker.driver_name}</div>
                                            <StatusPill status={tanker.status} />
                                        </div>
                                        <p className="text-sm text-muted-foreground">Plate: {tanker.tank_plate_number}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Online: {tanker.is_online ? "Yes" : "No"} • Available: {tanker.is_available ? "Yes" : "No"}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Offer: {tanker.pending_offer_type ? `${tanker.pending_offer_type} #${tanker.pending_offer_id}` : "None"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Last location: {formatNigeriaDateTime(tanker.last_location_update_at)}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3">
                                <h3 className="font-semibold text-foreground">Active deliveries</h3>
                                {(liveQuery.data?.deliveries || []).length === 0 ? <p className="text-sm text-muted-foreground">No active deliveries.</p> : null}
                                {(liveQuery.data?.deliveries || []).map((delivery) => (
                                    <div key={delivery.id} className="rounded-xl border p-3 space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="font-semibold text-foreground">Delivery #{delivery.id}</div>
                                            <StatusPill status={delivery.delivery_status} />
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Job: {delivery.job_type} • Tanker #{delivery.tanker_id} • Stop {delivery.stop_order ?? "—"}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Planned: {formatNumber(delivery.planned_liters)}L • OTP: {delivery.otp_verified ? "Verified" : "Pending"}
                                        </p>
                                        {delivery.anomaly_flagged ? (
                                            <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-300">
                                                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                                                Anomaly flagged. Check this stop before it bites later.
                                            </div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard title="Emergency controls" subtitle="Manual tools for when real life refuses to behave like a demo.">
                        <div className="space-y-4">
                            <div className="rounded-xl border p-4 space-y-3">
                                <h3 className="font-semibold text-foreground">Force offer batch to tanker</h3>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <input value={offerBatchId} onChange={(e) => setOfferBatchId(e.target.value)} placeholder="Batch ID" className="rounded-xl border bg-background px-3 py-2 text-sm" />
                                    <input value={offerTankerId} onChange={(e) => setOfferTankerId(e.target.value)} placeholder="Tanker ID" className="rounded-xl border bg-background px-3 py-2 text-sm" />
                                </div>
                                <button
                                    disabled={isActionLoading || !offerBatchId || !offerTankerId}
                                    onClick={() => runAction(() => adminForceOfferBatch(Number(offerBatchId), Number(offerTankerId)), "Batch offer sent")}
                                    className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                                >
                                    Send offer
                                </button>
                            </div>

                            <div className="rounded-xl border p-4 space-y-3">
                                <h3 className="font-semibold text-foreground">Force expire batch</h3>
                                <input value={expireBatchId} onChange={(e) => setExpireBatchId(e.target.value)} placeholder="Batch ID" className="w-full rounded-xl border bg-background px-3 py-2 text-sm" />
                                <button
                                    disabled={isActionLoading || !expireBatchId}
                                    onClick={() => runAction(() => adminForceExpireBatch(Number(expireBatchId), true), "Batch expired")}
                                    className="rounded-xl bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground disabled:opacity-50"
                                >
                                    Expire batch + refund paid members
                                </button>
                            </div>

                            <div className="rounded-xl border p-4 space-y-3">
                                <h3 className="font-semibold text-foreground">Reset tanker to available</h3>
                                <input value={resetTankerId} onChange={(e) => setResetTankerId(e.target.value)} placeholder="Tanker ID" className="w-full rounded-xl border bg-background px-3 py-2 text-sm" />
                                <button
                                    disabled={isActionLoading || !resetTankerId}
                                    onClick={() => runAction(() => adminResetTanker(Number(resetTankerId)), "Tanker reset")}
                                    className="rounded-xl border px-4 py-2 text-sm font-medium text-foreground disabled:opacity-50"
                                >
                                    Reset tanker
                                </button>
                            </div>

                            <button
                                disabled={isActionLoading}
                                onClick={() => runAction(() => adminCleanupExpired(), "Expired members cleanup triggered")}
                                className="w-full rounded-xl border px-4 py-2 text-sm font-medium text-foreground disabled:opacity-50"
                            >
                                Run expired-member cleanup
                            </button>
                        </div>
                    </SectionCard>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                    <SectionCard title="Requests" subtitle="Recent batch + priority demand coming into the system.">
                        <div className="space-y-3">
                            {(requestsQuery.data?.items || []).map((item) => (
                                <div key={item.id} className="rounded-xl border p-3 space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="font-semibold text-foreground">Request #{item.id}</div>
                                        <StatusPill status={item.status} />
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {item.delivery_type} • User #{item.user_id} • {formatNumber(item.volume_liters)}L
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Retry count: {item.retry_count} • Refund eligible: {item.refund_eligible ? "Yes" : "No"}
                                    </p>
                                    {item.assignment_failed_reason ? (
                                        <p className="text-xs text-red-700 dark:text-red-300">Failure: {item.assignment_failed_reason}</p>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    <SectionCard title="Payments" subtitle={`Paid value: ₦${formatNumber(overviewQuery.data?.payment_value?.paid || 0)}`}>
                        <div className="space-y-3">
                            {(paymentsQuery.data?.items || []).map((item) => (
                                <div key={item.id} className="rounded-xl border p-3 flex items-center justify-between gap-3">
                                    <div>
                                        <div className="font-semibold text-foreground">Payment #{item.id}</div>
                                        <p className="text-sm text-muted-foreground">
                                            User #{item.user_id ?? "—"} • Batch #{item.batch_id ?? "—"} • Member #{item.member_id ?? "—"}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-foreground">₦{formatNumber(item.amount)}</p>
                                        <StatusPill status={item.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                    <SectionCard title="Tankers" subtitle="Driver presence, status, and offer visibility.">
                        <div className="space-y-3">
                            {(tankersQuery.data?.items || []).map((item) => (
                                <div key={item.id} className="rounded-xl border p-3 space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="font-semibold text-foreground">{item.driver_name}</div>
                                        <StatusPill status={item.status} />
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Plate: {item.tank_plate_number} • Phone: {item.phone || "—"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Online: {item.is_online ? "Yes" : "No"} • Available: {item.is_available ? "Yes" : "No"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Pending offer: {item.pending_offer_type ? `${item.pending_offer_type} #${item.pending_offer_id}` : "None"}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    <SectionCard title="Deliveries" subtitle="Last-mile stop truth. This is where the drama lives.">
                        <div className="space-y-3">
                            {(deliveriesQuery.data?.items || []).map((item) => (
                                <div key={item.id} className="rounded-xl border p-3 space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="font-semibold text-foreground">Delivery #{item.id}</div>
                                        <StatusPill status={item.delivery_status} />
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {item.job_type} • Tanker #{item.tanker_id} • User {item.user_name || `#${item.user_id ?? "—"}`}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Planned {formatNumber(item.planned_liters)}L • Actual {item.actual_liters_delivered ? formatNumber(item.actual_liters_delivered) : "—"}L
                                    </p>
                                    <p className="text-xs text-muted-foreground">Updated: {formatNigeriaDateTime(item.updated_at)}</p>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                </div>
            </div>
        </div>
    );
}
