import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { DriverUser } from "@/hooks/useDriverAuth";
import type { DriverJob, DriverStep } from "@/types/driver";
import {
  getCurrentDriverJob,
  acceptDriverBatch,
  markDriverLoaded,
  markDriverArrived,
  completeDriverBatch,
  completeDriverPriority,
} from "@/lib/driverApi";

export const useDriverFlow = (driver: DriverUser | null) => {
  const [activeJob, setActiveJob] = useState<DriverJob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [otpInput, setOtpInput] = useState("");

  const tankerId = driver?.tankerId;

  const refreshJob = useCallback(async () => {
    if (!tankerId) {
      setActiveJob(null);
      return;
    }

    try {
      setIsLoading(true);
      const job = await getCurrentDriverJob(tankerId);
      setActiveJob(job);
    } catch (error) {
      console.error("Failed to fetch current driver job:", error);
      setActiveJob(null);
      toast.error("Failed to load current job.");
    } finally {
      setIsLoading(false);
    }
  }, [tankerId]);

  // useEffect(() => {
  //   void refreshJob();
  // }, [refreshJob]);
  useEffect(() => {
    if (!tankerId) return;

    // first fetch immediately
    void refreshJob();

    // then poll every 5 seconds
    const interval = setInterval(() => {
      refreshJob();
    }, 5000);

    return () => clearInterval(interval);
  }, [tankerId, refreshJob]);

  const step: DriverStep = useMemo(() => {
    if (!driver) return "offline";
    if (!activeJob) return "available";

    switch (activeJob.status) {
      case "assigned":
        return "assigned";
      case "loading":
        return "loading";
      case "delivering":
        return "delivering";
      case "arrived":
        return "arrived";
      case "completed":
        return "completed";
      default:
        return "available";
    }
  }, [driver, activeJob]);

  const deliveries = activeJob?.stops ?? [];

  const deliveredCount = useMemo(() => {
    return deliveries.filter((stop) => stop.delivered).length;
  }, [deliveries]);

  const allDelivered =
    deliveries.length > 0 && deliveredCount === deliveries.length;

  const activeDeliveryIdx = useMemo(() => {
    return deliveries.findIndex((stop) => !stop.delivered);
  }, [deliveries]);

  const currentDelivery =
    activeDeliveryIdx >= 0 ? deliveries[activeDeliveryIdx] : null;

  const runAction = useCallback(
    async (action: () => Promise<void>, successMessage: string) => {
      try {
        setIsActionLoading(true);
        await action();
        toast.success(successMessage);
        await refreshJob();
      } catch (error) {
        console.error(error);
        toast.error("Action failed. Please try again.");
      } finally {
        setIsActionLoading(false);
      }
    },
    [refreshJob]
  );

  const acceptJob = useCallback(async () => {
    if (!tankerId) {
      toast.error("Please log in as a driver first.");
      return;
    }

    if (!activeJob) {
      toast.error("No active job found.");
      return;
    }

    if (activeJob.status !== "assigned") {
      toast.error("This job cannot be accepted right now.");
      return;
    }

    await runAction(
      async () => {
        await acceptDriverBatch(tankerId, activeJob.batchId);
      },
      "Job accepted successfully."
    );
  }, [tankerId, activeJob, runAction]);

  const markLoaded = useCallback(async () => {
    if (!tankerId) {
      toast.error("Please log in as a driver first.");
      return;
    }

    if (!activeJob) {
      toast.error("No active job found.");
      return;
    }

    if (activeJob.status !== "loading") {
      toast.error("Job is not in loading state.");
      return;
    }

    await runAction(
      async () => {
        await markDriverLoaded(tankerId, activeJob.batchId);
      },
      "Water loaded. Delivery is now in progress."
    );
  }, [tankerId, activeJob, runAction]);

  const markArrived = useCallback(async () => {
    if (!tankerId) {
      toast.error("Please log in as a driver first.");
      return;
    }

    if (!activeJob) {
      toast.error("No active job found.");
      return;
    }

    if (activeJob.status !== "delivering") {
      toast.error("Job is not yet in delivery state.");
      return;
    }

    await runAction(
      async () => {
        await markDriverArrived(tankerId, activeJob.batchId);
      },
      "Driver marked as arrived."
    );
  }, [tankerId, activeJob, runAction]);

  const completeDelivery = useCallback(async () => {
    if (!tankerId) {
      toast.error("Please log in as a driver first.");
      return;
    }

    if (!activeJob) {
      toast.error("No active job found.");
      return;
    }

    if (activeJob.status !== "arrived") {
      toast.error("You must arrive before completing delivery.");
      return;
    }

    if (activeJob.jobType === "priority") {
      await runAction(
        async () => {
          await completeDriverPriority(tankerId, otpInput.trim());
        },
        "Priority delivery completed successfully."
      );
      setOtpInput("");
      return;
    }

    if (!otpInput.trim()) {
      toast.error("OTP is required.");
      return;
    }

    await runAction(
      async () => {
        await completeDriverBatch(tankerId, activeJob.batchId, otpInput.trim());
      },
      "Delivery completed successfully."
    );

    setOtpInput("");
  }, [tankerId, activeJob, otpInput, runAction]);

  const resetToDashboard = useCallback(() => {
    setActiveJob(null);
    setOtpInput("");
  }, []);

  return {
    step,
    activeJob,
    deliveries,
    deliveredCount,
    allDelivered,
    currentDelivery,
    activeDeliveryIdx,
    otpInput,
    setOtpInput,
    isLoading,
    isActionLoading,
    refreshJob,
    acceptJob,
    markLoaded,
    markArrived,
    completeDelivery,
    resetToDashboard,
  };
};