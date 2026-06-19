import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Asset {
  id: string;
  name: string;
  type: "image" | "video" | "audio" | "document";
  url: string;
  size: number;
  uploadedAt: string;
  thumbnail?: string;
}

export default function AssetManagerScreen() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const cached = await AsyncStorage.getItem("assets");
      if (cached) {
        setAssets(JSON.parse(cached));
      }
    } catch (error) {
      console.error("Failed to load assets:", error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadAsset(result.assets[0]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
      console.error("Image picker error:", error);
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadAsset(result.assets[0]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take photo");
      console.error("Camera error:", error);
    }
  };

  const uploadAsset = async (asset: any) => {
    setUploading(true);
    try {
      // TODO: Implement tRPC upload mutation
      const newAsset: Asset = {
        id: `asset-${Date.now()}`,
        name: asset.fileName || "Unnamed",
        type: "image",
        url: asset.uri,
        size: asset.fileSize || 0,
        uploadedAt: new Date().toISOString(),
        thumbnail: asset.uri,
      };

      const updated = [newAsset, ...assets];
      setAssets(updated);
      await AsyncStorage.setItem("assets", JSON.stringify(updated));
      Alert.alert("Success", "Asset uploaded successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to upload asset");
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const deleteAsset = async (id: string) => {
    try {
      const updated = assets.filter(a => a.id !== id);
      setAssets(updated);
      await AsyncStorage.setItem("assets", JSON.stringify(updated));
    } catch (error) {
      Alert.alert("Error", "Failed to delete asset");
      console.error("Delete error:", error);
    }
  };

  const renderAssetItem = ({ item }: { item: Asset }) => (
    <View style={styles.assetCard}>
      {item.thumbnail && (
        <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
      )}
      <View style={styles.assetInfo}>
        <Text style={styles.assetName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.assetMeta}>
          {(item.size / 1024).toFixed(2)} KB •{" "}
          {new Date(item.uploadedAt).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => {
          Alert.alert("Delete", "Are you sure?", [
            { text: "Cancel", onPress: () => {} },
            {
              text: "Delete",
              onPress: () => deleteAsset(item.id),
              style: "destructive",
            },
          ]);
        }}
      >
        <Text style={styles.deleteIcon}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Upload Buttons */}
        <View style={styles.uploadSection}>
          <Text style={styles.sectionTitle}>Upload Asset</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.uploadButton, styles.galleryButton]}
              onPress={pickImage}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.uploadIcon}>📷</Text>
                  <Text style={styles.uploadButtonText}>Gallery</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.uploadButton, styles.cameraButton]}
              onPress={takePhoto}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.uploadIcon}>📸</Text>
                  <Text style={styles.uploadButtonText}>Camera</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Assets List */}
        <View style={styles.assetsSection}>
          <Text style={styles.sectionTitle}>Assets ({assets.length})</Text>
          {assets.length === 0 ? (
            <Text style={styles.emptyText}>
              No assets yet. Upload one to get started!
            </Text>
          ) : (
            <FlatList
              data={assets}
              renderItem={renderAssetItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
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
    padding: 16,
  },
  uploadSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  galleryButton: {
    backgroundColor: "#3b82f6",
  },
  cameraButton: {
    backgroundColor: "#8b5cf6",
  },
  uploadIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  assetsSection: {
    marginBottom: 32,
  },
  assetCard: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 12,
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  assetMeta: {
    color: "#9ca3af",
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
  },
  deleteIcon: {
    fontSize: 18,
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 32,
  },
});
