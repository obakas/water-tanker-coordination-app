import { DriverHeader } from "@/components/driver/DriverHeader";
import { DriverAvailableStep } from "@/components/driver/DriverAvailableStep";
import { DriverLoadingStep } from "@/components/driver/DriverLoadingStep";
import { DriverDeliveringStep } from "@/components/driver/DriverDeliveringStep";
import { DriverCompletedStep } from "@/components/driver/DriverCompletedStep";
import { useDriverFlow } from "@/hooks/useDriverFlow";
import { MOCK_BATCH } from "@/types/driver";

interface DriverViewProps {
  onBack: () => void;
}

const DriverView = ({ onBack }: DriverViewProps) => {
  const {
    step,
    isOnline,
    deliveries,
    otpInput,
    activeDeliveryIdx,
    deliveredCount,
    allDelivered,
    currentDelivery,
    setOtpInput,
    toggleOnlineStatus,
    acceptBatch,
    startDeliveries,
    confirmDelivery,
    completeTrip,
    resetToDashboard,
    setStep,
  } = useDriverFlow();

  const renderStep = () => {
    switch (step) {
      case "available":
        return (
          <DriverAvailableStep
            isOnline={isOnline}
            batch={MOCK_BATCH}
            onAcceptBatch={acceptBatch} onAcceptPriority={function (): void {
              throw new Error("Function not implemented.");
            } }          />
        );
      case "loading":
        return (
          <DriverLoadingStep
            batch={MOCK_BATCH}
            onStartDeliveries={startDeliveries}
          />
        );
      case "delivering":
        return (
          <DriverDeliveringStep
            deliveries={deliveries}
            activeDeliveryIdx={activeDeliveryIdx}
            currentDelivery={currentDelivery}
            deliveredCount={deliveredCount}
            allDelivered={allDelivered}
            otpInput={otpInput}
            onOtpChange={setOtpInput}
            onConfirmDelivery={confirmDelivery}
            onCompleteTrip={completeTrip}
          />
        );
      case "completed":
        return (
          <DriverCompletedStep
            batch={MOCK_BATCH}
            deliveries={deliveries}
            onBackToDashboard={resetToDashboard}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DriverHeader
        step={step}
        isOnline={isOnline}
        onBack={() => setStep("available")}
        onToggleOnline={toggleOnlineStatus}
      />
      <div className="max-w-md mx-auto p-5">{renderStep()}</div>
    </div>
  );
};

export default DriverView;