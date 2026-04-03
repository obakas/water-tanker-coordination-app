import { ArrowLeft, CircleHelp, LogOut, UserCircle2 } from "lucide-react";
import RequestStep from "@/components/client/RequestStep";
import PaymentStep from "@/components/client/PaymentStep";
import BatchStep from "@/components/client/BatchStep";
import TankerStep from "@/components/client/TankerStep";
import DeliveryStep from "@/components/client/DeliveryStep";
import CompletedStep from "@/components/client/CompletedStep";
import ExpiredBatchStep from "@/components/client/ExpiredBatchStep";
import HelpModal from "@/components/client/HelpModal";
import LeaveBatchWarningModal from "@/components/client/LeaveBatchWarningModal";
import AuthModal from "@/components/client/AuthModal";
import ThemeToggle from "@/components/ui/ThemeToggle";
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
  } = useClientFlow({ onBack });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackClick}
              className={`text-foreground ${
                step === "batch" ? "text-red-500" : ""
              }`}
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <h1 className="text-lg font-bold text-foreground">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
                  <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                  <div className="leading-tight">
                    <p className="text-sm font-medium text-foreground">
                      {currentUser.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {currentUser.phone}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted"
                  aria-label="Log out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setAuthMode("login");
                  setShowAuthModal(true);
                }}
                className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted"
              >
                Sign In
              </button>
            )}

            <button
              onClick={() => setShowHelp(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-primary/30"
              aria-label="Open help"
            >
              <CircleHelp className="h-4.5 w-4.5" />
            </button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-md p-5">
        {step === "request" && (
          <RequestStep
            requestMode={requestMode}
            selectedSize={selectedSize}
            priorityMode={priorityMode}
            scheduledFor={scheduledFor}
            canContinueToPayment={canContinueToPayment}
            onSelectMode={setRequestMode}
            onSelectSize={setSelectedSize}
            onSelectPriorityMode={setPriorityMode}
            onSetScheduledFor={setScheduledFor}
            onContinue={handleContinueToPayment}
            onCancel={handleCancelBeforePayment}
          />
        )}

        {step === "payment" && (
          <PaymentStep
            price={price}
            selectedSize={selectedSize}
            requestMode={requestMode}
            priorityMode={priorityMode}
            scheduledFor={scheduledFor}
            onPay={handlePayment}
            onCancel={handleCancelBeforePayment}
            isLoading={isSubmittingRequest}
          />
        )}

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
            liveBatch={liveBatch}
            liveBatchLoading={liveBatchLoading}
            liveBatchError={liveBatchError}
          />
        )}

        {step === "tanker" && (
          <TankerStep
            requestMode={requestMode}
            priorityMode={priorityMode}
            scheduledFor={scheduledFor}
            selectedSize={selectedSize ?? 0}
            onArrived={() => setStep("delivery")}
          />
        )}

        {step === "delivery" && (
          <DeliveryStep
            requestMode={requestMode}
            otp={otp}
            onConfirm={handleDeliveryConfirmed}
          />
        )}

        {step === "completed" && (
          <CompletedStep
            selectedSize={selectedSize}
            requestMode={requestMode}
            priorityMode={priorityMode}
            scheduledFor={scheduledFor}
            price={price}
            otp={otp}
            onBackHome={resetClientFlow}
          />
        )}

        {step === "expired" && (
          <ExpiredBatchStep
            liveBatch={liveBatch}
            memberId={memberId}
            onBackHome={resetClientFlow}
            refreshLiveBatch={refreshLiveBatch}
          />
        )}
      </div>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {showLeaveBatchWarning && (
        <LeaveBatchWarningModal
          onClose={() => setShowLeaveBatchWarning(false)}
          onConfirmLeave={handleLeaveBatch}
        />
      )}

      {showAuthModal && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          onModeChange={setAuthMode}
        />
      )}
    </div>
  );
};

export default ClientView;