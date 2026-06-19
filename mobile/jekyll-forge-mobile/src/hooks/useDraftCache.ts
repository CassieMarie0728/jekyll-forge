import { useEffect, useRef, useState } from "react";
import { offlineStorage } from "../services/offlineStorage";

interface DraftCacheOptions {
  autoSaveInterval?: number; // milliseconds
  onSave?: (draft: any) => void;
  onError?: (error: Error) => void;
}

export function useDraftCache(
  postId: string,
  initialContent: any,
  options: DraftCacheOptions = {}
) {
  const { autoSaveInterval = 2000, onSave, onError } = options;

  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const contentRef = useRef(content);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Update ref when content changes
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Auto-save with debounce
  useEffect(() => {
    if (!content) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setHasUnsavedChanges(true);

    // Set new timeout
    saveTimeoutRef.current = setTimeout(async () => {
      await saveDraft();
    }, autoSaveInterval);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, autoSaveInterval]);

  const saveDraft = async () => {
    if (!contentRef.current) return;

    setIsSaving(true);
    try {
      const draft = {
        id: postId,
        siteId: "", // Would be passed in real app
        title: contentRef.current.title || "Untitled",
        content: contentRef.current.content || "",
        frontMatter: contentRef.current.frontMatter || {},
        lastModified: Date.now(),
        status: "draft" as const,
      };

      await offlineStorage.saveDraft(draft);
      setLastSaved(Date.now());
      setHasUnsavedChanges(false);

      onSave?.(draft);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("Failed to save draft:", err);
      onError?.(err);
    } finally {
      setIsSaving(false);
    }
  };

  const loadDraft = async () => {
    try {
      const draft = await offlineStorage.getDraft(postId);
      if (draft) {
        setContent({
          title: draft.title,
          content: draft.content,
          frontMatter: draft.frontMatter,
        });
        setLastSaved(draft.lastModified);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("Failed to load draft:", err);
      onError?.(err);
    }
  };

  const clearDraft = async () => {
    try {
      await offlineStorage.deleteDraft(postId);
      setLastSaved(null);
      setHasUnsavedChanges(false);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("Failed to clear draft:", err);
      onError?.(err);
    }
  };

  const forceSave = async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await saveDraft();
  };

  return {
    content,
    setContent,
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    saveDraft: forceSave,
    loadDraft,
    clearDraft,
  };
}
