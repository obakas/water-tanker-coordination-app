import { useState } from "react";
import { toast } from "sonner";
import {MOCK_DELIVERIES } from "@/types/driver";
import {DriverStep, DeliveryMember} from "@/types/driver";

export const useDriverFlow = () => {
  const [step, setStep] = useState<DriverStep>("available");
  const [isOnline, setIsOnline] = useState(false);
  const [deliveries, setDeliveries] = useState<DeliveryMember[]>(MOCK_DELIVERIES);
  const [otpInput, setOtpInput] = useState("");
  const [activeDeliveryIdx, setActiveDeliveryIdx] = useState(0);

  const deliveredCount = deliveries.filter((d) => d.delivered).length;
  const allDelivered = deliveredCount === deliveries.length;
  const currentDelivery = deliveries[activeDeliveryIdx];

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
    toast.success(isOnline ? "You're now offline" : "You're now online!");
  };

  const acceptBatch = () => {
    toast.success("Batch accepted!");
    setStep("loading");
  };

  const startDeliveries = () => {
    toast.success("Water loaded! Delivery addresses are ready.");
    setStep("delivering");
  };

  const confirmDelivery = () => {
    if (otpInput !== currentDelivery.otp) {
      toast.error("Invalid OTP. Please try again.");
      return;
    }

    const updated = [...deliveries];
    updated[activeDeliveryIdx] = { ...updated[activeDeliveryIdx], delivered: true };
    setDeliveries(updated);
    setOtpInput("");
    toast.success(`Delivery to ${currentDelivery.name} confirmed!`);

    // Move to next undelivered
    const nextIdx = updated.findIndex((d, i) => i > activeDeliveryIdx && !d.delivered);
    if (nextIdx !== -1) {
      setActiveDeliveryIdx(nextIdx);
    }
  };

  const completeTrip = () => {
    setStep("completed");
  };

  const resetToDashboard = () => {
    setStep("available");
    setDeliveries(MOCK_DELIVERIES);
    setActiveDeliveryIdx(0);
  };

  return {
    step,
    isOnline,
    deliveries,
    otpInput,
    activeDeliveryIdx,
    deliveredCount,
    allDelivered,
    currentDelivery,
    setOtpInput,
    toggleOnlineStatus,
    acceptBatch,
    startDeliveries,
    confirmDelivery,
    completeTrip,
    resetToDashboard,
    setStep,
  };
};