import { ArrowLeft, CircleHelp } from "lucide-react";
import RequestStep from "@/components/client/RequestStep";
import PaymentStep from "@/components/client/PaymentStep";
import BatchStep from "@/components/client/BatchStep";
import TankerStep from "@/components/client/TankerStep";
import DeliveryStep from "@/components/client/DeliveryStep";
import CompletedStep from "@/components/client/CompletedStep";
import HelpModal from "@/components/client/HelpModal";
import LeaveBatchWarningModal from "@/components/client/LeaveBatchWarningModal";
import { useClientFlow } from "@/hooks/useClientFlow";
import type { ClientViewProps } from "@/types/client";


const ClientView = ({ onBack }: ClientViewProps) => {
  const {
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
    handleDeliveryConfirmed,
    isSubmittingRequest,
    requestId,
    batchId,
    memberId,
    paymentDeadline,
  } = useClientFlow({ onBack });


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-bold text-foreground text-lg">{pageTitle}</h1>
          </div>

          <button
            onClick={() => setShowHelp(true)}
            className="h-9 w-9 rounded-full border border-border bg-card flex items-center justify-center text-foreground hover:border-primary/30 transition-colors"
            aria-label="Help"
          >
            <CircleHelp className="h-4.5 w-4.5" />
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto p-5">
        {/* step: Request */}
        {step === "request" && (
          <RequestStep
            requestMode={requestMode}
            selectedSize={selectedSize}
            selectedTimeSlot={selectedTimeSlot}
            canContinueToPayment={canContinueToPayment}
            onSelectMode={setRequestMode}
            onSelectSize={setSelectedSize}
            onSelectTimeSlot={setSelectedTimeSlot}
            onContinue={() => setStep("payment")}
            onCancel={handleCancelBeforePayment}
          />
        )}

        {/* Step: Payment */}
        {step === "payment" && (
          <PaymentStep
            price={price}
            selectedSize={selectedSize}
            requestMode={requestMode}
            selectedTimeSlot={selectedTimeSlot}
            onPay={handlePayment}
            onCancel={handleCancelBeforePayment}
            isLoading={isSubmittingRequest}
          />
        )}

        {/* Step: Batch Status */}
        {step === "batch" && (
          <BatchStep
            otp={otp}
            selectedSize={selectedSize}
            price={price}
            onCopyOtp={copyOtp}
            onViewTanker={() => setStep("tanker")}
            onLeaveBatch={() => setShowLeaveBatchWarning(true)}
            batchId={batchId}
            requestId={requestId}
            paymentDeadline={paymentDeadline}
          />
        )}


        {/* Step: Tanker Assigned / Priority Delivery */}
        {step === "tanker" && (
          <TankerStep
            requestMode={requestMode}
            selectedTimeSlot={selectedTimeSlot}
            selectedSize={selectedSize}
            onArrived={() => setStep("delivery")}
          />
        )}

        {/* Step: Delivery */}
        {step === "delivery" && (
          <DeliveryStep
            requestMode={requestMode}
            otp={otp}
            onConfirm={handleDeliveryConfirmed}
          />
        )}

        {/* Step: Completed */}
        {step === "completed" && (
          <CompletedStep
            selectedSize={selectedSize}
            requestMode={requestMode}
            selectedTimeSlot={selectedTimeSlot}
            price={price}
            otp={otp}
            onBackHome={resetClientFlow}
          />
        )}
      </div>

      {/* Help Modal */}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}


      {/* Leave Batch Warning Modal */}
      {showLeaveBatchWarning && (
        <LeaveBatchWarningModal
          onClose={() => setShowLeaveBatchWarning(false)}
          onConfirmLeave={handleLeaveBatch}
        />
      )}

    </div >
  );
};

export default ClientView;