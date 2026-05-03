import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { Droplet, Truck, Shield } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RoleSelect() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 py-10 justify-center">
        <View className="items-center mb-12">
          <View className="w-20 h-20 rounded-3xl bg-primary/20 items-center justify-center mb-4">
            <Droplet color="#1e88ff" size={40} />
          </View>
          <Text className="text-foreground text-3xl font-bold">TankUp</Text>
          <Text className="text-muted mt-2">Water delivery, on demand</Text>
        </View>

        <RoleCard
          icon={<Droplet color="#1e88ff" size={28} />}
          title="I'm a Customer"
          subtitle="Order water for my tank"
          onPress={() => router.push("/client")}
        />
        <RoleCard
          icon={<Truck color="#22c55e" size={28} />}
          title="I'm a Driver"
          subtitle="Deliver water to customers"
          onPress={() => router.push("/driver")}
        />
        <RoleCard
          icon={<Shield color="#f59e0b" size={28} />}
          title="Admin"
          subtitle="Manage operations"
          onPress={() => router.push("/admin")}
        />
      </View>
    </SafeAreaView>
  );
}

function RoleCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-4 bg-card border border-border rounded-2xl p-5 mb-4 active:opacity-70"
    >
      <View className="w-14 h-14 rounded-xl bg-background items-center justify-center">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-foreground text-lg font-semibold">{title}</Text>
        <Text className="text-muted text-sm mt-1">{subtitle}</Text>
      </View>
    </Pressable>
  );
}
