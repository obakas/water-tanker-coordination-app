import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

export default function AdminDashboard() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-2">
          <ArrowLeft color="#e6edf7" size={20} />
        </Pressable>
        <Text className="text-foreground font-bold text-base ml-2">
          Admin Dashboard
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Stat label="Active drivers" value="14" />
        <Stat label="Open batches" value="6" />
        <Stat label="Priority requests" value="3" />
        <Stat label="Today's revenue" value="₦142,500" />
        <View className="bg-card border border-border rounded-2xl p-4 mt-4">
          <Text className="text-foreground font-semibold mb-2">Note</Text>
          <Text className="text-muted text-sm">
            This is a placeholder. Connect to your backend's /admin endpoints to
            populate live data and management actions.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="bg-card border border-border rounded-2xl p-4">
      <Text className="text-muted text-xs uppercase tracking-wider">{label}</Text>
      <Text className="text-foreground text-2xl font-bold mt-1">{value}</Text>
    </View>
  );
}
