import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import useInventoryStore from "../../../shared/stores/inventoryStore";
import { getProducts } from "../services/inventory.service";

export default function InventoryScreen() {
  const router = useRouter();
  const {
    products,
    loading,
    pagination,
    filters,
    setProducts,
    setLoading,
    setFilters,
  } = useInventoryStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Initialize sync manager on mount
    initSyncManager();
    loadProducts();
  }, [filters, pagination.page]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const result = await getProducts({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      });
      setProducts(result.products, result.pagination);
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const getStockStatus = (stock) => {
    if (stock.quantity === 0) return { text: "Out of Stock", color: "#DC2626" };
    if (stock.quantity <= stock.reorderLevel)
      return { text: "Low Stock", color: "#F59E0B" };
    return { text: "In Stock", color: "#059669" };
  };

  const renderProduct = ({ item }) => {
    const shop1Stock = item.stock?.find((s) => s.shopId === "shop1");
    const shop2Stock = item.stock?.find((s) => s.shopId === "shop2");

    return (
      <View style={styles.productCard}>
        <View style={styles.productHeader}>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productSku}>SKU: {item.sku}</Text>
            <Text style={styles.productCategory}>{item.category}</Text>
          </View>
          <Text style={styles.productPrice}>₹{item.price.toFixed(2)}</Text>
        </View>

        <View style={styles.stockContainer}>
          {/* Shop 1 Stock */}
          <View style={styles.stockItem}>
            <Text style={styles.shopName}>Shop 1</Text>
            {shop1Stock && (
              <>
                <Text
                  style={[
                    styles.stockStatus,
                    { color: getStockStatus(shop1Stock).color },
                  ]}
                >
                  {getStockStatus(shop1Stock).text}
                </Text>
                <Text style={styles.stockQuantity}>
                  {shop1Stock.quantity} {item.unit}
                </Text>
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() =>
                    router.push({
                      pathname: "/(modals)/stock-adjust",
                      params: {
                        productId: item.id,
                        shopId: "shop1",
                        productName: item.name,
                        currentStock: shop1Stock.quantity,
                        unit: item.unit,
                      },
                    })
                  }
                >
                  <Text style={styles.adjustButtonText}>Adjust</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Shop 2 Stock */}
          <View style={styles.stockItem}>
            <Text style={styles.shopName}>Shop 2</Text>
            {shop2Stock && (
              <>
                <Text
                  style={[
                    styles.stockStatus,
                    { color: getStockStatus(shop2Stock).color },
                  ]}
                >
                  {getStockStatus(shop2Stock).text}
                </Text>
                <Text style={styles.stockQuantity}>
                  {shop2Stock.quantity} {item.unit}
                </Text>
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() =>
                    router.push({
                      pathname: "/(modals)/stock-adjust",
                      params: {
                        productId: item.id,
                        shopId: "shop2",
                        productName: item.name,
                        currentStock: shop2Stock.quantity,
                        unit: item.unit,
                      },
                    })
                  }
                >
                  <Text style={styles.adjustButtonText}>Adjust</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Transfer Button */}
        <TouchableOpacity
          style={styles.transferButton}
          onPress={() =>
            router.push({
              pathname: "/(modals)/transfer",
              params: {
                productId: item.id,
                productName: item.name,
                shop1Stock: shop1Stock?.quantity || 0,
                shop2Stock: shop2Stock?.quantity || 0,
                unit: item.unit,
              },
            })
          }
        >
          <Ionicons name="swap-horizontal" size={20} color="#FFFFFF" />
          <Text style={styles.transferButtonText}>Transfer Between Shops</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={filters.search}
          onChangeText={(text) => setFilters({ search: text })}
        />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
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
              <Text style={styles.emptyText}>No products found</Text>
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
  searchInput: {
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  productCard: {
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
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  productSku: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: "#6B7280",
  },
  productPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#059669",
  },
  stockContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  stockItem: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  shopName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  stockStatus: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  stockQuantity: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  adjustButton: {
    backgroundColor: "#059669",
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  adjustButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  transferButton: {
    backgroundColor: "#3B82F6",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  transferButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
