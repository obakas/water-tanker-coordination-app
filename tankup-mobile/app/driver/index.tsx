import { useState } from "react";
import { View, Text, Pressable, ScrollView, Switch, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, HelpCircle, Truck, MapPin } from "lucide-react-native";
import type { DriverStep, DriverStop } from "@/types/driver";

const MOCK_OFFER = {
  jobId: 101,
  jobType: "batch" as const,
  totalVolumeLiters: 5000,
  stops: [
    { id: 1, name: "Aisha O.", address: "12 Palm St", volumeLiters: 1500, otp: "1234", delivered: false },
    { id: 2, name: "Tunde A.", address: "5 River Rd", volumeLiters: 2000, otp: "5678", delivered: false },
    { id: 3, name: "Chioma E.", address: "9 Hill Ave", volumeLiters: 1500, otp: "9012", delivered: false },
  ] as DriverStop[],
};

export default function DriverFlow() {
  const [online, setOnline] = useState(false);
  const [step, setStep] = useState<DriverStep>("offline");
  const [stops, setStops] = useState<DriverStop[]>(MOCK_OFFER.stops);

  const toggleOnline = (val: boolean) => {
    setOnline(val);
    if (val) {
      setStep("available");
      // Simulate incoming offer after 2s
      setTimeout(() => setStep("incoming"), 2000);
    } else {
      setStep("offline");
    }
  };

  const acceptOffer = () => setStep("loading");
  const declineOffer = () => setStep("available");

  const markDelivered = (id: number) => {
    const updated = stops.map((s) =>
      s.id === id ? { ...s, delivered: true } : s
    );
    setStops(updated);
    if (updated.every((s) => s.delivered)) {
      setStep("completed");
    }
  };

  const delivered = stops.filter((s) => s.delivered).length;
  const currentStopIndex = stops.findIndex((s) => !s.delivered);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-2">
          <ArrowLeft color="#e6edf7" size={20} />
        </Pressable>
        <View className="flex-row items-center gap-3">
          <View
            className={`w-2 h-2 rounded-full ${
              online ? "bg-success" : "bg-muted"
            }`}
          />
          <Text className="text-foreground font-medium">
            {online ? "Online" : "Offline"}
          </Text>
          <Switch
            value={online}
            onValueChange={toggleOnline}
            trackColor={{ true: "#1e88ff", false: "#1f2a44" }}
            thumbColor={online ? "#ffffff" : "#7c8aa6"}
          />
        </View>
        <Pressable
          onPress={() => Alert.alert("Help", "Driver support: 0800-DRIVER")}
          className="p-2"
        >
          <HelpCircle color="#e6edf7" size={20} />
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {step === "offline" && (
          <View className="bg-card border border-border rounded-2xl p-6 items-center">
            <Truck color="#7c8aa6" size={48} />
            <Text className="text-foreground font-semibold text-lg mt-4">
              You're offline
            </Text>
            <Text className="text-muted text-center mt-2">
              Toggle online above to start receiving delivery offers.
            </Text>
          </View>
        )}

        {step === "available" && (
          <View className="bg-card border border-border rounded-2xl p-6 items-center">
            <View className="w-3 h-3 rounded-full bg-success mb-3" />
            <Text className="text-foreground font-semibold text-lg">
              Waiting for offers...
            </Text>
            <Text className="text-muted text-center mt-2">
              You'll be notified when a job is assigned.
            </Text>
          </View>
        )}

        {step === "incoming" && (
          <View className="gap-4">
            <View className="bg-warning/10 border border-warning rounded-2xl p-5">
              <Text className="text-warning font-bold uppercase text-xs">
                New Offer
              </Text>
              <Text className="text-foreground text-xl font-bold mt-2">
                Batch • {MOCK_OFFER.totalVolumeLiters.toLocaleString()}L
              </Text>
              <Text className="text-muted mt-1">
                {MOCK_OFFER.stops.length} stops
              </Text>
            </View>
            <View className="flex-row gap-3">
              <Pressable
                onPress={declineOffer}
                className="flex-1 border border-border rounded-xl py-4 items-center"
              >
                <Text className="text-foreground font-medium">Decline</Text>
              </Pressable>
              <Pressable
                onPress={acceptOffer}
                className="flex-1 bg-primary rounded-xl py-4 items-center"
              >
                <Text className="text-white font-semibold">Accept</Text>
              </Pressable>
            </View>
          </View>
        )}

        {step === "loading" && (
          <View className="gap-4">
            <View className="bg-card border border-border rounded-2xl p-5">
              <Text className="text-foreground font-semibold">Load tanker</Text>
              <Text className="text-muted mt-1">
                Fill {MOCK_OFFER.totalVolumeLiters.toLocaleString()}L at the depot.
              </Text>
            </View>
            <Pressable
              onPress={() => setStep("delivering")}
              className="bg-primary rounded-xl py-4 items-center"
            >
              <Text className="text-white font-semibold">Loaded — Start Delivery</Text>
            </Pressable>
          </View>
        )}

        {step === "delivering" && (
          <View className="gap-4">
            <View className="bg-card border border-border rounded-2xl p-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-foreground font-semibold">Progress</Text>
                <Text className="text-primary font-bold">
                  {delivered}/{stops.length}
                </Text>
              </View>
              <View className="h-2 bg-border rounded-full overflow-hidden">
                <View
                  className="h-full bg-success"
                  style={{ width: `${(delivered / stops.length) * 100}%` }}
                />
              </View>
            </View>

            {stops.map((stop, idx) => {
              const isCurrent = idx === currentStopIndex;
              return (
                <View
                  key={stop.id}
                  className={`bg-card border rounded-2xl p-4 ${
                    isCurrent ? "border-primary" : "border-border"
                  } ${stop.delivered ? "opacity-50" : ""}`}
                >
                  <View className="flex-row items-center gap-2">
                    <View
                      className={`w-7 h-7 rounded-full items-center justify-center ${
                        stop.delivered ? "bg-success" : "bg-primary"
                      }`}
                    >
                      <Text className="text-white font-bold text-xs">
                        {stop.delivered ? "✓" : idx + 1}
                      </Text>
                    </View>
                    <Text className="text-foreground font-semibold flex-1">
                      {stop.name}
                    </Text>
                    <Text className="text-muted">{stop.volumeLiters}L</Text>
                  </View>
                  <View className="flex-row items-center gap-2 mt-2">
                    <MapPin color="#7c8aa6" size={14} />
                    <Text className="text-muted text-sm">{stop.address}</Text>
                  </View>
                  {!stop.delivered && isCurrent && (
                    <Pressable
                      onPress={() =>
                        Alert.prompt(
                          "Enter OTP",
                          `Customer OTP for ${stop.name}`,
                          (otp) => {
                            if (otp === stop.otp) markDelivered(stop.id);
                            else Alert.alert("Wrong OTP");
                          }
                        )
                      }
                      className="bg-primary rounded-xl py-3 items-center mt-3"
                    >
                      <Text className="text-white font-semibold">
                        Confirm Delivery
                      </Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {step === "completed" && (
          <View className="gap-4 items-center py-8">
            <View className="w-20 h-20 rounded-full bg-success/20 items-center justify-center">
              <Text className="text-success text-3xl">✓</Text>
            </View>
            <Text className="text-foreground text-2xl font-bold">
              Job Complete!
            </Text>
            <Text className="text-muted text-center">
              All {stops.length} stops delivered successfully.
            </Text>
            <Pressable
              onPress={() => {
                setStops(MOCK_OFFER.stops.map((s) => ({ ...s, delivered: false })));
                setStep("available");
              }}
              className="w-full bg-primary rounded-xl py-4 items-center"
            >
              <Text className="text-white font-semibold">Back Online</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
