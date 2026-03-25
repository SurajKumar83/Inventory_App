import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          marginBottom: 16,
          color: "#059669",
        }}
      >
        DukaanSync Mobile
      </Text>
      <Text style={{ fontSize: 16, color: "#666", textAlign: "center" }}>
        Mobile inventory management app coming soon!
      </Text>
    </View>
  );
}
