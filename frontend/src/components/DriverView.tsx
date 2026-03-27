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
    otpInput,
    activeDeliveryIdx,
    deliveredCount,
    allDelivered,
    currentDelivery,
    setOtpInput,
    isLoading,
    isActionLoading,
    refreshJob,
    acceptJob,
    markLoaded,
    markArrived,
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
            job={activeJob}
            deliveries={deliveries}
            activeDeliveryIdx={activeDeliveryIdx}
            currentDelivery={currentDelivery}
            deliveredCount={deliveredCount}
            allDelivered={allDelivered}
            otpInput={otpInput}
            isLoading={isActionLoading}
            onOtpChange={setOtpInput}
            onMarkArrived={markArrived}
            onCompleteDelivery={completeDelivery}
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


