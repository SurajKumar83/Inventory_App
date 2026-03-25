import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { adjustStock } from "../services/inventory.service";
import { addToQueue } from "../services/offlineQueue";
import { checkOnlineStatus } from "../services/syncManager";

export default function StockAdjustModal() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { productId, shopId, productName, currentStock, unit } = params;

  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty === 0) {
      Alert.alert(
        "Invalid Quantity",
        "Please enter a valid quantity (positive to add, negative to remove)",
      );
      return;
    }

    if (!reason.trim()) {
      Alert.alert(
        "Reason Required",
        "Please provide a reason for this adjustment",
      );
      return;
    }

    setLoading(true);
    try {
      const isOnline = await checkOnlineStatus();

      if (isOnline) {
        // Online: execute immediately
        await adjustStock({
          productId,
          shopId,
          quantity: qty,
          reason: reason.trim(),
        });
        Alert.alert("Success", "Stock adjusted successfully");
      } else {
        // Offline: add to queue
        await addToQueue({
          type: "adjustStock",
          data: {
            productId,
            shopId,
            quantity: qty,
            reason: reason.trim(),
          },
        });
        Alert.alert(
          "Queued",
          "You are offline. This operation will be synced when connection is restored.",
        );
      }

      router.back();
    } catch (err) {
      Alert.alert(
        "Error",
        err.response?.data?.error || "Failed to adjust stock",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Adjust Stock</Text>

        <View style={styles.productInfo}>
          <Text style={styles.productName}>{productName}</Text>
          <Text style={styles.currentStock}>
            Current Stock: {currentStock} {unit}
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Quantity</Text>
          <Text style={styles.hint}>
            Enter positive number to add, negative to remove
          </Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            placeholder="e.g., +10 or -5"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Reason *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={reason}
            onChangeText={setReason}
            placeholder="Reason for adjustment..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Adjust Stock</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#059669",
    marginBottom: 20,
  },
  productInfo: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  productName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  currentStock: {
    fontSize: 16,
    color: "#6B7280",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  hint: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#059669",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
