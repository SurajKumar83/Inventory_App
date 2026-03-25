import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { ENDPOINTS } from "../../../shared/api-client/endpoints.js";
import apiClient from "../../../shared/api-client/index.js";
import useAuthStore from "../../../shared/stores/authStore.js";

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await apiClient.get(ENDPOINTS.DASHBOARD.STATS);
      setStats(response.data);
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const MetricCard = ({ title, value, subtitle, color, onPress }) => (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: color, borderLeftWidth: 4 }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>{value}</Text>
      {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Your Two Shops</Text>
        <Text style={styles.headerSubtitle}>
          Welcome back, {user?.firstName}!
        </Text>
      </View>

      {stats ? (
        <View style={styles.metricsContainer}>
          <View style={styles.row}>
            <MetricCard
              title="Total Products"
              value={stats.totalProducts}
              subtitle={`${stats.totalShops} shops`}
              color="#3B82F6"
              onPress={() => router.push("/inventory")}
            />
            <MetricCard
              title="Low Stock"
              value={stats.lowStockCount}
              subtitle={`${stats.activeAlertsCount} alerts`}
              color="#F59E0B"
              onPress={() => router.push("/alerts")}
            />
          </View>

          <View style={styles.row}>
            <MetricCard
              title="Today's Sales"
              value={`₹${stats.todaysSales.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}`}
              subtitle={`${stats.todaysOrderCount} orders`}
              color="#059669"
            />
            <MetricCard
              title="Pending Orders"
              value={stats.pendingOrdersCount}
              subtitle="Awaiting action"
              color="#8B5CF6"
            />
          </View>

          <View style={styles.fullWidthRow}>
            <MetricCard
              title="Total Customers"
              value={stats.totalCustomers}
              color="#3B82F6"
            />
            <MetricCard
              title="Suppliers"
              value={stats.totalSuppliers}
              color="#059669"
              onPress={() => router.push("/suppliers")}
            />
          </View>

          {/* Recent Orders */}
          {stats.recentOrders && stats.recentOrders.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Orders</Text>
              {stats.recentOrders.map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
                    <Text style={styles.orderTotal}>
                      ₹{order.total.toFixed(2)}
                    </Text>
                  </View>
                  <Text style={styles.orderCustomer}>{order.customerName}</Text>
                  <Text style={styles.orderDetails}>
                    {order.itemCount} items •{" "}
                    {new Date(order.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#059669",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  metricsContainer: {
    padding: 16,
  },
  row: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 12,
  },
  fullWidthRow: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#059669",
  },
  orderCustomer: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 4,
  },
  orderDetails: {
    fontSize: 12,
    color: "#6B7280",
  },
  loading: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
  },
});
