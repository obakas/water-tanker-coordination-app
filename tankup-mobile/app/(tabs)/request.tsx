import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type DeliveryType = "batch" | "priority";

export default function RequestScreen() {
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("batch");
  const [liters, setLiters] = useState("2000");
  const [address, setAddress] = useState("");

  function handleSubmit() {
    if (!liters || !address.trim()) {
      Alert.alert("Missing details", "Enter your liters and delivery address.");
      return;
    }

    Alert.alert(
      "Request captured",
      `Type: ${deliveryType}\nLiters: ${liters}\nAddress: ${address}`
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Water Request</Text>
      <Text style={styles.subtitle}>
        Start simple first. Backend connection comes next.
      </Text>

      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            deliveryType === "batch" && styles.toggleButtonActive,
          ]}
          onPress={() => setDeliveryType("batch")}
        >
          <Text
            style={[
              styles.toggleText,
              deliveryType === "batch" && styles.toggleTextActive,
            ]}
          >
            Batch
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            deliveryType === "priority" && styles.toggleButtonActive,
          ]}
          onPress={() => setDeliveryType("priority")}
        >
          <Text
            style={[
              styles.toggleText,
              deliveryType === "priority" && styles.toggleTextActive,
            ]}
          >
            Priority
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Liters needed</Text>
      <TextInput
        value={liters}
        onChangeText={setLiters}
        keyboardType="numeric"
        placeholder="e.g. 2000"
        style={styles.input}
      />

      <Text style={styles.label}>Delivery address</Text>
      <TextInput
        value={address}
        onChangeText={setAddress}
        placeholder="e.g. Asokoro, Abuja"
        style={[styles.input, styles.textArea]}
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 24,
  },
  subtitle: {
    color: "#64748b",
    marginTop: 8,
    marginBottom: 24,
    fontSize: 15,
  },
  toggleRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#0f766e",
    borderColor: "#0f766e",
  },
  toggleText: {
    fontWeight: "800",
    color: "#334155",
  },
  toggleTextActive: {
    color: "white",
  },
  label: {
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    marginBottom: 18,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#0f766e",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "800",
    fontSize: 16,
  },
});