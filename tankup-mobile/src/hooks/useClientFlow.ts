import { useMemo, useState } from "react";
import { Alert } from "react-native";
import { createWaterRequest, type CreateRequestResponse } from "@/src/lib/api";
import {
  BATCH_PRICE_PER_LITER,
  PLATFORM_BATCH_COMMISSION_RATE,
  PLATFORM_PRIORITY_COMMISSION_RATE,
  PRIORITY_FULL_TANKER_PRICE,
} from "@/src/constants/tankupTheme";
import type { ClientStep, PriorityMode, RequestMode } from "@/types/client";

export function useClientFlow({ onBack }: { onBack?: () => void } = {}) {
  const [step, setStep] = useState<ClientStep>("request");
  const [requestMode, setRequestMode] = useState<RequestMode>("batch");
  const [priorityMode, setPriorityMode] = useState<PriorityMode>("asap");
  const [scheduledFor, setScheduledFor] = useState("");
  const [selectedSize, setSelectedSize] = useState<number | null>(2000);
  const [address, setAddress] = useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [createdRequest, setCreatedRequest] = useState<CreateRequestResponse | null>(null);
  const [otp] = useState("482913");

  const price = useMemo(() => {
    if (requestMode === "priority") {
      return PRIORITY_FULL_TANKER_PRICE * (1 + PLATFORM_PRIORITY_COMMISSION_RATE);
    }
    return selectedSize
      ? selectedSize * BATCH_PRICE_PER_LITER * (1 + PLATFORM_BATCH_COMMISSION_RATE)
      : 0;
  }, [requestMode, selectedSize]);

  const canContinueToPayment = Boolean(
    selectedSize && address.trim() && (requestMode === "batch" || priorityMode === "asap" || scheduledFor)
  );

  const pageTitle =
    step === "request"
      ? "Request Water"
      : step === "payment"
        ? "Payment"
        : step === "batch"
          ? "Batch Progress"
          : step === "tanker"
            ? "Tanker Tracking"
            : step === "delivery"
              ? "Delivery Confirmation"
              : "Completed";

  function handleContinueToPayment() {
    if (!canContinueToPayment) {
      Alert.alert("Missing details", "Select tank size, enter address, and complete timing details.");
      return;
    }
    setStep("payment");
  }

  async function handlePayment() {
    if (!selectedSize) return;

    try {
      setIsSubmittingRequest(true);
      const response = await createWaterRequest({
        user_id: 1,
        liquid_id: 1,
        volume_liters: selectedSize,
        latitude: 9.0765,
        longitude: 7.3986,
        delivery_type: requestMode,
        ...(requestMode === "priority"
          ? {
              is_asap: priorityMode === "asap",
              ...(priorityMode === "scheduled" && scheduledFor ? { scheduled_for: scheduledFor } : {}),
            }
          : {}),
      });

      setCreatedRequest(response);
      setStep(requestMode === "batch" ? "batch" : "tanker");
    } catch (error) {
      Alert.alert("Request failed", error instanceof Error ? error.message : "Could not create request");
    } finally {
      setIsSubmittingRequest(false);
    }
  }

  function handleCancelBeforePayment() {
    if (step === "request") {
      onBack?.();
      return;
    }
    setStep("request");
  }

  function resetClientFlow() {
    setStep("request");
    setRequestMode("batch");
    setPriorityMode("asap");
    setScheduledFor("");
    setSelectedSize(2000);
    setAddress("");
    setCreatedRequest(null);
  }

  return {
    step,
    setStep,
    requestMode,
    setRequestMode,
    priorityMode,
    setPriorityMode,
    scheduledFor,
    setScheduledFor,
    selectedSize,
    setSelectedSize,
    address,
    setAddress,
    otp,
    price,
    canContinueToPayment,
    pageTitle,
    isSubmittingRequest,
    createdRequest,
    handleContinueToPayment,
    handlePayment,
    handleCancelBeforePayment,
    resetClientFlow,
  };
}
