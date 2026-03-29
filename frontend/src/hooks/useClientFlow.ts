import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ClientStep, RequestMode } from "@/types/client";
import {
  BATCH_PRICE_PER_LITER,
  PRIORITY_FULL_TANKER_PRICE,
  PLATFORM_PRIORITY_COMMISSION_RATE,
  PLATFORM_BATCH_COMMISSION_RATE,
} from "@/constants/water";
import { useLiveBatch } from "@/hooks/useLiveBatch";
import { createWaterRequest, type UserResponse } from "@/lib/api";
import { leaveBatchMember } from "@/lib/batches";
import { error } from "console";

interface UseClientFlowParams {
  onBack: () => void;
}

type AuthMode = "signup" | "login";

export const useClientFlow = ({ onBack }: UseClientFlowParams) => {
  const [step, setStep] = useState<ClientStep>("request");
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [requestMode, setRequestMode] = useState<RequestMode>("batch");
  const [priorityMode, setPriorityMode] = useState<"asap" | "scheduled">("asap");
  const [scheduledFor, setScheduledFor] = useState<string>("");

  const [showHelp, setShowHelp] = useState(false);
  const [showLeaveBatchWarning, setShowLeaveBatchWarning] = useState(false);
  const [otp, setOtp] = useState(() =>
    Math.floor(1000 + Math.random() * 9000).toString()
  );

  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestId, setRequestId] = useState<number | null>(null);
  const [batchId, setBatchId] = useState<number | null>(null);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [paymentDeadline, setPaymentDeadline] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signup");

  // const {
  //   batch: liveBatch,
  //   isLoading: liveBatchLoading,
  //   hasResolvedOnce,
  //   error: liveBatchError,
  // } = useLiveBatch(batchId ?? null, memberId ?? null, 8000);

  const {
    batch: liveBatch,
    isLoading: liveBatchLoading,
    error: liveBatchError,
    refresh: refreshLiveBatch,
  } = useLiveBatch(batchId, memberId, 8000);


  function resolveClientStep(
    batch: typeof liveBatch,
    fallbackStep: ClientStep
  ): ClientStep {
    if (!batch) return fallbackStep;

    const status = batch.status;

    if (["forming", "near_ready", "ready_for_assignment"].includes(status)) {
      return "batch";
    }

    if (["assigned", "loading"].includes(status)) {
      return "tanker";
    }

    if (status === "delivering") {
      return "delivery";
    }

    if (status === "completed") {
      return "completed";
    }

    if (status === "expired") {
      return "expired";
    }

    return fallbackStep;
  }

  // const resolvedStep = resolveClientStep(liveBatch, requestMode, step);
  const resolvedStep = resolveClientStep(liveBatch, step);
  // const resolvedStep = resolveClientStep(liveBatch, requestMode === "batch" ? "batch" : "payment");


  useEffect(() => {
    const savedUser = localStorage.getItem("water_user");

    if (!savedUser) return;

    try {
      const parsedUser: UserResponse = JSON.parse(savedUser);
      setCurrentUser(parsedUser);
    } catch {
      localStorage.removeItem("water_user");
    }
  }, []);

  // useEffect(() => {
  //   if (!batchId) return;
  //   if (!liveBatch) return;
  //   if (requestMode !== "batch") return;

  //   const status = liveBatch.status;

  //   if (["forming", "near_ready", "ready_for_assignment"].includes(status)) {
  //     if (step !== "batch") setStep("batch");
  //     return;
  //   }

  //   if (["assigned", "loading"].includes(status)) {
  //     if (step !== "tanker") setStep("tanker");
  //     return;
  //   }

  //   if (status === "delivering") {
  //     if (step !== "delivery") setStep("delivery");
  //     return;
  //   }

  //   if (status === "completed") {
  //     if (step !== "completed") setStep("completed");
  //     return;
  //   }

  //   if (status === "expired") {
  //     if (step !== "expired") setStep("expired");
  //   }
  // }, [batchId, liveBatch, requestMode, step]);

  const price =
    requestMode === "priority"
      ? PRIORITY_FULL_TANKER_PRICE +
      PRIORITY_FULL_TANKER_PRICE * PLATFORM_PRIORITY_COMMISSION_RATE
      : selectedSize
        ? selectedSize * BATCH_PRICE_PER_LITER +
        selectedSize * BATCH_PRICE_PER_LITER * PLATFORM_BATCH_COMMISSION_RATE
        : 0;

  const canContinueToPayment =
    !!selectedSize &&
    (
      requestMode === "batch" ||
      (requestMode === "priority" &&
        (priorityMode === "asap" || !!scheduledFor))
    );

  const copyOtp = async () => {
    try {
      await navigator.clipboard.writeText(otp);
      toast.success("OTP copied to clipboard");
    } catch {
      toast.error("Failed to copy OTP");
    }
  };

  const handleContinueToPayment = () => {
    if (!canContinueToPayment) {
      toast.error("Please complete your request details first");
      return;
    }

    if (!currentUser) {
      setAuthMode("login");
      setShowAuthModal(true);
      return;
    }

    setStep("payment");
  };

  const handleAuthSuccess = (user: UserResponse) => {
    setCurrentUser(user);
    localStorage.setItem("water_user", JSON.stringify(user));
    setShowAuthModal(false);
    toast.success(`Welcome, ${user.name}!`);
    setStep("payment");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("water_user");
    toast.success("Logged out");
    resetClientFlow();
  };

  const goBack = () => {
    // if (step === "request") {
    if (resolvedStep === "request") {
      onBack();
      return;
    }

    // if (step === "payment") {
    if (resolvedStep === "payment") {
      setStep("request");
      return;
    }

    // if (step === "batch") {
    if (resolvedStep === "batch") {
      setStep("payment");
      return;
    }

    // if (step === "tanker") {
    if (resolvedStep === "tanker") {
      setStep(requestMode === "batch" ? "batch" : "payment");
      return;
    }

    // if (step === "delivery") {
    if (resolvedStep === "delivery") {
      setStep("tanker");
      return;
    }

    // if (step === "completed") {
    if (resolvedStep === "completed") {
      setStep("delivery");
      return;
    }

    // if (step === "expired") {
    if (resolvedStep === "expired") {
      setStep("batch");
    }
  };

  const handlePayment = async () => {
    if (!selectedSize) {
      toast.error("Please select a tank size");
      return;
    }

    if (
      requestMode === "priority" &&
      priorityMode === "scheduled" &&
      !scheduledFor
    ) {
      toast.error("Please select an exact delivery date and time");
      return;
    }

    if (!currentUser) {
      toast.error("Please sign up or log in before making payment");
      setAuthMode("signup");
      setShowAuthModal(true);
      return;
    }

    try {
      setIsSubmittingRequest(true);

      const payload = {
        user_id: currentUser.id,
        liquid_id: 1,
        volume_liters: selectedSize,
        latitude: 6.5244,
        longitude: 3.3792,
        delivery_type: requestMode,
        ...(requestMode === "priority"
          ? priorityMode === "asap"
            ? { is_asap: true }
            : { is_asap: false, scheduled_for: scheduledFor }
          : {}),
      };

      const response = await createWaterRequest(payload);

      const clientSession = {
        requestId: response.request_id ?? null,
        batchId: response.batch_id ?? null,
        memberId: response.member_id ?? null,
        paymentDeadline: response.payment_deadline ?? null,
        requestMode,
        selectedSize,
      };

      localStorage.setItem("water_client_session", JSON.stringify(clientSession));

      console.log("createWaterRequest response", response);

      setRequestId(response.request_id ?? null);
      setBatchId(response.batch_id ?? null);
      setMemberId(response.member_id ?? null);
      setPaymentDeadline(response.payment_deadline ?? null);

      toast.success("Payment confirmed and request created!");

      if (requestMode === "batch") {
        setStep("batch");
      } else {
        setStep("tanker");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create request";
      toast.error(message);
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  useEffect(() => {
    const savedSession = localStorage.getItem("water_client_session");
    if (!savedSession) return;

    try {
      const parsed = JSON.parse(savedSession);

      setRequestId(parsed.requestId ?? null);
      setBatchId(parsed.batchId ?? null);
      setMemberId(parsed.memberId ?? null);
      setPaymentDeadline(parsed.paymentDeadline ?? null);
      setRequestMode(parsed.requestMode ?? "batch");
      setSelectedSize(parsed.selectedSize ?? null);

      if (parsed.batchId) {
        setStep("batch");
      }
    } catch {
      localStorage.removeItem("water_client_session");
    }
  }, []);

  // localStorage.removeItem("water_client_session");

  const handleCancelBeforePayment = () => {
    setSelectedSize(null);
    setPriorityMode("asap");
    setScheduledFor("");
    setRequestMode("batch");
    toast.success("Request cancelled before payment");
    setStep("request");
  };

  const handleLeaveBatch = async () => {
    if (!memberId) return;

    try {
      await leaveBatchMember(memberId);
      localStorage.removeItem("water_client_session");
      toast.success("You left the batch. Your payment was forfeited.");
      resetClientFlow();
    } catch (error) {
      const message =
      error instanceof Error ? error.message : "Failed to leave batch";
      toast.error(message);
    }
  };

  const resetClientFlow = () => {
    localStorage.removeItem("water_client_session");
    setStep("request");
    setSelectedSize(null);
    setRequestId(null);
    setBatchId(null);
    setMemberId(null);
    setPaymentDeadline(null);
    setPriorityMode("asap");
    setScheduledFor("");
    setRequestMode("batch");
    setShowHelp(false);
    setShowLeaveBatchWarning(false);
    setOtp(Math.floor(1000 + Math.random() * 9000).toString());
  };

  const handleBackClick = () => {
    // if (step === "batch") {
    if (resolvedStep === "batch") {
      setShowLeaveBatchWarning(true);
      return;
    }

    goBack();
  };

  // const pageTitle =
  //   step === "request"
  //     ? "Request Water"
  //     : step === "payment"
  //       ? "Confirm Payment"
  //       : step === "batch"
  //         ? "Your Batch"
  //         : step === "tanker"
  //           ? requestMode === "priority"
  //             ? "Priority Delivery"
  //             : "Tanker Assigned"
  //           : step === "delivery"
  //             ? "Delivery"
  //             : step === "expired"
  //               ? "Batch Expired"
  //               : "Completed";
  const pageTitle =
    resolvedStep === "request"
      ? "Request Water"
      : resolvedStep === "payment"
        ? "Confirm Payment"
        : resolvedStep === "batch"
          ? "Your Batch"
          : resolvedStep === "tanker"
            ? requestMode === "priority"
              ? "Priority Delivery"
              : "Tanker Assigned"
            : resolvedStep === "delivery"
              ? "Delivery"
              : resolvedStep === "expired"
                ? "Batch Expired"
                : "Completed";

  const handleDeliveryConfirmed = () => {
    toast.success("Delivery confirmed! Thank you.");
    setStep("completed");
  };

  useEffect(() => {
    if (!batchId) return;

    console.log("live batch state", {
      batchId,
      memberId,
      // hasResolvedOnce,
      liveBatchLoading,
      liveBatch,
      liveBatchError,
      step,
      resolvedStep,
    });
  }, [
    batchId,
    memberId,
    // hasResolvedOnce,
    liveBatchLoading,
    liveBatch,
    liveBatchError,
    step,
  ]);

  return {
    // step,
    step: resolvedStep,
    setStep,
    selectedSize,
    setSelectedSize,
    requestMode,
    setRequestMode,
    showHelp,
    setShowHelp,
    showLeaveBatchWarning,
    setShowLeaveBatchWarning,
    otp,
    price,
    canContinueToPayment,
    pageTitle,
    copyOtp,
    goBack,
    handleContinueToPayment,
    handlePayment,
    handleCancelBeforePayment,
    handleLeaveBatch,
    resetClientFlow,
    handleDeliveryConfirmed,
    isSubmittingRequest,
    requestId,
    batchId,
    memberId,
    paymentDeadline,
    currentUser,
    showAuthModal,
    setShowAuthModal,
    authMode,
    setAuthMode,
    handleAuthSuccess,
    handleLogout,
    handleBackClick,
    priorityMode,
    setPriorityMode,
    scheduledFor,
    setScheduledFor,
    liveBatch,
    liveBatchLoading,
    liveBatchError,
  };
};