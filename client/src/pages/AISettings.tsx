import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Wand2, Sparkles, Shield, Zap, Info, CheckCircle2 } from "lucide-react";
import { trpc as trpcClient } from "@/lib/trpc";

export default function AISettings() {
  const { siteId } = useParams<{ siteId: string }>();
  const [tone, setTone] = useState("professional");
  const [language, setLanguage] = useState("en");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [autoSnapshot, setAutoSnapshot] = useState(true);
  const [testPrompt, setTestPrompt] = useState("Write a one-sentence blog post introduction about Jekyll.");
  const [testResult, setTestResult] = useState("");
  const [testing, setTesting] = useState(false);

  const testMutation = trpcClient.ai.generate.useMutation({
    onSuccess: (data) => { setTestResult(typeof data.text === "string" ? data.text : String(data.text ?? "")); setTesting(false); },
    onError: (err) => { toast.error(err.message); setTesting(false); },
  });

  const handleTest = () => {
    setTesting(true);
    setTestResult("");
    testMutation.mutate({
      task: "draft",
      userPrompt: testPrompt,
      postMarkdown: "",
      frontMatter: {},
      tone,
    });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl flex items-center gap-2">
          <Wand2 className="w-6 h-6 text-forge-violet" />
          AI Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure the AI writing assistant behavior</p>
      </div>

      {/* Security Notice */}
      <Card className="bg-forge-violet/5 border-forge-violet/20 mb-6">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-forge-violet flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-forge-violet">Server-Side AI Processing</p>
              <p className="text-xs text-muted-foreground mt-1">
                All AI requests are processed server-side through the platform's LLM integration layer.
                No API keys are exposed to the browser. Your content is sent securely to the AI model
                and results are returned directly to the editor.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Default Settings */}
      <Card className="bg-card border-border mb-4">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-forge-violet" />
            Default Behavior
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs mb-1.5 block">Default Writing Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["professional", "casual", "technical", "friendly", "formal", "conversational", "humorous", "academic"].map(t => (
                  <SelectItem key={t} value={t} className="text-sm capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">Content Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  { value: "en", label: "English" },
                  { value: "es", label: "Spanish" },
                  { value: "fr", label: "French" },
                  { value: "de", label: "German" },
                  { value: "pt", label: "Portuguese" },
                  { value: "ja", label: "Japanese" },
                  { value: "zh", label: "Chinese" },
                ].map(({ value, label }) => (
                  <SelectItem key={value} value={value} className="text-sm">{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">System Prompt (optional)</Label>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Additional context for the AI, e.g., 'This blog focuses on web development tutorials for beginners. Always include code examples.'"
              className="text-sm min-h-[80px] resize-none"
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">This context is prepended to every AI request for this site.</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Auto-snapshot before AI rewrites</Label>
              <p className="text-xs text-muted-foreground">Creates a named snapshot before any AI rewrite operation</p>
            </div>
            <Switch checked={autoSnapshot} onCheckedChange={setAutoSnapshot} />
          </div>
        </CardContent>
      </Card>

      {/* Test AI */}
      <Card className="bg-card border-border mb-4">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-forge-amber" />
            Test AI Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs mb-1.5 block">Test Prompt</Label>
            <Textarea
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              className="text-sm min-h-[60px] resize-none"
              rows={2}
            />
          </div>
          <Button onClick={handleTest} disabled={testing} className="gap-2 w-full">
            {testing ? (
              <><div className="animate-spin w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full" />Testing...</>
            ) : (
              <><Sparkles className="w-4 h-4" />Run Test</>
            )}
          </Button>
          {testResult && (
            <div className="bg-muted/30 rounded-lg p-3 text-sm">
              <div className="flex items-center gap-2 mb-2 text-forge-emerald">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">AI responded successfully</span>
              </div>
              <p className="text-sm">{testResult}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Tasks */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            Available AI Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {[
              "Generate Titles", "Write Outline", "Write Draft", "Continue Writing",
              "Rewrite & Improve", "Make Shorter", "Make Longer", "Fix Grammar",
              "Generate SEO Meta", "Generate Tags", "Write Excerpt", "Generate Slug",
              "Summarize Post", "Social Media Posts", "Generate FAQ", "Table of Contents",
              "Clean Markdown", "Internal Link Suggestions", "Add Callout", "Alt Text for Images",
            ].map(task => (
              <div key={task} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="w-3 h-3 text-forge-emerald flex-shrink-0" />
                {task}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
