import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  useConnectedAccounts,
  useDisconnectAccount,
} from "../hooks/useSocialMedia";
import { enqueueSocialDisconnect } from "../services/offlineQueueProducers";

interface Props {
  onAccountDisconnected?: () => void;
}

const platformIcons: Record<string, string> = {
  twitter: "𝕏",
  linkedin: "💼",
  facebook: "👍",
  instagram: "📸",
};

const platformNames: Record<string, string> = {
  twitter: "Twitter/X",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  instagram: "Instagram",
};

export default function SocialAccountManager({
  onAccountDisconnected,
}: Props) {
  const { data: accounts, isLoading, refetch } = useConnectedAccounts();
  const disconnectMutation = useDisconnectAccount();
  const [disconnecting, setDisconnecting] = useState<number | null>(null);

  const handleDisconnect = (accountId: number, platform: string) => {
    Alert.alert(
      "Disconnect Account",
      `Are you sure you want to disconnect your ${platformNames[platform]} account?`,
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Disconnect",
          onPress: async () => {
            setDisconnecting(accountId);
            try {
              await disconnectMutation.mutateAsync({ id: accountId });
              refetch();
              onAccountDisconnected?.();
            } catch (error) {
              await enqueueSocialDisconnect({ id: accountId });
              Alert.alert(
                "Disconnect queued",
                "The account will be disconnected when the connection is restored."
              );
            } finally {
              setDisconnecting(null);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const renderAccountCard = (account: NonNullable<typeof accounts>[number]) => (
    <View key={account.id} style={styles.accountCard}>
      <View style={styles.accountInfo}>
        <Text style={styles.accountIcon}>
          {platformIcons[account.platform]}
        </Text>
        <View style={styles.accountDetails}>
          <Text style={styles.accountUsername}>
            {account.displayName || account.username || account.accountId}
          </Text>
          <Text style={styles.accountPlatform}>
            {platformNames[account.platform]}
          </Text>
          <Text style={styles.accountDate}>
            Connected {new Date(account.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.disconnectButton}
        onPress={() => handleDisconnect(account.id, account.platform)}
        disabled={disconnecting === account.id}
      >
        {disconnecting === account.id ? (
          <ActivityIndicator size="small" color="#dc2626" />
        ) : (
          <Text style={styles.disconnectIcon}>✕</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#3b82f6" />
      </View>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔗</Text>
        <Text style={styles.emptyTitle}>No Connected Accounts</Text>
        <Text style={styles.emptyText}>
          Connect your social media accounts to publish directly from the app
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={accounts}
        renderItem={({ item }) => renderAccountCard(item)}
        keyExtractor={item => String(item.id)}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#1e293b",
    borderRadius: 8,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
  },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  accountInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  accountIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  accountDetails: {
    flex: 1,
  },
  accountUsername: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  accountPlatform: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 2,
  },
  accountDate: {
    fontSize: 11,
    color: "#6b7280",
  },
  disconnectButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
  },
  disconnectIcon: {
    fontSize: 18,
    color: "#dc2626",
    fontWeight: "bold",
  },
});
