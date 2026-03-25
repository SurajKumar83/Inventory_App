import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ENDPOINTS } from "../../../shared/api-client/endpoints.js";
import apiClient from "../../../shared/api-client/index.js";

export default function SuppliersScreen() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(ENDPOINTS.SUPPLIERS.LIST);
      setSuppliers(response.data.suppliers);
    } catch (err) {
      console.error("Failed to load suppliers:", err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSuppliers();
    setRefreshing(false);
  };

  const handleCall = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = (whatsapp) => {
    const phoneNumber = whatsapp.replace(/[^0-9]/g, "");
    Linking.openURL(`https://wa.me/${phoneNumber}`);
  };

  const handleEmail = (email) => {
    Linking.openURL(`mailto:${email}`);
  };

  const renderSupplier = ({ item }) => (
    <View style={styles.supplierCard}>
      <Text style={styles.supplierName}>{item.name}</Text>

      {item.contactName && (
        <Text style={styles.contactName}>Contact: {item.contactName}</Text>
      )}

      {item.supplierProducts && item.supplierProducts.length > 0 && (
        <View style={styles.productsContainer}>
          <Text style={styles.productsLabel}>
            Supplies ({item.supplierProducts.length}):
          </Text>
          <View style={styles.productChips}>
            {item.supplierProducts.slice(0, 3).map((sp) => (
              <View key={sp.productId} style={styles.productChip}>
                <Text style={styles.productChipText}>{sp.product.name}</Text>
              </View>
            ))}
            {item.supplierProducts.length > 3 && (
              <View style={styles.productChip}>
                <Text style={styles.productChipText}>
                  +{item.supplierProducts.length - 3} more
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      <View style={styles.actionsContainer}>
        {item.phone && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleCall(item.phone)}
          >
            <Ionicons name="call" size={20} color="#059669" />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
        )}

        {item.whatsapp && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleWhatsApp(item.whatsapp)}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            <Text style={styles.actionText}>WhatsApp</Text>
          </TouchableOpacity>
        )}

        {item.email && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEmail(item.email)}
          >
            <Ionicons name="mail" size={20} color="#3B82F6" />
            <Text style={styles.actionText}>Email</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Suppliers</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading suppliers...</Text>
        </View>
      ) : (
        <FlatList
          data={suppliers}
          renderItem={renderSupplier}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#059669"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No suppliers found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#059669",
  },
  listContainer: {
    padding: 16,
  },
  supplierCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  supplierName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  contactName: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
  },
  productsContainer: {
    marginBottom: 12,
  },
  productsLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  productChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  productChip: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  productChipText: {
    fontSize: 12,
    color: "#6B7280",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
  },
});
