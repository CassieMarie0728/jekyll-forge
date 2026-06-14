import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { trpc } from '../utils/trpc';

interface PublishOptions {
  title: string;
  content: string;
  tags: string[];
  categories: string[];
  isDraft: boolean;
  scheduledDate?: string;
  commitMessage: string;
}

export default function PublishScreen({ route, navigation }: any) {
  const { postId, siteId, post } = route.params || {};
  const [isLoading, setIsLoading] = useState(false);
  const [isDraft, setIsDraft] = useState(true);
  const [commitMessage, setCommitMessage] = useState('Update post');
  const [scheduledDate, setScheduledDate] = useState<string | null>(null);

  const publishMutation = trpc.posts.publish.useMutation();
  const saveDraftMutation = trpc.posts.saveDraft.useMutation();

  const handlePublish = async () => {
    if (!post?.title?.trim()) {
      Alert.alert('Error', 'Please add a title to your post');
      return;
    }

    Alert.alert(
      'Publish Post',
      `Are you sure you want to ${isDraft ? 'save as draft' : 'publish'} this post?`,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: isDraft ? 'Save Draft' : 'Publish',
          onPress: async () => {
            setIsLoading(true);
            try {
              if (isDraft) {
                await saveDraftMutation.mutateAsync({
                  postId,
                  siteId,
                  content: post.content,
                  title: post.title,
                  frontMatter: post.frontMatter,
                });
                Alert.alert('Success', 'Post saved as draft');
              } else {
                await publishMutation.mutateAsync({
                  postId,
                  siteId,
                  content: post.content,
                  title: post.title,
                  frontMatter: post.frontMatter,
                  commitMessage,
                  scheduledDate,
                });
                Alert.alert('Success', 'Post published successfully');
              }
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to publish post');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Publish Post</Text>
          <Text style={styles.subtitle}>{post?.title || 'Untitled'}</Text>
        </View>

        {/* Post Preview */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>{post?.title || 'Untitled Post'}</Text>
            <Text style={styles.previewExcerpt} numberOfLines={3}>
              {post?.content?.substring(0, 150) || 'No content'}...
            </Text>
            <View style={styles.previewMeta}>
              <Text style={styles.previewMetaText}>
                {post?.content?.split(' ').length || 0} words
              </Text>
              <Text style={styles.previewMetaText}>
                ~{Math.ceil((post?.content?.split(' ').length || 0) / 200)} min read
              </Text>
            </View>
          </View>
        </View>

        {/* Publish Options */}
        <View style={styles.optionsSection}>
          <Text style={styles.sectionTitle}>Publish Options</Text>

          {/* Draft vs Publish Toggle */}
          <View style={styles.optionCard}>
            <View style={styles.optionHeader}>
              <Text style={styles.optionLabel}>Save as Draft</Text>
              <Switch
                value={isDraft}
                onValueChange={setIsDraft}
                trackColor={{ false: '#475569', true: '#3b82f6' }}
                thumbColor={isDraft ? '#60a5fa' : '#9ca3af'}
              />
            </View>
            <Text style={styles.optionDescription}>
              {isDraft
                ? 'Post will be saved as draft and not visible to readers'
                : 'Post will be published immediately and visible to all readers'}
            </Text>
          </View>

          {/* Commit Message */}
          <View style={styles.optionCard}>
            <Text style={styles.optionLabel}>Commit Message</Text>
            <View style={styles.input}>
              <Text style={styles.inputText}>{commitMessage}</Text>
            </View>
            <Text style={styles.optionDescription}>
              This message will be used in your GitHub commit
            </Text>
          </View>

          {/* Scheduled Date */}
          {!isDraft && (
            <View style={styles.optionCard}>
              <Text style={styles.optionLabel}>Schedule (Optional)</Text>
              <View style={styles.input}>
                <Text style={styles.inputText}>
                  {scheduledDate ? new Date(scheduledDate).toLocaleString() : 'Publish immediately'}
                </Text>
              </View>
              <Text style={styles.optionDescription}>
                Leave empty to publish immediately
              </Text>
            </View>
          )}
        </View>

        {/* Validation Checklist */}
        <View style={styles.checklistSection}>
          <Text style={styles.sectionTitle}>Pre-Publish Checklist</Text>
          <View style={styles.checklistCard}>
            <ChecklistItem
              icon={post?.title?.trim() ? '✓' : '○'}
              label="Title added"
              completed={!!post?.title?.trim()}
            />
            <ChecklistItem
              icon={post?.content?.trim() ? '✓' : '○'}
              label="Content added"
              completed={!!post?.content?.trim()}
            />
            <ChecklistItem
              icon={post?.frontMatter?.date ? '✓' : '○'}
              label="Date set"
              completed={!!post?.frontMatter?.date}
            />
            <ChecklistItem
              icon={post?.frontMatter?.layout ? '✓' : '○'}
              label="Layout selected"
              completed={!!post?.frontMatter?.layout}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.publishButton, isLoading && styles.publishButtonDisabled]}
            onPress={handlePublish}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.publishButtonText}>
                {isDraft ? 'Save Draft' : 'Publish'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ChecklistItem({
  icon,
  label,
  completed,
}: {
  icon: string;
  label: string;
  completed: boolean;
}) {
  return (
    <View style={styles.checklistItem}>
      <Text style={[styles.checklistIcon, completed && styles.checklistIconCompleted]}>
        {icon}
      </Text>
      <Text style={[styles.checklistLabel, completed && styles.checklistLabelCompleted]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  previewSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  previewExcerpt: {
    fontSize: 13,
    color: '#d1d5db',
    lineHeight: 20,
    marginBottom: 12,
  },
  previewMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  previewMetaText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  optionsSection: {
    marginBottom: 24,
  },
  optionCard: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  optionDescription: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
  },
  input: {
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  inputText: {
    fontSize: 13,
    color: '#d1d5db',
  },
  checklistSection: {
    marginBottom: 24,
  },
  checklistCard: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checklistIcon: {
    fontSize: 18,
    color: '#9ca3af',
    marginRight: 12,
    width: 24,
  },
  checklistIconCompleted: {
    color: '#10b981',
  },
  checklistLabel: {
    fontSize: 13,
    color: '#9ca3af',
  },
  checklistLabelCompleted: {
    color: '#10b981',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d1d5db',
  },
  publishButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  publishButtonDisabled: {
    opacity: 0.6,
  },
  publishButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
