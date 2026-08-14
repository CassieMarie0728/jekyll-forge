import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { trpc } from "../utils/trpc";
import { useSites } from "../hooks/useSites";
import { MobilePostStatus, useCreatePost, useDeletePost } from "../hooks/usePosts";
import {
  getCommittedSha,
  joinSitePath,
  serializeJekyllPost,
  slugify,
} from "../utils/editorPublishing";
import type { RepositoryPublishQueueData } from "../services/offlineQueueContracts";
import { enqueueRepositoryPublish } from "../services/offlineQueueProducers";

type EditorMode = "visual" | "markdown" | "preview";

type EditorDraft = {
  serverId?: number;
  siteId?: number;
  path?: string;
  sha?: string;
  title: string;
  content: string;
  frontMatter: Record<string, unknown>;
  status: MobilePostStatus;
  createdAt: string;
  updatedAt: string;
};

const DRAFT_STORAGE_KEY = "currentDraft";
const ACTIVE_SITE_STORAGE_KEY = "activeSiteId";

export default function EditorScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<EditorMode>("visual");
  const [draft, setDraft] = useState<EditorDraft | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [activeSiteId, setActiveSiteId] = useState<number | null>(null);

  const sitesQuery = useSites();
  const upsertPostMutation = useCreatePost();
  const deletePostMutation = useDeletePost();
  const commitFileMutation = trpc.github.commitFile.useMutation();
  const deleteFileMutation = trpc.github.deleteFile.useMutation();
  const activeSite = sitesQuery.data?.find(site => site.id === activeSiteId);

  const createLocalDraft = (overrides: Partial<EditorDraft> = {}): EditorDraft => ({
    serverId: overrides.serverId ?? draft?.serverId,
    siteId: overrides.siteId ?? activeSiteId ?? draft?.siteId,
    path: overrides.path ?? draft?.path,
    sha: overrides.sha ?? draft?.sha,
    title: overrides.title ?? title,
    content: overrides.content ?? content,
    frontMatter: overrides.frontMatter ?? draft?.frontMatter ?? {},
    status: overrides.status ?? draft?.status ?? "draft",
    createdAt: overrides.createdAt ?? draft?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const saveLocalDraft = async (overrides: Partial<EditorDraft> = {}) => {
    const nextDraft = createLocalDraft(overrides);
    await AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(nextDraft));
    setDraft(nextDraft);
    setUnsavedChanges(false);
    return nextDraft;
  };

  useEffect(() => {
    void (async () => {
      try {
        const rawDraft = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
        if (!rawDraft) return;
        const parsed = JSON.parse(rawDraft) as Partial<EditorDraft>;
        const restored = createLocalDraft({
          serverId:
            typeof parsed.serverId === "number" ? parsed.serverId : undefined,
          siteId: typeof parsed.siteId === "number" ? parsed.siteId : undefined,
          path: typeof parsed.path === "string" ? parsed.path : undefined,
          sha: typeof parsed.sha === "string" ? parsed.sha : undefined,
          title: typeof parsed.title === "string" ? parsed.title : "",
          content: typeof parsed.content === "string" ? parsed.content : "",
          frontMatter: parsed.frontMatter || {},
          status: parsed.status || "draft",
          createdAt: parsed.createdAt || new Date().toISOString(),
        });
        setDraft(restored);
        setTitle(restored.title);
        setContent(restored.content);
        if (restored.siteId) setActiveSiteId(restored.siteId);
      } catch (error) {
        console.error("Failed to restore local draft:", error);
      }
    })();
  }, []);

  useEffect(() => {
    if (!sitesQuery.data?.length || activeSiteId !== null) return;
    void (async () => {
      const storedSiteId = Number(
        await AsyncStorage.getItem(ACTIVE_SITE_STORAGE_KEY)
      );
      const selectedSite =
        sitesQuery.data?.find(site => site.id === storedSiteId) ||
        sitesQuery.data?.find(site => site.isFavorite) ||
        sitesQuery.data?.[0];
      if (selectedSite) setActiveSiteId(selectedSite.id);
    })();
  }, [activeSiteId, sitesQuery.data]);

  useEffect(() => {
    if (!unsavedChanges) return;
    const timeout = setTimeout(() => {
      void saveLocalDraft();
    }, 2000);
    return () => clearTimeout(timeout);
  }, [title, content, unsavedChanges]);

  const selectActiveSite = async (siteId: number) => {
    setActiveSiteId(siteId);
    await AsyncStorage.setItem(ACTIVE_SITE_STORAGE_KEY, String(siteId));
  };

  const buildRepositoryPublishPayload = (
    status: "draft" | "published"
  ): RepositoryPublishQueueData => {
    if (!title.trim()) throw new Error("Please enter a title");
    if (!activeSite) {
      throw new Error("Select a connected site before saving or publishing.");
    }

    const slug = slugify(title);
    const date = new Date().toISOString().slice(0, 10);
    const targetPath = joinSitePath(
      activeSite.rootPath,
      status === "published"
        ? `_posts/${date}-${slug}.md`
        : `_drafts/${slug}.md`
    );
    const frontMatter = {
      ...draft?.frontMatter,
      layout: draft?.frontMatter.layout || activeSite.defaultLayout || "post",
      title: title.trim(),
      date: draft?.frontMatter.date || new Date().toISOString(),
    };
    const branch = activeSite.selectedBranch || activeSite.defaultBranch || "main";
    return {
      kind: "repository-post",
      commit: {
        owner: activeSite.owner,
        repo: activeSite.repo,
        path: targetPath,
        branch,
        content: serializeJekyllPost(frontMatter, content),
        message:
          status === "published"
            ? `Publish ${title.trim()}`
            : `Save draft: ${title.trim()}`,
        sha: draft?.path === targetPath ? draft.sha : undefined,
      },
      post: {
        siteId: activeSite.id,
        path: targetPath,
        filename: targetPath.split("/").pop(),
        slug,
        title: title.trim(),
        status,
        frontMatter,
        markdown: content,
      },
      priorDraft:
        status === "published" &&
        draft?.serverId &&
        draft.path &&
        draft.path !== targetPath &&
        draft.sha
          ? { postId: draft.serverId, path: draft.path, sha: draft.sha }
          : undefined,
    };
  };

  const persistToServer = async (status: "draft" | "published") => {
    const payload = buildRepositoryPublishPayload(status);
    const commit = await commitFileMutation.mutateAsync(payload.commit);
    const sha = getCommittedSha(commit) || draft?.sha;
    const serverId = await upsertPostMutation.mutateAsync({
      ...payload.post,
      sha,
    });

    if (payload.priorDraft) {
      try {
        if (!payload.priorDraft.sha) {
          throw new Error("Prior draft SHA is unavailable for deletion.");
        }
        await deleteFileMutation.mutateAsync({
          owner: payload.commit.owner,
          repo: payload.commit.repo,
          path: payload.priorDraft.path,
          branch: payload.commit.branch,
          sha: payload.priorDraft.sha,
          message: `Remove draft after publishing ${payload.post.title}`,
        });
        await deletePostMutation.mutateAsync({ id: payload.priorDraft.postId });
      } catch (error) {
        console.warn("Published post but could not remove the prior draft:", error);
      }
    }

    return saveLocalDraft({
      serverId,
      siteId: payload.post.siteId,
      path: payload.post.path,
      sha,
      title: payload.post.title || title.trim(),
      content: payload.post.markdown || content,
      frontMatter: payload.post.frontMatter || {},
      status,
    });
  };

  const queueRepositoryPublish = async (status: "draft" | "published") => {
    await enqueueRepositoryPublish(buildRepositoryPublishPayload(status));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await persistToServer("draft");
      Alert.alert("Saved", "Draft saved to your GitHub repository.");
    } catch (error) {
      await saveLocalDraft();
      let queued = false;
      try {
        await queueRepositoryPublish("draft");
        queued = true;
      } catch (queueError) {
        console.warn("Could not queue the offline draft save:", queueError);
      }
      Alert.alert(
        queued ? "Saved locally and queued" : "Saved locally",
        error instanceof Error
          ? `${error.message} Your draft remains on this device${
              queued ? " and will retry when online." : "."
            }`
          : "Your draft remains on this device and can be retried."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    try {
      await persistToServer("published");
      await AsyncStorage.removeItem(DRAFT_STORAGE_KEY);
      setDraft(null);
      setTitle("");
      setContent("");
      Alert.alert("Published", "Post committed to your GitHub repository.");
    } catch (error) {
      await saveLocalDraft();
      let queued = false;
      try {
        await queueRepositoryPublish("published");
        queued = true;
      } catch (queueError) {
        console.warn("Could not queue the offline publish:", queueError);
      }
      Alert.alert(
        queued ? "Publish queued" : "Publish not completed",
        error instanceof Error
          ? `${error.message} Your draft was retained locally${
              queued ? " and publication will retry when online." : "."
            }`
          : "Your draft was retained locally so you can retry."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderEditor = () => {
    if (mode === "preview") {
      return (
        <ScrollView style={styles.editorContent}>
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>{title || "Untitled"}</Text>
            <Text style={styles.previewMeta}>
              {draft?.createdAt
                ? new Date(draft.createdAt).toLocaleDateString()
                : "Draft"}
            </Text>
            <View style={styles.previewDivider} />
            <Text style={styles.previewContent}>{content || "No content yet"}</Text>
          </View>
        </ScrollView>
      );
    }

    return (
      <ScrollView style={styles.editorContent}>
        <TextInput
          style={styles.titleInput}
          placeholder="Post Title"
          placeholderTextColor="#6b7280"
          value={title}
          onChangeText={value => {
            setTitle(value);
            setUnsavedChanges(true);
          }}
        />
        {mode === "markdown" && (
          <View style={styles.frontMatterContainer}>
            <Text style={styles.frontMatterLabel}>Generated Front Matter</Text>
            <Text style={styles.frontMatterText}>
              {JSON.stringify(draft?.frontMatter || {}, null, 2)}
            </Text>
          </View>
        )}
        <TextInput
          style={styles.contentInput}
          placeholder={
            mode === "markdown" ? "# Markdown content..." : "Start typing your post..."
          }
          placeholderTextColor="#6b7280"
          multiline
          value={content}
          onChangeText={value => {
            setContent(value);
            setUnsavedChanges(true);
          }}
        />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.tabContainer}>
        {(["visual", "markdown", "preview"] as EditorMode[]).map(value => (
          <TouchableOpacity
            key={value}
            style={[styles.tab, mode === value && styles.activeTab]}
            onPress={() => setMode(value)}
          >
            <Text style={[styles.tabText, mode === value && styles.activeTabText]}>
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.siteSelector}>
        <Text style={styles.siteLabel}>Publishing site</Text>
        {sitesQuery.isLoading ? (
          <ActivityIndicator size="small" color="#3b82f6" />
        ) : sitesQuery.data?.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {sitesQuery.data.map(site => (
              <TouchableOpacity
                key={site.id}
                style={[
                  styles.siteButton,
                  activeSiteId === site.id && styles.siteButtonActive,
                ]}
                onPress={() => void selectActiveSite(site.id)}
              >
                <Text
                  style={[
                    styles.siteButtonText,
                    activeSiteId === site.id && styles.siteButtonTextActive,
                  ]}
                >
                  {site.owner}/{site.repo}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.siteEmptyText}>
            Connect a repository in the web app before publishing from Android.
          </Text>
        )}
      </View>

      {renderEditor()}

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {unsavedChanges ? "Save Draft" : "Saved"}
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
            <Text style={styles.buttonText}>Publish</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
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
  activeTab: { borderBottomColor: "#3b82f6" },
  tabText: { color: "#6b7280", fontSize: 14, fontWeight: "500" },
  activeTabText: { color: "#3b82f6" },
  siteSelector: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  siteLabel: { color: "#9ca3af", fontSize: 12, fontWeight: "600", marginBottom: 8 },
  siteButton: {
    backgroundColor: "#1e293b",
    borderColor: "#475569",
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  siteButtonActive: { backgroundColor: "#1e3a5f", borderColor: "#3b82f6" },
  siteButtonText: { color: "#d1d5db", fontSize: 12 },
  siteButtonTextActive: { color: "#93c5fd", fontWeight: "600" },
  siteEmptyText: { color: "#fbbf24", fontSize: 12 },
  editorContent: { flex: 1, padding: 16 },
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
  frontMatterContainer: { marginBottom: 20 },
  frontMatterLabel: { color: "#9ca3af", fontSize: 12, marginBottom: 8, fontWeight: "600" },
  frontMatterText: {
    backgroundColor: "#1e293b",
    color: "#e5e7eb",
    padding: 12,
    borderRadius: 6,
    fontFamily: "monospace",
    fontSize: 12,
  },
  previewContainer: { backgroundColor: "#1e293b", padding: 16, borderRadius: 8 },
  previewTitle: { fontSize: 28, fontWeight: "bold", color: "#fff", marginBottom: 8 },
  previewMeta: { color: "#9ca3af", fontSize: 14, marginBottom: 16 },
  previewDivider: { height: 1, backgroundColor: "#334155", marginBottom: 16 },
  previewContent: { color: "#e5e7eb", fontSize: 16, lineHeight: 24 },
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
  saveButton: { backgroundColor: "#334155" },
  publishButton: { backgroundColor: "#3b82f6" },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
