import { useState } from "react";
import { toast } from "sonner";
import type { ClientStep, RequestMode } from "@/types/client";
import {
    BATCH_PRICE_PER_LITER,
    PRIORITY_FULL_TANKER_PRICE,
} from "@/constants/water";

interface UseClientFlowParams {
    onBack: () => void;
}

export const useClientFlow = ({ onBack }: UseClientFlowParams) => {
    const [step, setStep] = useState<ClientStep>("request");
    const [selectedSize, setSelectedSize] = useState<number | null>(null);
    const [requestMode, setRequestMode] = useState<RequestMode>("batch");
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
    const [showHelp, setShowHelp] = useState(false);
    const [showLeaveBatchWarning, setShowLeaveBatchWarning] = useState(false);
    const [otp] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());

    const price =
        requestMode === "priority"
            ? PRIORITY_FULL_TANKER_PRICE
            : selectedSize
                ? selectedSize * BATCH_PRICE_PER_LITER
                : 0;

    const canContinueToPayment =
        !!selectedSize && (requestMode === "batch" || !!selectedTimeSlot);

    const copyOtp = () => {
        navigator.clipboard.writeText(otp);
        toast.success("OTP copied to clipboard");
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

    const handlePayment = () => {
        toast.success("Payment confirmed!");

        if (requestMode === "batch") {
            setStep("batch");
        } else {
            setStep("tanker");
        }
    };

    const handleCancelBeforePayment = () => {
        setSelectedSize(null);
        setSelectedTimeSlot(null);
        setRequestMode("batch");
        toast.success("Request cancelled before payment");
        onBack();
    };

    const handleLeaveBatch = () => {
        setShowLeaveBatchWarning(false);
        setStep("request");
        setSelectedSize(null);
        setSelectedTimeSlot(null);
        setRequestMode("batch");
        toast.error("You left the batch. Your payment was forfeited.");
    };

    const resetClientFlow = () => {
        setStep("request");
        setSelectedSize(null);
        setSelectedTimeSlot(null);
        setRequestMode("batch");
        setShowHelp(false);
        setShowLeaveBatchWarning(false);
        onBack();
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

    return {
        step,
        setStep,
        selectedSize,
        setSelectedSize,
        requestMode,
        setRequestMode,
        selectedTimeSlot,
        setSelectedTimeSlot,
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
        handlePayment,
        handleCancelBeforePayment,
        handleLeaveBatch,
        resetClientFlow,
        handleDeliveryConfirmed
    };
};