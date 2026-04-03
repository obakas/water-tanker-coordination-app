import { useState } from "react";
import { DriverHeader } from "@/components/driver/DriverHeader";
import { DriverAvailableStep } from "@/components/driver/DriverAvailableStep";
import { DriverLoadingStep } from "@/components/driver/DriverLoadingStep";
import { DriverDeliveringStep } from "@/components/driver/DriverDeliveringStep";
import { DriverCompletedStep } from "@/components/driver/DriverCompletedStep";
import DriverAuthModal from "@/components/driver/DriverAuthModal";
import DriverHelpModal from "@/components/driver/DriverHelpModal";
import { useDriverFlow } from "@/hooks/useDriverFlow";
import { useDriverAuth } from "@/hooks/useDriverAuth";

interface DriverViewProps {
  onBack: () => void;
}

const DriverView = ({ onBack }: DriverViewProps) => {
  const [showHelp, setShowHelp] = useState(false);

  const { driver, isAuthenticated, loginDriver, logoutDriver } = useDriverAuth();

  const {
    step,
    activeJob,
    deliveries,
    currentDelivery,
    activeDeliveryIdx,
    deliveredCount,
    allDelivered,
    allowedActions,
    currentStop,
    otpInput,
    setOtpInput,
    meterStartReading,
    setMeterStartReading,
    meterEndReading,
    setMeterEndReading,
    deliveryNotes,
    setDeliveryNotes,
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
    resetToDashboard,
  } = useDriverFlow(driver);

  const renderStep = () => {
    if (isLoading) {
      return (
        <div className="rounded-xl border p-4 text-sm">
          Loading current job...
        </div>
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
        // case "loading":
        return activeJob ? (
          <DriverAvailableStep
            job={activeJob}
            isLoading={isActionLoading}
            onRefresh={refreshJob}
            onAcceptJob={acceptJob}
            batchId={activeJob?.jobId || null}
          />
        ) : null;

      case "loading":
        // case "loading":
        return activeJob ? (
          <DriverLoadingStep
            job={activeJob}
            isLoading={isActionLoading}
            onMarkLoaded={markLoaded}
          />
        ) : null;

      case "delivering":
      case "arrived":
        return activeJob ? (
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
            isLoading={isActionLoading}
            onMarkArrived={markArrived}
            onBeginMeasurement={beginMeasurement}
            onFinishMeasurement={finishMeasurement}
            onVerifyOtp={verifyOtp}
            onCompleteDelivery={completeDelivery}
            onReset={resetToDashboard}
          />
        ) : null;

      case "completed":
        return activeJob ? (
          <DriverCompletedStep
            job={activeJob}
            deliveries={deliveries}
            onBackToDashboard={resetToDashboard}
          />
        ) : null;

      default:
        return null;
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

      <div className="max-w-md mx-auto p-5">{renderStep()}</div>

      {showHelp && <DriverHelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
};

export default DriverView;


