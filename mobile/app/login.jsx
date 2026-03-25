import { useRouter } from "expo-router";
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
import useAuthStore from "../../../shared/stores/authStore";
import { login, verifyMFA } from "../services/auth.service";

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth, setMFARequired } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [requiresMFA, setRequiresMFA] = useState(false);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const response = await login(email, password);

      if (response.requiresMFA) {
        setRequiresMFA(true);
        setUserId(response.userId);
        setMFARequired(true, response.userId);
        Alert.alert("MFA Required", "Please check your email for the OTP code");
      } else {
        setAuth(response.user, response.accessToken, response.refreshToken);
        router.replace("/(tabs)/inventory");
      }
    } catch (err) {
      Alert.alert(
        "Login Failed",
        err.response?.data?.error || "Invalid credentials",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMFA = async () => {
    if (!otp.trim()) {
      Alert.alert("Error", "Please enter the OTP code");
      return;
    }

    setLoading(true);
    try {
      const response = await verifyMFA(userId, otp);
      setAuth(response.user, response.accessToken, response.refreshToken);
      router.replace("/(tabs)/inventory");
    } catch (err) {
      Alert.alert(
        "Verification Failed",
        err.response?.data?.error || "Invalid OTP",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>DukaanSync</Text>
        <Text style={styles.subtitle}>Multi-Shop Inventory Management</Text>

        {!requiresMFA ? (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            <View style={styles.demoCredentials}>
              <Text style={styles.demoTitle}>Demo Credentials</Text>
              <Text style={styles.demoText}>Email: owner@dukaansync.com</Text>
              <Text style={styles.demoText}>Password: Password123!</Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.mfaContainer}>
              <Text style={styles.mfaTitle}>Enter OTP Code</Text>
              <Text style={styles.mfaSubtitle}>
                We've sent a 6-digit code to your email
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>OTP Code</Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                value={otp}
                onChangeText={setOtp}
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleVerifyMFA}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Verify OTP</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setRequiresMFA(false);
                setOtp("");
              }}
            >
              <Text style={styles.backButtonText}>Back to Login</Text>
            </TouchableOpacity>
          </>
        )}
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
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#059669",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 40,
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
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  otpInput: {
    textAlign: "center",
    fontSize: 24,
    letterSpacing: 8,
  },
  loginButton: {
    backgroundColor: "#059669",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  demoCredentials: {
    marginTop: 40,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  demoText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  mfaContainer: {
    marginBottom: 30,
  },
  mfaTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 8,
  },
  mfaSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  backButton: {
    marginTop: 20,
    alignItems: "center",
  },
  backButtonText: {
    color: "#059669",
    fontSize: 16,
    fontWeight: "600",
  },
});
