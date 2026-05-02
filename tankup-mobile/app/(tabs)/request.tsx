import { router } from "expo-router";
import ClientView from "@/src/components/ClientView";

export default function RequestScreen() {
  return <ClientView onBack={() => router.back()} />;
}
