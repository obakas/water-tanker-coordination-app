import { Alert, Pressable, Text, View } from "react-native";
import { ArrowLeft, HelpCircle, Moon, Sun } from "lucide-react-native";
import type { AppTheme } from "@/components/ui/theme";

type Props = {
  title: string;
  onBack: () => void;
  theme: ReturnType<typeof import("@/components/ui/theme").getTheme>;
  themeMode: AppTheme;
  onToggleTheme: () => void;
};

export function ClientHeader({
  title,
  onBack,
  theme,
  themeMode,
  onToggleTheme,
}: Props) {
  const iconColor = theme.foreground;

  return (
    <View
      style={{
        backgroundColor: theme.background,
        borderBottomColor: theme.border,
      }}
      className="flex-row items-center justify-between px-4 py-3 border-b"
    >
      <Pressable onPress={onBack} className="p-2">
        <ArrowLeft color={iconColor} size={20} />
      </Pressable>

      <Text style={{ color: theme.foreground }} className="font-bold text-base">
        {title}
      </Text>

      <View className="flex-row items-center gap-2">
        <Pressable onPress={onToggleTheme} className="p-2">
          {themeMode === "dark" ? (
            <Sun color={iconColor} size={20} />
          ) : (
            <Moon color={iconColor} size={20} />
          )}
        </Pressable>

        <Pressable
          onPress={() => Alert.alert("Help", "Contact support: 0800-TANKUP")}
          className="p-2"
        >
          <HelpCircle color={iconColor} size={20} />
        </Pressable>
      </View>
    </View>
  );
}

// src/client/components/ClientHeader.tsx

// import { Alert, Pressable, Text, View } from "react-native";
// import { ArrowLeft, HelpCircle } from "lucide-react-native";

// type Props = {
//   title: string;
//   onBack: () => void;
// };

// export function ClientHeader({ title, onBack }: Props) {
//   return (
//     <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
//       <Pressable onPress={onBack} className="p-2">
//         <ArrowLeft color="#111827" size={20} />
//       </Pressable>

//       <Text className="text-foreground font-bold text-base">{title}</Text>

//       <Pressable
//         onPress={() => Alert.alert("Help", "Contact support: 0800-TANKUP")}
//         className="p-2"
//       >
//         <HelpCircle color="#111827" size={20} />
//       </Pressable>
//     </View>
//   );
// }