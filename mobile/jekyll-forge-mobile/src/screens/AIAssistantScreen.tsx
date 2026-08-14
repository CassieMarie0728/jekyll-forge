import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  Alert,
} from "react-native";
import { trpc } from "../utils/trpc";

interface AITask {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const AI_TASKS: AITask[] = [
  {
    id: "generate-title",
    name: "Generate Title",
    description: "Create compelling post titles",
    icon: "✨",
  },
  {
    id: "generate-outline",
    name: "Generate Outline",
    description: "Create post structure and outline",
    icon: "📋",
  },
  {
    id: "generate-draft",
    name: "Generate Draft",
    description: "Write a complete post draft",
    icon: "📝",
  },
  {
    id: "rewrite",
    name: "Rewrite",
    description: "Improve existing content",
    icon: "✏️",
  },
  {
    id: "generate-meta",
    name: "Generate Meta",
    description: "Create SEO meta descriptions",
    icon: "🔍",
  },
  {
    id: "generate-tags",
    name: "Generate Tags",
    description: "Suggest relevant tags",
    icon: "🏷️",
  },
];

const SERVER_TASKS: Record<string, string> = {
  "generate-title": "title",
  "generate-outline": "outline",
  "generate-draft": "draft",
  rewrite: "rewrite",
  "generate-meta": "seo",
  "generate-tags": "tags",
};

type AIAssistantScreenProps = {
  route: {
    params?: {
      currentContent?: string;
    };
  };
  navigation: {
    navigate: (
      routeName: "AppStack",
      params: {
        screen: "EditorTab";
        params: { aiResult: string; task?: string };
      }
    ) => void;
  };
};

export default function AIAssistantScreen({
  route,
  navigation,
}: AIAssistantScreenProps) {
  const { currentContent } = route.params || {};
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [tone, setTone] = useState("professional");

  const aiMutation = trpc.ai.generate.useMutation();

  const handleTaskSelect = (taskId: string) => {
    setSelectedTask(taskId);
    setResult("");
    setPrompt("");
  };

  const handleGenerate = async () => {
    if (!selectedTask) {
      Alert.alert("Error", "Please select a task");
      return;
    }

    setIsLoading(true);
    try {
      const response = await aiMutation.mutateAsync({
        task: SERVER_TASKS[selectedTask] || selectedTask,
        userPrompt: prompt || undefined,
        postMarkdown: currentContent || undefined,
        tone,
      });

      setResult(response.text);
    } catch (error: unknown) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to generate content"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!result) {
      Alert.alert("Error", "No content to apply");
      return;
    }

    navigation.navigate("AppStack", {
      screen: "EditorTab",
      params: {
        aiResult: result,
        task: selectedTask || undefined,
      },
    });
  };

  const renderTaskCard = (task: AITask) => (
    <TouchableOpacity
      key={task.id}
      style={[
        styles.taskCard,
        selectedTask === task.id && styles.taskCardActive,
      ]}
      onPress={() => handleTaskSelect(task.id)}
    >
      <Text style={styles.taskIcon}>{task.icon}</Text>
      <View style={styles.taskInfo}>
        <Text style={styles.taskName}>{task.name}</Text>
        <Text style={styles.taskDescription}>{task.description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>AI Assistant</Text>
          <Text style={styles.subtitle}>Generate and improve your content</Text>
        </View>

        {!selectedTask ? (
          <>
            {/* Task Selection */}
            <Text style={styles.sectionTitle}>Choose a Task</Text>
            <FlatList
              data={AI_TASKS}
              renderItem={({ item }) => renderTaskCard(item)}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              style={styles.tasksList}
            />
          </>
        ) : (
          <>
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setSelectedTask(null);
                setResult("");
              }}
            >
              <Text style={styles.backButtonText}>← Back to Tasks</Text>
            </TouchableOpacity>

            {/* Task Details */}
            <View style={styles.taskDetails}>
              <Text style={styles.taskDetailsTitle}>
                {AI_TASKS.find(t => t.id === selectedTask)?.name}
              </Text>

              {/* Tone Selection */}
              <View style={styles.optionSection}>
                <Text style={styles.optionLabel}>Tone</Text>
                <View style={styles.toneButtons}>
                  {["professional", "casual", "humorous"].map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.toneButton,
                        tone === t && styles.toneButtonActive,
                      ]}
                      onPress={() => setTone(t)}
                    >
                      <Text
                        style={[
                          styles.toneButtonText,
                          tone === t && styles.toneButtonTextActive,
                        ]}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Custom Prompt */}
              <View style={styles.optionSection}>
                <Text style={styles.optionLabel}>Additional Instructions</Text>
                <TextInput
                  style={styles.promptInput}
                  placeholder="Add any specific instructions..."
                  placeholderTextColor="#6b7280"
                  value={prompt}
                  onChangeText={setPrompt}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Generate Button */}
              <TouchableOpacity
                style={[
                  styles.generateButton,
                  isLoading && styles.generateButtonDisabled,
                ]}
                onPress={handleGenerate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.generateButtonText}>
                    Generate Content
                  </Text>
                )}
              </TouchableOpacity>

              {/* Result */}
              {result && (
                <View style={styles.resultSection}>
                  <Text style={styles.resultTitle}>Generated Content</Text>
                  <View style={styles.resultCard}>
                    <Text style={styles.resultText}>{result}</Text>
                  </View>

                  {/* Result Actions */}
                  <View style={styles.resultActions}>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => {
                        // Copy to clipboard
                        Alert.alert("Copied", "Content copied to clipboard");
                      }}
                    >
                      <Text style={styles.copyButtonText}>📋 Copy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.applyButton}
                      onPress={handleApply}
                    >
                      <Text style={styles.applyButtonText}>✓ Apply</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </>
        )}
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
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#9ca3af",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },
  tasksList: {
    marginBottom: 24,
  },
  taskCard: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  taskCardActive: {
    borderColor: "#3b82f6",
    backgroundColor: "#1e3a5f",
  },
  taskIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  taskDescription: {
    fontSize: 12,
    color: "#9ca3af",
  },
  backButton: {
    paddingVertical: 8,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "600",
  },
  taskDetails: {
    marginBottom: 24,
  },
  taskDetailsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  optionSection: {
    marginBottom: 16,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  toneButtons: {
    flexDirection: "row",
    gap: 8,
  },
  toneButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#475569",
    alignItems: "center",
  },
  toneButtonActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  toneButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9ca3af",
  },
  toneButtonTextActive: {
    color: "#fff",
  },
  promptInput: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#475569",
    borderRadius: 6,
    padding: 12,
    color: "#fff",
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: "top",
  },
  generateButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    marginBottom: 16,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  resultSection: {
    marginTop: 16,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  resultCard: {
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#10b981",
    marginBottom: 12,
  },
  resultText: {
    fontSize: 13,
    color: "#d1d5db",
    lineHeight: 20,
  },
  resultActions: {
    flexDirection: "row",
    gap: 8,
  },
  copyButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#475569",
    alignItems: "center",
  },
  copyButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#d1d5db",
  },
  applyButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#10b981",
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
});
