import { useEffect, useMemo, useState } from "react";
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

interface UseClientFlowParams {
  onBack: () => void;
}

type AuthMode = "signup" | "login";

interface ClientSession {
  requestId: number | null;
  batchId: number | null;
  memberId: number | null;
  paymentDeadline: string | null;
  requestMode: RequestMode;
  selectedSize: number | null;
  priorityMode: "asap" | "scheduled";
  scheduledFor: string;
  otp: string;
}

interface RequestResponseWithOtp {
  request_id?: number | null;
  batch_id?: number | null;
  member_id?: number | null;
  payment_deadline?: string | null;
  delivery_code?: string | null;
}

const CLIENT_SESSION_KEY = "water_client_session";
const USER_KEY = "water_user";

export const useClientFlow = ({ onBack }: UseClientFlowParams) => {
  const [step, setStep] = useState<ClientStep>("request");
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [requestMode, setRequestMode] = useState<RequestMode>("batch");
  const [priorityMode, setPriorityMode] = useState<"asap" | "scheduled">("asap");
  const [scheduledFor, setScheduledFor] = useState<string>("");

  const [showHelp, setShowHelp] = useState(false);
  const [showLeaveBatchWarning, setShowLeaveBatchWarning] = useState(false);
  const [otp, setOtp] = useState<string>("");

  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestId, setRequestId] = useState<number | null>(null);
  const [batchId, setBatchId] = useState<number | null>(null);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [paymentDeadline, setPaymentDeadline] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signup");

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

    if (status === "delivering" || status === "arrived") {
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

  const resolvedStep = useMemo(
    () => resolveClientStep(liveBatch, step),
    [liveBatch, step]
  );

  const price = useMemo(() => {
    if (requestMode === "priority") {
      return (
        PRIORITY_FULL_TANKER_PRICE +
        PRIORITY_FULL_TANKER_PRICE * PLATFORM_PRIORITY_COMMISSION_RATE
      );
    }

    if (!selectedSize) return 0;

    return (
      selectedSize * BATCH_PRICE_PER_LITER +
      selectedSize * BATCH_PRICE_PER_LITER * PLATFORM_BATCH_COMMISSION_RATE
    );
  }, [requestMode, selectedSize]);

  const canContinueToPayment = useMemo(() => {
    if (!selectedSize) return false;

    if (requestMode === "batch") return true;

    if (priorityMode === "asap") return true;

    return !!scheduledFor;
  }, [selectedSize, requestMode, priorityMode, scheduledFor]);

  useEffect(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    if (!savedUser) return;

    try {
      const parsedUser: UserResponse = JSON.parse(savedUser);
      setCurrentUser(parsedUser);
    } catch {
      localStorage.removeItem(USER_KEY);
    }
  }, []);

  useEffect(() => {
    const savedSession = localStorage.getItem(CLIENT_SESSION_KEY);
    if (!savedSession) return;

    try {
      const parsed: ClientSession = JSON.parse(savedSession);

      setRequestId(parsed.requestId ?? null);
      setBatchId(parsed.batchId ?? null);
      setMemberId(parsed.memberId ?? null);
      setPaymentDeadline(parsed.paymentDeadline ?? null);
      setRequestMode(parsed.requestMode ?? "batch");
      setSelectedSize(parsed.selectedSize ?? null);
      setPriorityMode(parsed.priorityMode ?? "asap");
      setScheduledFor(parsed.scheduledFor ?? "");
      setOtp(parsed.otp ?? "");

      if (parsed.requestMode === "batch" && parsed.batchId) {
        setStep("batch");
      } else if (parsed.requestMode === "priority" && parsed.requestId) {
        setStep("tanker");
      }
    } catch {
      localStorage.removeItem(CLIENT_SESSION_KEY);
    }
  }, []);

  useEffect(() => {
    if (liveBatch?.otp) {
      setOtp(liveBatch.otp);
    }
  }, [liveBatch?.otp]);

  useEffect(() => {
    const session: ClientSession = {
      requestId,
      batchId,
      memberId,
      paymentDeadline,
      requestMode,
      selectedSize,
      priorityMode,
      scheduledFor,
      otp,
    };

    const hasSessionData =
      !!requestId ||
      !!batchId ||
      !!memberId ||
      !!paymentDeadline ||
      !!selectedSize ||
      otp.length > 0;

    if (hasSessionData) {
      localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify(session));
    }
  }, [
    requestId,
    batchId,
    memberId,
    paymentDeadline,
    requestMode,
    selectedSize,
    priorityMode,
    scheduledFor,
    otp,
  ]);

  const copyOtp = async () => {
    if (!otp) {
      toast.error("No OTP available yet");
      return;
    }

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
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setShowAuthModal(false);
    toast.success(`Welcome, ${user.name}!`);
    setStep("payment");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(USER_KEY);
    toast.success("Logged out");
    resetClientFlow();
  };

  const goBack = () => {
    if (resolvedStep === "request") {
      onBack();
      return;
    }

    if (resolvedStep === "payment") {
      setStep("request");
      return;
    }

    if (resolvedStep === "batch") {
      setStep("payment");
      return;
    }

    if (resolvedStep === "tanker") {
      setStep(requestMode === "batch" ? "batch" : "payment");
      return;
    }

    if (resolvedStep === "delivery") {
      setStep("tanker");
      return;
    }

    if (resolvedStep === "completed") {
      setStep("delivery");
      return;
    }

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

      const response = (await createWaterRequest(
        payload
      )) as RequestResponseWithOtp;

      const nextRequestId = response.request_id ?? null;
      const nextBatchId = response.batch_id ?? null;
      const nextMemberId = response.member_id ?? null;
      const nextPaymentDeadline = response.payment_deadline ?? null;
      const nextOtp = response.delivery_code ?? "";

      setRequestId(nextRequestId);
      setBatchId(nextBatchId);
      setMemberId(nextMemberId);
      setPaymentDeadline(nextPaymentDeadline);
      setOtp(nextOtp);

      const clientSession: ClientSession = {
        requestId: nextRequestId,
        batchId: nextBatchId,
        memberId: nextMemberId,
        paymentDeadline: nextPaymentDeadline,
        requestMode,
        selectedSize,
        priorityMode,
        scheduledFor,
        otp: nextOtp,
      };

      localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify(clientSession));

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

  const handleCancelBeforePayment = () => {
    setSelectedSize(null);
    setPriorityMode("asap");
    setScheduledFor("");
    setRequestMode("batch");
    setOtp("");
    toast.success("Request cancelled before payment");
    setStep("request");
  };

  const handleLeaveBatch = async () => {
    if (!memberId) {
      toast.error("No batch membership found");
      return;
    }

    try {
      await leaveBatchMember(memberId);
      localStorage.removeItem(CLIENT_SESSION_KEY);
      toast.success("You left the batch. Your payment was forfeited.");
      resetClientFlow();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to leave batch";
      toast.error(message);
    }
  };

  const resetClientFlow = () => {
    localStorage.removeItem(CLIENT_SESSION_KEY);
    setStep("request");
    setSelectedSize(null);
    setRequestMode("batch");
    setPriorityMode("asap");
    setScheduledFor("");
    setShowHelp(false);
    setShowLeaveBatchWarning(false);
    setOtp("");
    setIsSubmittingRequest(false);
    setRequestId(null);
    setBatchId(null);
    setMemberId(null);
    setPaymentDeadline(null);
  };

  const handleBackClick = () => {
    if (resolvedStep === "batch") {
      setShowLeaveBatchWarning(true);
      return;
    }

    goBack();
  };

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
      liveBatchLoading,
      liveBatch,
      liveBatchError,
      rawStep: step,
      resolvedStep,
    });
  }, [
    batchId,
    memberId,
    liveBatchLoading,
    liveBatch,
    liveBatchError,
    step,
    resolvedStep,
  ]);

  return {
    step: resolvedStep,
    rawStep: step,
    resolvedStep,
    setStep,

    selectedSize,
    setSelectedSize,

    requestMode,
    setRequestMode,

    priorityMode,
    setPriorityMode,

    scheduledFor,
    setScheduledFor,

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
    handleBackClick,

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

    liveBatch,
    liveBatchLoading,
    liveBatchError,
    refreshLiveBatch,
  };
};