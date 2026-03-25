import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Picker,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { transferStock } from "../services/inventory.service";
import { addToQueue } from "../services/offlineQueue";
import { checkOnlineStatus } from "../services/syncManager";

export default function TransferModal() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { productId, productName, shop1Stock, shop2Stock, unit } = params;

  const [fromShopId, setFromShopId] = useState("shop1");
  const [toShopId, setToShopId] = useState("shop2");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const fromStock =
    fromShopId === "shop1" ? parseInt(shop1Stock) : parseInt(shop2Stock);
  const toStock =
    toShopId === "shop1" ? parseInt(shop1Stock) : parseInt(shop2Stock);

  const handleSubmit = async () => {
    if (fromShopId === toShopId) {
      Alert.alert(
        "Invalid Transfer",
        "Source and destination shops must be different",
      );
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert("Invalid Quantity", "Please enter a valid positive quantity");
      return;
    }

    if (qty > fromStock) {
      Alert.alert(
        "Insufficient Stock",
        `Only ${fromStock} ${unit} available at source shop`,
      );
      return;
    }

    if (!reason.trim()) {
      Alert.alert(
        "Reason Required",
        "Please provide a reason for this transfer",
      );
      return;
    }

    setLoading(true);
    try {
      const isOnline = await checkOnlineStatus();

      if (isOnline) {
        // Online: execute immediately
        await transferStock({
          productId,
          fromShopId,
          toShopId,
          quantity: qty,
          reason: reason.trim(),
        });
        Alert.alert("Success", "Stock transferred successfully");
      } else {
        // Offline: add to queue
        await addToQueue({
          type: "transferStock",
          data: {
            productId,
            fromShopId,
            toShopId,
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
        err.response?.data?.error || "Failed to transfer stock",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Transfer Stock</Text>

        <View style={styles.productInfo}>
          <Text style={styles.productName}>{productName}</Text>
        </View>

        <View style={styles.shopContainer}>
          <View style={styles.shopColumn}>
            <Text style={styles.label}>From Shop</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={fromShopId}
                onValueChange={(value) => {
                  setFromShopId(value);
                  if (value === toShopId) {
                    setToShopId(value === "shop1" ? "shop2" : "shop1");
                  }
                }}
                style={styles.picker}
              >
                <Picker.Item label="Shop 1" value="shop1" />
                <Picker.Item label="Shop 2" value="shop2" />
              </Picker>
            </View>
            <Text style={styles.stockInfo}>
              Available: {fromStock} {unit}
            </Text>
          </View>

          <View style={styles.shopColumn}>
            <Text style={styles.label}>To Shop</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={toShopId}
                onValueChange={(value) => {
                  setToShopId(value);
                  if (value === fromShopId) {
                    setFromShopId(value === "shop1" ? "shop2" : "shop1");
                  }
                }}
                style={styles.picker}
              >
                <Picker.Item label="Shop 1" value="shop1" />
                <Picker.Item label="Shop 2" value="shop2" />
              </Picker>
            </View>
            <Text style={styles.stockInfo}>
              Current: {toStock} {unit}
            </Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Quantity *</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            placeholder={`Max: ${fromStock}`}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Reason *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={reason}
            onChangeText={setReason}
            placeholder="Reason for transfer..."
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
              <Text style={styles.submitButtonText}>Transfer</Text>
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
  },
  shopContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  shopColumn: {
    flex: 1,
  },
  pickerContainer: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    marginBottom: 8,
  },
  picker: {
    height: 50,
  },
  stockInfo: {
    fontSize: 14,
    color: "#6B7280",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
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
    backgroundColor: "#3B82F6",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
