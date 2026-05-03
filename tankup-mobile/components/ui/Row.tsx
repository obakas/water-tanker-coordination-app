import { View, Text } from "react-native";

type Props = {
  label: string;
  value: string;
  bold?: boolean;
};

export function Row({ label, value, bold }: Props) {
  return (
    <View className="flex-row justify-between py-2">
      <Text className="text-muted-foreground">{label}</Text>
      <Text className={`text-foreground ${bold ? "font-bold" : "font-medium"}`}>
        {value}
      </Text>
    </View>
  );
}