import { useState } from "react";
import { DriverHeader } from "@/components/driver/DriverHeader";
import { DriverAvailableStep } from "@/components/driver/DriverAvailableStep";
import { DriverLoadingStep } from "@/components/driver/DriverLoadingStep";
import { DriverDeliveringStep } from "@/components/driver/DriverDeliveringStep";
import { DriverCompletedStep } from "@/components/driver/DriverCompletedStep";
import DriverIncomingOfferStep from "@/components/driver/DriverIncomingOfferStep";
import DriverAuthModal from "@/components/driver/DriverAuthModal";
import DriverHelpModal from "@/components/driver/DriverHelpModal";
import DeliveryHistoryTab from "@/components/driver/DeliveryHistoryTab";
import { useDriverFlow } from "@/hooks/useDriverFlow";
import { useDriverAuth } from "@/hooks/useDriverAuth";

interface DriverViewProps {
  onBack: () => void;
}

function StateBridgeCard({
  title,
  message,
  onRefresh,
  isLoading,
}: {
  title: string;
  message: string;
  onRefresh: () => void | Promise<void>;
  isLoading: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>

      <button
        className="mt-4 inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-medium"
        onClick={onRefresh}
        disabled={isLoading}
      >
        {isLoading ? "Refreshing..." : "Refresh"}
      </button>
    </div>
  );
}

const DriverView = ({ onBack }: DriverViewProps) => {
  const [showHelp, setShowHelp] = useState(false);

  const { driver, isAuthenticated, loginDriver, logoutDriver } = useDriverAuth();

  const {
    step,
    incomingOffer,
    acceptOffer,
    rejectOffer,
    activeJob,
    deliveries,
    currentDelivery,
    activeDeliveryIdx,
    deliveredCount,
    allDelivered,
    allowedActions,
    currentStop,
    jobResponse,
    otpInput,
    setOtpInput,
    meterStartReading,
    setMeterStartReading,
    meterEndReading,
    setMeterEndReading,
    deliveryNotes,
    setDeliveryNotes,
    failureReason,
    setFailureReason,
    skipReason,
    setSkipReason,
    isLoading,
    isActionLoading,
    refreshJob,
    acceptJob,
    markLoaded,
    markArrived,
    beginMeasurement,
    finishMeasurement,
    verifyOtp,
    completeDelivery,
    failCurrentStop,
    skipCurrentStop,
    resetToDashboard,
    activeTab,
    setActiveTab,
  } = useDriverFlow(driver);

  const renderDashboard = () => {
    if (isLoading && !incomingOffer && !activeJob && !currentStop) {
      return (
        <div className="rounded-xl border p-4 text-sm">
          Loading current job...
        </div>
      );
    }

    if (incomingOffer) {
      return (
        <DriverIncomingOfferStep
          offer={incomingOffer}
          isSubmitting={isActionLoading}
          onAccept={acceptOffer}
          onReject={rejectOffer}
          onRefresh={refreshJob}
        />
      );
    }

    switch (step) {
      case "offline":
      case "available":
        return (
          <DriverAvailableStep
            job={activeJob}
            isLoading={isActionLoading}
            onRefresh={refreshJob}
            onAcceptJob={acceptJob}
            batchId={activeJob?.jobId || null}
          />
        );

      case "assigned":
        if (!activeJob) {
          return (
            <StateBridgeCard
              title="Assignment Received"
              message="Your assignment is syncing. Refresh to continue."
              onRefresh={refreshJob}
              isLoading={isActionLoading}
            />
          );
        }

        return (
          <DriverAvailableStep
            job={activeJob}
            isLoading={isActionLoading}
            onRefresh={refreshJob}
            onAcceptJob={acceptJob}
            batchId={activeJob?.jobId || null}
          />
        );

      case "loading":
        if (!activeJob) {
          return (
            <StateBridgeCard
              title="Preparing Loading Step"
              message="The app is syncing your accepted job. Refresh in a moment."
              onRefresh={refreshJob}
              isLoading={isActionLoading}
            />
          );
        }

        return (
          <div className="space-y-4">
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <p className="text-sm font-medium text-foreground">
                Fill the tanker first.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {jobResponse?.message ||
                  "You have up to 90 minutes to load water, then confirm the tanker is ready."}
              </p>
            </div>

            <DriverLoadingStep
              job={activeJob}
              isLoading={isActionLoading}
              onMarkLoaded={markLoaded}
            />
          </div>
        );

      case "delivering":
      case "arrived":
        if (!activeJob) {
          return (
            <StateBridgeCard
              title="Delivery In Progress"
              message="The stop is syncing. Refresh to pull the current customer and action state."
              onRefresh={refreshJob}
              isLoading={isActionLoading}
            />
          );
        }

        return (
          <DriverDeliveringStep
            currentDelivery={currentDelivery}
            activeDeliveryIdx={activeDeliveryIdx}
            deliveredCount={deliveredCount}
            totalStops={deliveries.length}
            allDelivered={allDelivered}
            allowedActions={allowedActions}
            currentStopStatus={currentStop?.delivery_status ?? null}
            otpInput={otpInput}
            setOtpInput={setOtpInput}
            meterStartReading={meterStartReading}
            setMeterStartReading={setMeterStartReading}
            meterEndReading={meterEndReading}
            setMeterEndReading={setMeterEndReading}
            deliveryNotes={deliveryNotes}
            setDeliveryNotes={setDeliveryNotes}
            failureReason={failureReason}
            setFailureReason={setFailureReason}
            skipReason={skipReason}
            setSkipReason={setSkipReason}
            isLoading={isActionLoading}
            onMarkArrived={markArrived}
            onBeginMeasurement={beginMeasurement}
            onFinishMeasurement={finishMeasurement}
            onVerifyOtp={verifyOtp}
            onCompleteDelivery={completeDelivery}
            onFailStop={failCurrentStop}
            onSkipStop={skipCurrentStop}
            onReset={resetToDashboard}
          />
        );

      case "completed":
        if (!activeJob) {
          return (
            <StateBridgeCard
              title="Job Completed"
              message="The backend has already closed the job. Refresh or go back to dashboard."
              onRefresh={refreshJob}
              isLoading={isActionLoading}
            />
          );
        }

        return (
          <DriverCompletedStep
            job={activeJob}
            deliveries={deliveries}
            onBackToDashboard={resetToDashboard}
          />
        );

      default:
        return (
          <StateBridgeCard
            title="Driver State Unknown"
            message="The app could not decide the next step yet. Refresh and try again."
            onRefresh={refreshJob}
            isLoading={isActionLoading}
          />
        );
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background p-5">
        <DriverAuthModal onLogin={loginDriver} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DriverHeader
        step={step}
        driverName={driver?.name}
        onBack={onBack}
        onLogout={logoutDriver}
        onOpenHelp={() => setShowHelp(true)}
      />

      <div className="mx-auto max-w-md p-5 space-y-4">
        <div className="grid grid-cols-2 rounded-2xl border bg-card p-1">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeTab === "dashboard"
                ? "bg-primary text-primary-foreground"
                : "text-foreground"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeTab === "history"
                ? "bg-primary text-primary-foreground"
                : "text-foreground"
            }`}
          >
            Delivery History
          </button>
        </div>

        {activeTab === "history" && driver?.tankerId ? (
          <DeliveryHistoryTab tankerId={driver.tankerId} />
        ) : (
          renderDashboard()
        )}
      </div>

      {showHelp && <DriverHelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
};

export default DriverView;