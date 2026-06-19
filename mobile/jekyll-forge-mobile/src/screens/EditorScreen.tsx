import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

type EditorMode = "visual" | "markdown" | "preview";

interface Post {
  id: string;
  title: string;
  content: string;
  frontMatter: Record<string, any>;
  status: "draft" | "published" | "scheduled";
  createdAt: string;
  updatedAt: string;
}

export default function EditorScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<EditorMode>("visual");
  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Load post from cache on mount
  useEffect(() => {
    loadDraft();
  }, []);

  // Auto-save to local storage
  useEffect(() => {
    if (unsavedChanges) {
      const timeout = setTimeout(() => {
        saveDraft();
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [title, content, unsavedChanges]);

  const loadDraft = async () => {
    try {
      const draft = await AsyncStorage.getItem("currentDraft");
      if (draft) {
        const parsed = JSON.parse(draft);
        setPost(parsed);
        setTitle(parsed.title);
        setContent(parsed.content);
      }
    } catch (error) {
      console.error("Failed to load draft:", error);
    }
  };

  const saveDraft = async () => {
    try {
      const draft: Post = {
        id: post?.id || `draft-${Date.now()}`,
        title,
        content,
        frontMatter: post?.frontMatter || {},
        status: "draft",
        createdAt: post?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem("currentDraft", JSON.stringify(draft));
      setPost(draft);
      setUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to save draft:", error);
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement tRPC publish mutation
      Alert.alert("Success", "Post published successfully");
      await AsyncStorage.removeItem("currentDraft");
      setTitle("");
      setContent("");
      setPost(null);
    } catch (error) {
      Alert.alert("Error", "Failed to publish post");
      console.error("Publish error:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderVisualMode = () => (
    <ScrollView style={styles.editorContent}>
      <TextInput
        style={styles.titleInput}
        placeholder="Post Title"
        placeholderTextColor="#6b7280"
        value={title}
        onChangeText={text => {
          setTitle(text);
          setUnsavedChanges(true);
        }}
      />
      <TextInput
        style={styles.contentInput}
        placeholder="Start typing your post..."
        placeholderTextColor="#6b7280"
        multiline
        value={content}
        onChangeText={text => {
          setContent(text);
          setUnsavedChanges(true);
        }}
      />
    </ScrollView>
  );

  const renderMarkdownMode = () => (
    <ScrollView style={styles.editorContent}>
      <View style={styles.frontMatterContainer}>
        <Text style={styles.frontMatterLabel}>Front Matter</Text>
        <TextInput
          style={styles.frontMatterInput}
          placeholder="---&#10;title: &#10;date: &#10;---"
          placeholderTextColor="#6b7280"
          multiline
          value={JSON.stringify(post?.frontMatter || {}, null, 2)}
          editable={false}
        />
      </View>
      <TextInput
        style={styles.contentInput}
        placeholder="# Markdown content..."
        placeholderTextColor="#6b7280"
        multiline
        value={content}
        onChangeText={text => {
          setContent(text);
          setUnsavedChanges(true);
        }}
      />
    </ScrollView>
  );

  const renderPreviewMode = () => (
    <ScrollView style={styles.editorContent}>
      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>{title || "Untitled"}</Text>
        <Text style={styles.previewMeta}>
          {post?.createdAt
            ? new Date(post.createdAt).toLocaleDateString()
            : "Draft"}
        </Text>
        <View style={styles.previewDivider} />
        <Text style={styles.previewContent}>{content || "No content yet"}</Text>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Mode Tabs */}
      <View style={styles.tabContainer}>
        {(["visual", "markdown", "preview"] as EditorMode[]).map(m => (
          <TouchableOpacity
            key={m}
            style={[styles.tab, mode === m && styles.activeTab]}
            onPress={() => setMode(m)}
          >
            <Text style={[styles.tabText, mode === m && styles.activeTabText]}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Editor Content */}
      {mode === "visual" && renderVisualMode()}
      {mode === "markdown" && renderMarkdownMode()}
      {mode === "preview" && renderPreviewMode()}

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={saveDraft}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {unsavedChanges ? "💾 Save" : "✓ Saved"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.publishButton]}
          onPress={handlePublish}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>📤 Publish</Text>
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
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
    paddingHorizontal: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#3b82f6",
  },
  tabText: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "500",
  },
  activeTabText: {
    color: "#3b82f6",
  },
  editorContent: {
    flex: 1,
    padding: 16,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  contentInput: {
    fontSize: 16,
    color: "#e5e7eb",
    minHeight: 300,
    textAlignVertical: "top",
  },
  frontMatterContainer: {
    marginBottom: 20,
  },
  frontMatterLabel: {
    color: "#9ca3af",
    fontSize: 12,
    marginBottom: 8,
    fontWeight: "600",
  },
  frontMatterInput: {
    backgroundColor: "#1e293b",
    color: "#e5e7eb",
    padding: 12,
    borderRadius: 6,
    fontFamily: "monospace",
    fontSize: 12,
    minHeight: 150,
    textAlignVertical: "top",
  },
  previewContainer: {
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 8,
  },
  previewTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  previewMeta: {
    color: "#9ca3af",
    fontSize: 14,
    marginBottom: 16,
  },
  previewDivider: {
    height: 1,
    backgroundColor: "#334155",
    marginBottom: 16,
  },
  previewContent: {
    color: "#e5e7eb",
    fontSize: 16,
    lineHeight: 24,
  },
  actionContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    backgroundColor: "#334155",
  },
  publishButton: {
    backgroundColor: "#3b82f6",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
