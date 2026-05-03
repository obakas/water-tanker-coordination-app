import { useState } from "react";
import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, HelpCircle } from "lucide-react-native";
import {
  TANK_SIZES,
  BATCH_PRICE_PER_LITER,
  PRIORITY_PRICE_PER_LITER,
} from "@/constants/water";
import type { ClientStep, RequestMode, PriorityMode } from "@/types/client";

export default function ClientFlow() {
  const [step, setStep] = useState<ClientStep>("request");
  const [mode, setMode] = useState<RequestMode>("batch");
  const [size, setSize] = useState<number | null>(null);
  const [priorityMode, setPriorityMode] = useState<PriorityMode>("asap");
  const [otp] = useState(() =>
    Math.floor(1000 + Math.random() * 9000).toString()
  );
  const [queuePosition] = useState<number>(2);
  const [batchTotal] = useState<number>(5);

  const price =
    (size ?? 0) *
    (mode === "batch" ? BATCH_PRICE_PER_LITER : PRIORITY_PRICE_PER_LITER);

  const titles: Record<ClientStep, string> = {
    request: "Request Water",
    payment: "Payment",
    batch: "Batch Joined",
    tanker: "Tanker En Route",
    delivery: "Delivery in Progress",
    completed: "Delivered",
    expired: "Batch Expired",
    failed: "Delivery Failed",
    partial: "Partial Delivery",
  };

  const back = () => {
    if (step === "request") router.back();
    else setStep("request");
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <Pressable onPress={back} className="p-2">
          <ArrowLeft color="#e6edf7" size={20} />
        </Pressable>
        <Text className="text-foreground font-bold text-base">
          {titles[step]}
        </Text>
        <Pressable
          onPress={() => Alert.alert("Help", "Contact support: 0800-TANKUP")}
          className="p-2"
        >
          <HelpCircle color="#e6edf7" size={20} />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ padding: 16 }}>
        {step === "request" && (
          <RequestStep
            mode={mode}
            setMode={setMode}
            size={size}
            setSize={setSize}
            priorityMode={priorityMode}
            setPriorityMode={setPriorityMode}
            onContinue={() => size && setStep("payment")}
          />
        )}

        {step === "payment" && (
          <PaymentStep
            price={price}
            size={size!}
            mode={mode}
            onPay={() => setStep(mode === "batch" ? "batch" : "tanker")}
            onCancel={() => setStep("request")}
          />
        )}

        {step === "batch" && (
          <BatchStep
            otp={otp}
            size={size!}
            price={price}
            onView={() => setStep("tanker")}
          />
        )}

        {step === "tanker" && (
          <TankerStep
            mode={mode}
            queuePosition={queuePosition}
            batchTotal={batchTotal}
            onArrived={() => setStep("delivery")}
          />
        )}

        {step === "delivery" && (
          <DeliveryStep
            mode={mode}
            otp={otp}
            queuePosition={queuePosition}
            batchTotal={batchTotal}
            onConfirm={() => setStep("completed")}
          />
        )}

        {step === "completed" && (
          <CompletedStep
            size={size!}
            price={price}
            otp={otp}
            onHome={() => router.replace("/")}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* --- Sub-steps --- */

function RequestStep(props: {
  mode: RequestMode;
  setMode: (m: RequestMode) => void;
  size: number | null;
  setSize: (n: number) => void;
  priorityMode: PriorityMode;
  setPriorityMode: (p: PriorityMode) => void;
  onContinue: () => void;
}) {
  return (
    <View className="gap-5">
      <View className="flex-row gap-3">
        {(["batch", "priority"] as RequestMode[]).map((m) => (
          <Pressable
            key={m}
            onPress={() => props.setMode(m)}
            className={`flex-1 rounded-xl border p-4 ${
              props.mode === m
                ? "border-primary bg-primary/10"
                : "border-border bg-card"
            }`}
          >
            <Text className="text-foreground font-semibold capitalize">
              {m === "batch" ? "Batch Saver" : "Priority"}
            </Text>
            <Text className="text-muted text-xs mt-1">
              {m === "batch"
                ? `₦${BATCH_PRICE_PER_LITER}/L • shared`
                : `₦${PRIORITY_PRICE_PER_LITER}/L • dedicated`}
            </Text>
          </Pressable>
        ))}
      </View>

      <View>
        <Text className="text-foreground font-semibold mb-3">Tank size (L)</Text>
        <View className="flex-row flex-wrap gap-3">
          {TANK_SIZES.map((s) => (
            <Pressable
              key={s}
              onPress={() => props.setSize(s)}
              className={`px-5 py-3 rounded-xl border ${
                props.size === s
                  ? "border-primary bg-primary"
                  : "border-border bg-card"
              }`}
            >
              <Text
                className={`font-semibold ${
                  props.size === s ? "text-white" : "text-foreground"
                }`}
              >
                {s.toLocaleString()}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {props.mode === "priority" && (
        <View className="flex-row gap-3">
          {(["asap", "scheduled"] as PriorityMode[]).map((p) => (
            <Pressable
              key={p}
              onPress={() => props.setPriorityMode(p)}
              className={`flex-1 rounded-xl border p-3 ${
                props.priorityMode === p
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card"
              }`}
            >
              <Text className="text-foreground font-medium capitalize text-center">
                {p}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <Pressable
        disabled={!props.size}
        onPress={props.onContinue}
        className={`rounded-xl py-4 items-center mt-2 ${
          props.size ? "bg-primary" : "bg-border"
        }`}
      >
        <Text className="text-white font-semibold">Continue to Payment</Text>
      </Pressable>
    </View>
  );
}

function PaymentStep({
  price,
  size,
  mode,
  onPay,
  onCancel,
}: {
  price: number;
  size: number;
  mode: RequestMode;
  onPay: () => void;
  onCancel: () => void;
}) {
  return (
    <View className="gap-4">
      <View className="bg-card border border-border rounded-2xl p-5">
        <Row label="Mode" value={mode === "batch" ? "Batch Saver" : "Priority"} />
        <Row label="Volume" value={`${size.toLocaleString()} L`} />
        <Row label="Total" value={`₦${price.toLocaleString()}`} bold />
      </View>
      <Pressable onPress={onPay} className="bg-primary rounded-xl py-4 items-center">
        <Text className="text-white font-semibold">Pay ₦{price.toLocaleString()}</Text>
      </Pressable>
      <Pressable onPress={onCancel} className="border border-border rounded-xl py-4 items-center">
        <Text className="text-foreground font-medium">Cancel</Text>
      </Pressable>
    </View>
  );
}

function BatchStep({
  otp,
  size,
  price,
  onView,
}: {
  otp: string;
  size: number;
  price: number;
  onView: () => void;
}) {
  return (
    <View className="gap-4">
      <View className="bg-card border border-border rounded-2xl p-5 items-center">
        <Text className="text-muted text-sm">Your delivery OTP</Text>
        <Text className="text-foreground text-4xl font-bold tracking-widest mt-2">
          {otp}
        </Text>
      </View>
      <View className="bg-card border border-border rounded-2xl p-5">
        <Row label="Volume" value={`${size.toLocaleString()} L`} />
        <Row label="Paid" value={`₦${price.toLocaleString()}`} />
        <Row label="Status" value="Waiting for batch to fill" />
      </View>
      <Pressable onPress={onView} className="bg-primary rounded-xl py-4 items-center">
        <Text className="text-white font-semibold">View Tanker Status</Text>
      </Pressable>
    </View>
  );
}

function TankerStep({
  mode,
  queuePosition,
  batchTotal,
  onArrived,
}: {
  mode: RequestMode;
  queuePosition: number;
  batchTotal: number;
  onArrived: () => void;
}) {
  return (
    <View className="gap-4">
      <View className="bg-card border border-border rounded-2xl p-5">
        <Text className="text-foreground font-semibold mb-2">Tanker en route</Text>
        <Text className="text-muted text-sm">
          ETA: ~25 minutes • Driver: John D.
        </Text>
      </View>
      {mode === "batch" && (
        <QueueCard position={queuePosition} total={batchTotal} />
      )}
      <Pressable onPress={onArrived} className="bg-primary rounded-xl py-4 items-center">
        <Text className="text-white font-semibold">Tanker Arrived</Text>
      </Pressable>
    </View>
  );
}

function DeliveryStep({
  mode,
  otp,
  queuePosition,
  batchTotal,
  onConfirm,
}: {
  mode: RequestMode;
  otp: string;
  queuePosition: number;
  batchTotal: number;
  onConfirm: () => void;
}) {
  return (
    <View className="gap-4">
      {mode === "batch" && (
        <QueueCard position={queuePosition} total={batchTotal} />
      )}
      <View className="bg-card border border-border rounded-2xl p-5 items-center">
        <Text className="text-muted text-sm">Share OTP with driver</Text>
        <Text className="text-foreground text-4xl font-bold tracking-widest mt-2">
          {otp}
        </Text>
      </View>
      <Pressable onPress={onConfirm} className="bg-success rounded-xl py-4 items-center">
        <Text className="text-white font-semibold">Confirm Delivery</Text>
      </Pressable>
    </View>
  );
}

function CompletedStep({
  size,
  price,
  otp,
  onHome,
}: {
  size: number;
  price: number;
  otp: string;
  onHome: () => void;
}) {
  return (
    <View className="gap-4 items-center py-8">
      <View className="w-20 h-20 rounded-full bg-success/20 items-center justify-center">
        <Text className="text-success text-3xl">✓</Text>
      </View>
      <Text className="text-foreground text-2xl font-bold">Water Delivered!</Text>
      <Text className="text-muted">
        {size.toLocaleString()}L delivered to your tank
      </Text>
      <View className="w-full bg-card border border-border rounded-2xl p-5">
        <Row label="Volume" value={`${size.toLocaleString()} L`} />
        <Row label="Paid" value={`₦${price.toLocaleString()}`} />
        <Row label="OTP" value={otp} />
      </View>
      <Pressable onPress={onHome} className="w-full bg-primary rounded-xl py-4 items-center">
        <Text className="text-white font-semibold">Back to Home</Text>
      </Pressable>
    </View>
  );
}

function QueueCard({ position, total }: { position: number; total: number }) {
  const label =
    position === 1
      ? "You're up now"
      : position === 2
      ? "You're next"
      : `You're #${position} in the queue`;
  return (
    <View className="bg-card border border-primary/40 rounded-2xl p-5">
      <Text className="text-muted text-xs uppercase tracking-wider">
        Batch queue
      </Text>
      <Text className="text-foreground text-xl font-bold mt-1">{label}</Text>
      <Text className="text-muted text-sm mt-1">
        Position {position} of {total} stops in this batch
      </Text>
    </View>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View className="flex-row justify-between py-2">
      <Text className="text-muted">{label}</Text>
      <Text className={`text-foreground ${bold ? "font-bold" : "font-medium"}`}>
        {value}
      </Text>
    </View>
  );
}
