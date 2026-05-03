import { View, Text, Pressable } from "react-native";
import { RefreshCw } from "lucide-react-native";
import type { CreateRequestResponse } from "@/lib/api";
import { Row } from "@/components/ui/Row";

type Props = {
  requestResp: CreateRequestResponse;
  liveData: any;
  size: number;
  price: number;
  onLeave: () => void;
  onRefresh: () => void;
};

export function BatchStep({
  requestResp,
  liveData,
  size,
  price,
  onLeave,
  onRefresh,
}: Props) {
  const batchStatus = liveData?.batch?.status ?? liveData?.status ?? "collecting";
  const memberCount = liveData?.member_count ?? liveData?.batch?.member_count ?? "—";
  const myOtp = liveData?.member?.delivery_code ?? liveData?.delivery_code ?? "—";

  return (
    <View className="gap-4">
      <View className="bg-card border border-border rounded-2xl p-5 items-center">
        <Text className="text-muted-foreground text-sm">Your delivery OTP</Text>
        <Text className="text-foreground text-4xl font-bold tracking-widest mt-2">
          {myOtp}
        </Text>
        <Text className="text-muted-foreground text-xs mt-2">
          Share with driver at delivery
        </Text>
      </View>

      <View className="bg-card border border-border rounded-2xl p-5">
        <Row label="Volume" value={`${size.toLocaleString()} L`} />
        <Row label="Paid" value={`₦${price.toLocaleString()}`} />
        <Row label="Batch #" value={String(requestResp.batch_id ?? "—")} />
        <Row label="Members" value={String(memberCount)} />
        <Row
          label="Status"
          value={batchStatus === "collecting" ? "Waiting for batch to fill" : batchStatus}
        />
      </View>

      <Pressable
        onPress={onRefresh}
        className="flex-row items-center justify-center gap-2 border border-border rounded-xl py-3"
      >
        <RefreshCw color="#7c8aa6" size={16} />
        <Text className="text-muted-foreground font-medium">Refresh Status</Text>
      </Pressable>

      <Pressable
        onPress={onLeave}
        className="border border-red-200/40 rounded-xl py-3 items-center"
      >
        <Text className="text-red-600 font-medium">Leave Batch</Text>
      </Pressable>
    </View>
  );
}