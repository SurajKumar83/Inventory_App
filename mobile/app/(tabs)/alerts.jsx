import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ENDPOINTS } from "../../../shared/api-client/endpoints.js";
import apiClient from "../../../shared/api-client/index.js";

export default function AlertsScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("ACTIVE");

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({ status: filter });
      const response = await apiClient.get(
        `${ENDPOINTS.ALERTS.LIST}?${queryParams.toString()}`,
      );
      setAlerts(response.data.alerts);
    } catch (err) {
      console.error("Failed to load alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  const handleMarkViewed = async (alertId) => {
    try {
      await apiClient.patch(ENDPOINTS.ALERTS.MARK_VIEWED(alertId));
      loadAlerts();
    } catch (err) {
      console.error("Failed to mark alert as viewed:", err);
    }
  };

  const handleContactSupplier = async (alert) => {
    try {
      const response = await apiClient.get(
        ENDPOINTS.ALERTS.CONTACT_SUPPLIER(alert.id),
      );
      const contact = response.data;

      // Open WhatsApp if available
      if (contact.supplier.whatsapp) {
        const whatsappUrl = `https://wa.me/${contact.supplier.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(contact.message)}`;
        // Linking.openURL(whatsappUrl);
        console.log("Open WhatsApp:", whatsappUrl);
      } else {
        alert("No WhatsApp number available for this supplier");
      }
    } catch (err) {
      console.error("Failed to get supplier contact:", err);
      alert(err.response?.data?.error || "Failed to get supplier contact");
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "HIGH":
        return "#DC2626";
      case "MEDIUM":
        return "#F59E0B";
      case "LOW":
        return "#3B82F6";
      default:
        return "#6B7280";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const renderAlert = ({ item }) => (
    <View style={styles.alertCard}>
      <View style={styles.alertHeader}>
        <View
          style={[
            styles.severityBadge,
            { backgroundColor: getSeverityColor(item.severity) },
          ]}
        >
          <Text style={styles.severityText}>{item.severity}</Text>
        </View>
        <Text style={styles.shopName}>{item.shop.name}</Text>
      </View>

      <Text style={styles.alertMessage}>{item.message}</Text>

      <View style={styles.productInfo}>
        <Text style={styles.productText}>
          {item.product.name} ({item.product.sku})
        </Text>
      </View>

      <Text style={styles.timestampText}>
        Triggered: {formatDate(item.triggeredAt)}
      </Text>

      <View style={styles.actionsContainer}>
        {item.status === "ACTIVE" && (
          <TouchableOpacity
            style={[styles.actionButton, styles.markViewedButton]}
            onPress={() => handleMarkViewed(item.id)}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.actionButtonText}>Mark Viewed</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.contactButton]}
          onPress={() => handleContactSupplier(item)}
        >
          <Ionicons name="call-outline" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Contact Supplier</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts</Text>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "ACTIVE" && styles.filterButtonActive,
            ]}
            onPress={() => setFilter("ACTIVE")}
          >
            <Text
              style={[
                styles.filterText,
                filter === "ACTIVE" && styles.filterTextActive,
              ]}
            >
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "VIEWED" && styles.filterButtonActive,
            ]}
            onPress={() => setFilter("VIEWED")}
          >
            <Text
              style={[
                styles.filterText,
                filter === "VIEWED" && styles.filterTextActive,
              ]}
            >
              Viewed
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading alerts...</Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          renderItem={renderAlert}
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
              <Text style={styles.emptyText}>No alerts found</Text>
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
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  filterButtonActive: {
    backgroundColor: "#059669",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  listContainer: {
    padding: 16,
  },
  alertCard: {
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
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  severityText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  shopName: {
    fontSize: 14,
    color: "#6B7280",
  },
  alertMessage: {
    fontSize: 16,
    color: "#1F2937",
    marginBottom: 12,
  },
  productInfo: {
    marginBottom: 8,
  },
  productText: {
    fontSize: 14,
    color: "#6B7280",
  },
  timestampText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 12,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  markViewedButton: {
    backgroundColor: "#6B7280",
  },
  contactButton: {
    backgroundColor: "#059669",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
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
