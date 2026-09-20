import { WRITING_TONES, toneLabel } from "@shared/writingTones";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  CheckCircle2,
  ExternalLink,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
  TriangleAlert,
  Wand2,
  Zap,
} from "lucide-react";

type ProviderId = "openrouter" | "gemini" | "groq" | "mistral";

const PROVIDER_ORDER: ProviderId[] = [
  "openrouter",
  "gemini",
  "groq",
  "mistral",
];

export default function AISettings() {
  const { siteId } = useParams<{ siteId: string }>();
  const utils = trpc.useUtils();
  const [tone, setTone] = useState("professional");
  const [language, setLanguage] = useState("en");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [testPrompt, setTestPrompt] = useState(
    "Write a one-sentence blog post introduction about Jekyll."
  );
  const [testResult, setTestResult] = useState("");
  const [selectedProvider, setSelectedProvider] =
    useState<ProviderId>("openrouter");
  const [selectedModel, setSelectedModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [acknowledgeFreeTier, setAcknowledgeFreeTier] = useState(false);

  const { data: providerSettings, isLoading: providersLoading } =
    trpc.aiProviders.getSettings.useQuery();
  const { data: aiSettings } = trpc.ai.getSettings.useQuery();
  const providerSelectionInitialized = useRef(false);
  useEffect(() => {
    if (!providerSettings || providerSelectionInitialized.current) return;
    providerSelectionInitialized.current = true;
    setSelectedProvider(
      (providerSettings.find(item => item.enabled)?.provider as ProviderId) ||
        "openrouter"
    );
  }, [providerSettings]);

  useEffect(() => {
    if (!aiSettings) return;
    setTone(aiSettings.defaultTone || "professional");
    setLanguage(aiSettings.defaultLanguage || "en");
    setSystemPrompt(aiSettings.systemPrompt || "");
  }, [aiSettings]);

  const selectedProviderDetails = useMemo(
    () => providerSettings?.find(item => item.provider === selectedProvider),
    [providerSettings, selectedProvider]
  );

  useEffect(() => {
    const firstModel = selectedProviderDetails?.models[0]?.id || "";
    if (
      selectedProviderDetails &&
      !selectedProviderDetails.models.some(model => model.id === selectedModel)
    ) {
      setSelectedModel(selectedProviderDetails.selectedModel || firstModel);
    }
  }, [selectedModel, selectedProviderDetails]);

  const saveProvider = trpc.aiProviders.save.useMutation({
    onSuccess: async result => {
      setApiKey("");
      setAcknowledgeFreeTier(false);
      await utils.aiProviders.getSettings.invalidate();
      toast.success(
        `${result.provider} is configured as your active AI provider.`
      );
    },
    onError: error => toast.error(error.message),
  });

  const testProvider = trpc.aiProviders.test.useMutation({
    onSuccess: () => toast.success("The provider key was accepted."),
    onError: error => toast.error(error.message),
  });

  const activateProvider = trpc.aiProviders.activate.useMutation({
    onSuccess: async () => {
      await utils.aiProviders.getSettings.invalidate();
      toast.success("Active provider changed.");
    },
    onError: error => toast.error(error.message),
  });

  const removeProvider = trpc.aiProviders.remove.useMutation({
    onSuccess: async () => {
      await utils.aiProviders.getSettings.invalidate();
      toast.success("Provider key removed.");
    },
    onError: error => toast.error(error.message),
  });

  const updateAiSettings = trpc.ai.updateSettings.useMutation({
    onSuccess: async () => {
      await utils.ai.getSettings.invalidate();
      toast.success("Default AI behavior saved.");
    },
    onError: error => toast.error(error.message),
  });

  const testGeneration = trpc.ai.generate.useMutation({
    onSuccess: data => setTestResult(data.text),
    onError: error => toast.error(error.message),
  });

  const saveDefaultBehavior = () => {
    updateAiSettings.mutate({
      enabled: true,
      temperature: 70,
      systemPrompt,
      defaultLanguage: language,
      defaultTone: tone as (typeof WRITING_TONES)[number],
    });
  };

  const handleTestKey = () => {
    if (!selectedProviderDetails?.available || !apiKey || !selectedModel)
      return;
    testProvider.mutate({
      provider: selectedProvider,
      model: selectedModel,
      apiKey,
    });
  };

  const handleSaveProvider = () => {
    if (!selectedProviderDetails?.available || !apiKey || !selectedModel)
      return;
    saveProvider.mutate({
      provider: selectedProvider,
      model: selectedModel,
      apiKey,
      acknowledgeFreeTier: true,
    });
  };

  const handleGenerationTest = () => {
    setTestResult("");
    testGeneration.mutate({
      task: "draft",
      userPrompt: testPrompt,
      postMarkdown: "",
      frontMatter: {},
      tone,
    });
  };

  const activeProvider = providerSettings?.find(item => item.enabled);

  // prettier-ignore
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-forge-violet" />
            AI Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Bring your own provider key. Free options are available; paid AI is never required. Mistral is an optional choice with billing controlled by your provider account.
          </p>
        </div>
        {activeProvider ? (
          <Badge variant="secondary" className="w-fit gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-forge-emerald" />
            Active: {activeProvider.label}
          </Badge>
        ) : (
          <Badge variant="outline" className="w-fit gap-1.5">
            <TriangleAlert className="w-3.5 h-3.5 text-forge-amber" />
            Provider setup required
          </Badge>
        )}
      </header>

      <Card className="border-forge-violet/30 bg-forge-violet/5">
        <CardContent className="pt-5 flex gap-3">
          <ShieldCheck className="w-5 h-5 text-forge-violet shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Your key stays server-side.</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Keys are encrypted before they are stored and are never returned to this browser or the Android app. The server enforces the provider model allowlist and conservative per-provider limits before every AI request.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-forge-violet" />
            AI Provider Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {providersLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading provider policy…
            </div>
          ) : (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                {PROVIDER_ORDER.map(providerId => {
                  const provider = providerSettings?.find(item => item.provider === providerId);
                  if (!provider) return null;
                  const active = provider.enabled;
                  return (
                    <button
                      key={provider.provider}
                      type="button"
                      onClick={() => {
                        providerSelectionInitialized.current = true;
                        setSelectedProvider(provider.provider as ProviderId);
                        setApiKey("");
                        setAcknowledgeFreeTier(false);
                      }}
                      className={`rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        selectedProvider === provider.provider
                          ? "border-forge-violet bg-forge-violet/10"
                          : "border-border hover:border-forge-violet/40"
                      } ${!provider.available ? "opacity-65" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{provider.label}</span>
                        {active ? (
                          <Badge className="text-[10px]">Active</Badge>
                        ) : provider.configured ? (
                          <Badge variant="secondary" className="text-[10px]">Saved</Badge>
                        ) : !provider.available ? (
                          <Badge variant="outline" className="text-[10px]">Unavailable</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">Not configured</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                        {provider.disclosure}
                      </p>
                    </button>
                  );
                })}
              </div>

              {selectedProviderDetails && (
                <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{selectedProviderDetails.label}</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                        {selectedProviderDetails.disclosure}
                      </p>
                    </div>
                    <a
                      href={selectedProviderDetails.setupUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Create or manage key <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {!selectedProviderDetails.available ? (
                    <div className="rounded-md border border-forge-amber/30 bg-forge-amber/10 p-3 text-xs text-muted-foreground leading-relaxed">
                      This provider is currently unavailable.
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="ai-model">Model</Label>
                          <Select value={selectedModel} onValueChange={setSelectedModel}>
                            <SelectTrigger id="ai-model">
                              <SelectValue placeholder="Choose a model" />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedProviderDetails.models.map(model => (
                                <SelectItem key={model.id} value={model.id}>
                                  {model.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="rounded-md bg-background border border-border px-3 py-2.5 text-xs text-muted-foreground">
                          <p className="font-medium text-foreground">Jekyll Forge safeguard</p>
                          <p className="mt-1">
                            {selectedProviderDetails.rateLimit
                              ? `${selectedProviderDetails.rateLimit.requestsPerMinute} requests/minute and ${selectedProviderDetails.rateLimit.requestsPerDay} requests/day per user.`
                              : "No requests allowed."}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="ai-provider-key">API key</Label>
                        <div className="relative">
                          <Input
                            id="ai-provider-key"
                            type="password"
                            value={apiKey}
                            onChange={event => setApiKey(event.target.value)}
                            autoComplete="off"
                            placeholder="Paste a user-owned provider key"
                            className="pr-10"
                          />
                          <EyeOff className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Saved keys are masked and cannot be viewed or recovered later. Re-saving replaces the existing key.
                        </p>
                      </div>

                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <Checkbox
                          checked={acknowledgeFreeTier}
                          onCheckedChange={checked => setAcknowledgeFreeTier(checked === true)}
                          className="mt-0.5"
                        />
                        <span className="text-xs text-muted-foreground leading-relaxed">
                          I understand that usage follows my provider account’s plan and billing settings. I can use a free plan; enabling paid billing is my choice. Forge limits requests and never switches to another provider automatically.
                        </span>
                      </label>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          onClick={handleTestKey}
                          disabled={!apiKey || !selectedModel || testProvider.isPending}
                        >
                          {testProvider.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                          Test key
                        </Button>
                        <Button
                          onClick={handleSaveProvider}
                          disabled={!apiKey || !selectedModel || !acknowledgeFreeTier || saveProvider.isPending}
                        >
                          {saveProvider.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                          Encrypt &amp; save provider
                        </Button>
                        {selectedProviderDetails.configured && !selectedProviderDetails.enabled && (
                          <Button
                            variant="secondary"
                            onClick={() => activateProvider.mutate({ provider: selectedProvider })}
                            disabled={activateProvider.isPending}
                          >
                            Make active
                          </Button>
                        )}
                        {selectedProviderDetails.configured && (
                          <Button
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeProvider.mutate({ provider: selectedProvider })}
                            disabled={removeProvider.isPending}
                          >
                            Remove key
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-forge-violet" />
            Default Writing Behavior
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="default-tone">Default writing tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger id="default-tone"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WRITING_TONES.map(item => (
                    <SelectItem key={item} value={item} >{toneLabel(item)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Content language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[{ value: "en", label: "English" }, { value: "es", label: "Spanish" }, { value: "fr", label: "French" }, { value: "de", label: "German" }, { value: "pt", label: "Portuguese" }, { value: "ja", label: "Japanese" }].map(item => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ai-system-prompt">System prompt (optional)</Label>
            <Textarea
              id="ai-system-prompt"
              value={systemPrompt}
              onChange={event => setSystemPrompt(event.target.value)}
              placeholder="Additional context for every AI request, such as your blog's audience and writing style."
              className="min-h-[92px] resize-y"
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label>Auto-snapshot before AI rewrites</Label>
              <p className="text-xs text-muted-foreground mt-1">Creates a safety snapshot before a rewrite operation.</p>
            </div>
            <Badge variant="secondary">Always on</Badge>
          </div>
          <Button variant="outline" onClick={saveDefaultBehavior} disabled={updateAiSettings.isPending}>
            Save writing behavior
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-forge-amber" />
            Test Active Provider
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={testPrompt}
            onChange={event => setTestPrompt(event.target.value)}
            className="min-h-[64px] resize-y"
            aria-label="Test prompt"
          />
          <Button onClick={handleGenerationTest} disabled={!activeProvider || testGeneration.isPending} className="gap-2">
            {testGeneration.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Run provider test
          </Button>
          {!activeProvider && <p className="text-xs text-forge-amber">Save and activate an approved provider key before running a test.</p>}
          {testResult && (
            <div className="rounded-lg border border-forge-emerald/30 bg-forge-emerald/5 p-3 text-sm whitespace-pre-wrap">
              {testResult}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />
      <p className="text-xs text-muted-foreground">
        Site context: {siteId ? `workspace ${siteId}` : "no workspace selected"}. Provider availability and free-tier limits may change at the providers; Jekyll Forge deliberately fails closed when a model is not approved.
      </p>
    </div>
  );
}
