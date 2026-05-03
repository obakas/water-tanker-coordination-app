import { View, Text, Pressable, ActivityIndicator } from "react-native";
import {
  TANK_SIZES,
  BATCH_PRICE_PER_LITER,
  PRIORITY_PRICE_PER_LITER,
} from "@/constants/water";
import type { RequestMode, PriorityMode } from "@/types/client";

type Props = {
  mode: RequestMode;
  setMode: (m: RequestMode) => void;
  size: number | null;
  setSize: (n: number) => void;
  priorityMode: PriorityMode;
  setPriorityMode: (p: PriorityMode) => void;
  onContinue: () => void;
  loading: boolean;
};

export function RequestStep({
  mode,
  setMode,
  size,
  setSize,
  priorityMode,
  setPriorityMode,
  onContinue,
  loading,
}: Props) {
  const price =
    (size ?? 0) *
    (mode === "batch" ? BATCH_PRICE_PER_LITER : PRIORITY_PRICE_PER_LITER);

  return (
    <View className="gap-5">
      <View className="flex-row gap-3">
        {(["batch", "priority"] as RequestMode[]).map((m) => (
          <Pressable
            key={m}
            onPress={() => setMode(m)}
            className={`flex-1 rounded-xl border p-4 ${
              mode === m ? "border-primary bg-primary/10" : "border-border bg-card"
            }`}
          >
            <Text className="text-foreground font-semibold">
              {m === "batch" ? "Batch Saver" : "Priority"}
            </Text>

            <Text className="text-muted-foreground text-xs mt-1">
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
              onPress={() => setSize(s)}
              className={`px-5 py-3 rounded-xl border ${
                size === s ? "border-primary bg-primary" : "border-border bg-card"
              }`}
            >
              <Text className={`font-semibold ${size === s ? "text-white" : "text-foreground"}`}>
                {s.toLocaleString()}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {mode === "priority" && (
        <View className="flex-row gap-3">
          {(["asap", "scheduled"] as PriorityMode[]).map((p) => (
            <Pressable
              key={p}
              onPress={() => setPriorityMode(p)}
              className={`flex-1 rounded-xl border p-3 ${
                priorityMode === p ? "border-primary bg-primary/10" : "border-border bg-card"
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
        disabled={!size || loading}
        onPress={onContinue}
        className={`rounded-xl py-4 items-center mt-2 ${
          size && !loading ? "bg-primary" : "bg-border"
        }`}
      >
        {loading ? <ActivityIndicator color="#fff" /> : (
          <Text className="text-white font-semibold">
            {size ? `Continue — ₦${price.toLocaleString()}` : "Select a tank size"}
          </Text>
        )}
      </Pressable>
    </View>
  );
}