import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useAuthStore } from "../stores/authStore";
import { getTrpcClient } from "../utils/trpc";
import { getMobileApiBaseUrl } from "../utils/apiBaseUrl";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [loading, setLoading] = React.useState(false);
  const { setToken, setUser } = useAuthStore();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const apiUrl = getMobileApiBaseUrl(process.env.EXPO_PUBLIC_API_URL);
      const redirectUrl = "jekyllforge://auth-callback";

      const startResponse = await fetch(`${apiUrl}/api/oauth/mobile/start`);
      if (!startResponse.ok) {
        throw new Error("Unable to start mobile sign-in.");
      }
      const { authorizationUrl } = (await startResponse.json()) as {
        authorizationUrl?: string;
      };
      if (!authorizationUrl) {
        throw new Error("Mobile sign-in did not return an authorization URL.");
      }

      const result = await WebBrowser.openAuthSessionAsync(
        authorizationUrl,
        redirectUrl
      );

      if (result.type === "success") {
        const url = new URL(result.url);
        const code = url.searchParams.get("code");

        if (code) {
          const data = await getTrpcClient().auth.exchangeMobileCode.mutate({
            code,
          });
          await setToken(data.token);
          await setUser({
            id: String(data.user.id),
            openId: data.user.openId,
            name: data.user.name ?? "",
            email: data.user.email ?? "",
          });
        }
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Jekyll Forge</Text>
        <Text style={styles.subtitle}>Manage your Jekyll blog on the go</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In with Manus</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#9ca3af",
    marginBottom: 40,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
