// app/(client)/index.tsx

import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useClientFlow } from "@/hooks/useClientFlow";

import { ClientHeader } from "@/components/client/ClientHeader";
import { AuthStep } from "@/components/client/AuthStep";
import { RequestStep } from "@/components/client/RequestStep";
import { PaymentStep } from "@/components/client/PaymentStep";
import { BatchStep } from "@/components/client/BatchStep";
import { TankerStep } from "@/components/client/TankerStep";
import { DeliveryStep } from "@/components/client/DeliveryStep";
import { CompletedStep } from "@/components/client/CompletedStep";
import { FailedStep } from "@/components/client/FailedStep";
import { useAppTheme } from "@/hooks/useAppTheme";


export default function ClientFlow() {
  const flow = useClientFlow();
  const { theme, themeMode, toggleTheme } = useAppTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ClientHeader
        title={flow.titles[flow.step]}
        onBack={flow.back}
        theme={theme}
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{ padding: 16 }}
      >

        {flow.step === "auth" && (
          <AuthStep onComplete={flow.handleAuthComplete} />
        )}

        {flow.step === "request" && (
          <RequestStep
            mode={flow.mode}
            setMode={flow.setMode}
            size={flow.size}
            setSize={flow.setSize}
            priorityMode={flow.priorityMode}
            setPriorityMode={flow.setPriorityMode}
            onContinue={flow.handleSubmitRequest}
            loading={flow.loading}
          />
        )}

        {flow.step === "payment" && flow.requestResp && (
          <PaymentStep
            price={flow.price}
            size={flow.size!}
            mode={flow.mode}
            requestResp={flow.requestResp}
            onPay={flow.handleConfirmPayment}
            onCancel={() => flow.setStep("request")}
            loading={flow.loading}
          />
        )}

        {flow.step === "batch" && flow.requestResp && (
          <BatchStep
            requestResp={flow.requestResp}
            liveData={flow.liveData}
            size={flow.size!}
            price={flow.price}
            onLeave={flow.handleLeave}
            onRefresh={flow.fetchLive}
          />
        )}

        {flow.step === "tanker" && (
          <TankerStep
            mode={flow.mode}
            liveData={flow.liveData}
            requestResp={flow.requestResp}
          />
        )}

        {flow.step === "delivery" && flow.requestResp && (
          <DeliveryStep
            mode={flow.mode}
            liveData={flow.liveData}
            requestResp={flow.requestResp}
          />
        )}

        {flow.step === "completed" && (
          <CompletedStep
            size={flow.size!}
            price={flow.price}
            liveData={flow.liveData}
            onHome={flow.goRoleHome}
          />
        )}

        {flow.step === "failed" && (
          <FailedStep onHome={flow.goRoleHome} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}