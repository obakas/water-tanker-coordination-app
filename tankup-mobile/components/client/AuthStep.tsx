import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { loginUser, createUser } from "@/lib/api";
import type { CurrentUser } from "@/types/client";
import { Input } from "@/components/ui/Input";

export function AuthStep({ onComplete }: { onComplete: (u: CurrentUser) => void }) {
  const [isNew, setIsNew] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!phone.trim()) {
      setError("Phone number is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const u = await loginUser({ phone: phone.trim() });
      onComplete(u);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!phone.trim() || !name.trim() || !address.trim()) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const u = await createUser({
        phone: phone.trim(),
        name: name.trim(),
        address: address.trim(),
      });

      onComplete(u);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="gap-4">
      {error && (
        <View className="bg-red-50 border border-red-200 rounded-xl p-3">
          <Text className="text-red-600 text-sm">{error}</Text>
        </View>
      )}

      <Input
        label="Phone Number"
        value={phone}
        onChangeText={setPhone}
        placeholder="+234..."
        keyboardType="phone-pad"
      />

      {isNew && (
        <>
          <Input label="Full Name" value={name} onChangeText={setName} placeholder="Amina Hassan" />
          <Input label="Delivery Address" value={address} onChangeText={setAddress} placeholder="12 Gana St, Maitama, Abuja" />
        </>
      )}

      <Pressable
        onPress={isNew ? handleRegister : handleLogin}
        disabled={loading}
        className="bg-primary rounded-xl py-4 items-center mt-2"
      >
        {loading ? <ActivityIndicator color="#fff" /> : (
          <Text className="text-white font-semibold">
            {isNew ? "Create Account" : "Continue"}
          </Text>
        )}
      </Pressable>

      <Pressable
        onPress={() => {
          setIsNew(!isNew);
          setError(null);
        }}
        className="items-center py-2"
      >
        <Text className="text-primary text-sm">
          {isNew ? "Already have an account? Sign in" : "New customer? Create account"}
        </Text>
      </Pressable>
    </View>
  );
}