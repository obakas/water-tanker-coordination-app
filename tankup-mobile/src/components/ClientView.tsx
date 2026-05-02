import { Alert } from "react-native";
import ClientShell from "@/src/components/client/ClientShell";
import RequestStep from "@/src/components/client/RequestStep";
import PaymentStep from "@/src/components/client/PaymentStep";
import { BatchStep, CompletedStep, DeliveryStep, TankerStep } from "@/src/components/client/StatusSteps";
import { useClientFlow } from "@/src/hooks/useClientFlow";
import type { ClientViewProps } from "@/types/client";

export default function ClientView({ onBack }: ClientViewProps) {
  const flow = useClientFlow({ onBack });

  const renderStep = () => {
    switch (flow.step) {
      case "request":
        return (
          <RequestStep
            requestMode={flow.requestMode}
            selectedSize={flow.selectedSize}
            priorityMode={flow.priorityMode}
            scheduledFor={flow.scheduledFor}
            address={flow.address}
            price={flow.price}
            canContinueToPayment={flow.canContinueToPayment}
            onSelectMode={flow.setRequestMode}
            onSelectSize={flow.setSelectedSize}
            onSelectPriorityMode={flow.setPriorityMode}
            onSetScheduledFor={flow.setScheduledFor}
            onSetAddress={flow.setAddress}
            onContinue={flow.handleContinueToPayment}
            onCancel={flow.handleCancelBeforePayment}
          />
        );
      case "payment":
        return (
          <PaymentStep
            price={flow.price}
            selectedSize={flow.selectedSize}
            requestMode={flow.requestMode}
            priorityMode={flow.priorityMode}
            scheduledFor={flow.scheduledFor}
            onPay={flow.handlePayment}
            onCancel={flow.handleCancelBeforePayment}
            isLoading={flow.isSubmittingRequest}
          />
        );
      case "batch":
        return (
          <BatchStep
            otp={flow.otp}
            batchId={flow.createdRequest?.batch_id}
            onViewTanker={() => flow.setStep("tanker")}
            onLeaveBatch={() => Alert.alert("Leave batch", "Hook this to your backend opt-out/forfeit endpoint next.")}
          />
        );
      case "tanker":
        return <TankerStep requestId={flow.createdRequest?.request_id} onArrived={() => flow.setStep("delivery")} />;
      case "delivery":
        return <DeliveryStep onConfirm={() => flow.setStep("completed")} />;
      case "completed":
        return <CompletedStep onDone={flow.resetClientFlow} />;
      default:
        return null;
    }
  };

  return (
    <ClientShell title={flow.pageTitle} onBack={flow.step === "request" ? onBack : flow.handleCancelBeforePayment}>
      {renderStep()}
    </ClientShell>
  );
}
