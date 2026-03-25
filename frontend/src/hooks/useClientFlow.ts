import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ClientStep, RequestMode } from "@/types/client";
import {
  BATCH_PRICE_PER_LITER,
  PRIORITY_FULL_TANKER_PRICE,
  PLATFORM_PRIORITY_COMMISSION_RATE,
  PLATFORM_BATCH_COMMISSION_RATE,
} from "@/constants/water";
import { createWaterRequest, type UserResponse } from "@/lib/api";

interface UseClientFlowParams {
  onBack: () => void;
}

type AuthMode = "signup" | "login";

export const useClientFlow = ({ onBack }: UseClientFlowParams) => {
  const [step, setStep] = useState<ClientStep>("request");
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [requestMode, setRequestMode] = useState<RequestMode>("batch");
  // const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [priorityMode, setPriorityMode] = useState<"asap" | "scheduled">("asap");
  const [scheduledFor, setScheduledFor] = useState<string>("");

  const [showHelp, setShowHelp] = useState(false);
  const [showLeaveBatchWarning, setShowLeaveBatchWarning] = useState(false);
  const [otp] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());

  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestId, setRequestId] = useState<number | null>(null);
  const [batchId, setBatchId] = useState<number | null>(null);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [paymentDeadline, setPaymentDeadline] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signup");

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


  const price =
    requestMode === "priority"
      ? (PRIORITY_FULL_TANKER_PRICE * PLATFORM_PRIORITY_COMMISSION_RATE) + PRIORITY_FULL_TANKER_PRICE
      : selectedSize
        ? (selectedSize * BATCH_PRICE_PER_LITER * PLATFORM_BATCH_COMMISSION_RATE) + (selectedSize * BATCH_PRICE_PER_LITER)
        : 0;

  // const canContinueToPayment =
  //   !!selectedSize && (requestMode === "batch" || !!selectedTimeSlot);
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
    setStep("request");
  };

  const goBack = () => {
    if (step === "request") {
      onBack();
      return;
    }

    if (step === "payment") {
      setStep("request");
      return;
    }

    if (step === "batch") {
      setStep("payment");
      return;
    }

    if (step === "tanker") {
      setStep(requestMode === "batch" ? "batch" : "payment");
      return;
    }

    if (step === "delivery") {
      setStep("tanker");
      return;
    }

    if (step === "completed") {
      setStep("delivery");
    }
  };

  const handlePayment = async () => {
    if (!selectedSize) {
      toast.error("Please select a tank size");
      return;
    }

    // if (requestMode === "priority" && !selectedTimeSlot) {
    //   toast.error("Please select a delivery period");
    //   return;
    // }
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

      setRequestId(response.request_id);
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

  const handleCancelBeforePayment = () => {
    setSelectedSize(null);
    // setSelectedTimeSlot(null);
    setPriorityMode("asap");
    setScheduledFor("");
    setRequestMode("batch");
    toast.success("Request cancelled before payment");
    // onBack();
    setStep("request");
  };

  const handleLeaveBatch = () => {
    setShowLeaveBatchWarning(false);
    setStep("request");
    setSelectedSize(null);
    // setSelectedTimeSlot(null);
    setScheduledFor("");
    setRequestMode("batch");
    toast.error("You left the batch. Your payment was forfeited.");
  };

  const resetClientFlow = () => {
    setStep("request");
    setSelectedSize(null);
    // setSelectedTimeSlot(null);
    setPriorityMode("asap");
    setScheduledFor("");
    setRequestMode("batch");
    setShowHelp(false);
    setShowLeaveBatchWarning(false);
    onBack();
  };

  const handleBackClick = () => {
    if (step === "batch") {
      setShowLeaveBatchWarning(true);
      return;
    }

    goBack();
  };

  const pageTitle =
    step === "request"
      ? "Request Water"
      : step === "payment"
        ? "Confirm Payment"
        : step === "batch"
          ? "Your Batch"
          : step === "tanker"
            ? requestMode === "priority"
              ? "Priority Delivery"
              : "Tanker Assigned"
            : step === "delivery"
              ? "Delivery"
              : "Completed";

  const handleDeliveryConfirmed = () => {
    toast.success("Delivery confirmed! Thank you.");
    setStep("completed");
  };

  // const [theme, setTheme] = useState<"light" | "dark">("light");

  return {
    step,
    setStep,
    selectedSize,
    setSelectedSize,
    requestMode,
    setRequestMode,
    // selectedTimeSlot,
    // setSelectedTimeSlot,
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
  };
};