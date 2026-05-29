'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wand2, Loader2, RefreshCw, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getFamilyMembers } from '@/lib/actions/family-members';
import { getRandomSuggestions } from '@/lib/actions/prompt-suggestions';
import { generatePage } from '@/lib/actions/pages';
import { getProfile } from '@/lib/actions/profiles';
import type { FamilyMember, PromptSuggestion } from '@/types';
import { toast } from 'sonner';

export default function GeneratePage() {
  const router = useRouter();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [suggestions, setSuggestions] = useState<PromptSuggestion[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>('none');
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    async function load() {
      const [membersResult, suggestionsResult, profileResult] = await Promise.all([
        getFamilyMembers(),
        getRandomSuggestions(6),
        getProfile(),
      ]);
      if (membersResult.data) setMembers(membersResult.data);
      if (suggestionsResult.data) setSuggestions(suggestionsResult.data);
      if (profileResult.data) setCredits(profileResult.data.generation_credits);
      setLoading(false);
    }
    load();
  }, []);

  async function refreshSuggestions() {
    setRefreshing(true);
    const { data } = await getRandomSuggestions(6);
    if (data) setSuggestions(data);
    setRefreshing(false);
  }

  function applySuggestion(suggestion: PromptSuggestion) {
    const member = members.find(m => m.id === selectedMember);
    const name = member ? member.name : 'Someone';
    setPrompt(suggestion.prompt_text.replace('{{name}}', name));
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;

    setGenerating(true);
    const { data, error } = await generatePage({
      prompt: prompt.trim(),
      family_member_id: selectedMember !== 'none' ? selectedMember : null,
      original_image_url: null,
    });

    if (error) {
      toast.error(error);
      setGenerating(false);
      return;
    }

    // Trigger generation from the browser so the request carries the session
    // cookie (a server-side fetch from the action would be unauthenticated → 401).
    // The fetch survives the client-side navigation below; the gallery detail
    // page auto-refreshes until the image is ready.
    fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId: data!.id }),
    }).catch(() => {});

    toast.success('Coloring page is being generated! Check your gallery.');
    setCredits(prev => prev - 1);
    router.push(`/gallery/${data!.id}`);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading generator...</p>
      </div>
    );
  }

  const memberName = selectedMember !== 'none'
    ? members.find(m => m.id === selectedMember)?.name || '...'
    : '...';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-heading font-bold">Generate Coloring Page</h1>
        <p className="text-muted-foreground mt-1">
          Describe a scene and we&apos;ll create a beautiful coloring page
        </p>
      </div>

      {/* Credits banner */}
      <div className={`animate-fade-in-up stagger-1 rounded-2xl p-4 flex items-center gap-3 ${credits > 5 ? 'bg-accent/5 border border-accent/20' : credits > 0 ? 'bg-secondary/5 border border-secondary/20' : 'bg-destructive/5 border border-destructive/20'}`}>
        <div className={`rounded-xl p-2 ${credits > 5 ? 'bg-accent/10' : credits > 0 ? 'bg-secondary/10' : 'bg-destructive/10'}`}>
          <Sparkles className={`h-5 w-5 ${credits > 5 ? 'text-accent' : credits > 0 ? 'text-secondary' : 'text-destructive'}`} />
        </div>
        <div>
          <p className="font-medium text-sm">
            {credits > 0
              ? `${credits} generation credit${credits !== 1 ? 's' : ''} remaining`
              : 'No credits remaining'}
          </p>
          <p className="text-xs text-muted-foreground">
            {credits > 0 ? 'Each generation uses 1 credit' : 'Order a printed book to support us!'}
          </p>
        </div>
      </div>

      <Card className="animate-fade-in-up stagger-2 shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={handleGenerate} className="space-y-6">
            {/* Family Member Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Family Member (optional)
              </Label>
              <Select value={selectedMember} onValueChange={(val) => setSelectedMember(val ?? 'none')}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Select a family member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="cursor-pointer">No specific person</SelectItem>
                  {members.map(m => (
                    <SelectItem key={m.id} value={m.id} className="cursor-pointer">
                      {m.name} ({m.relationship})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {members.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  <a href="/family" className="text-primary hover:underline">Upload family photos</a> to personalize your coloring pages
                </p>
              )}
            </div>

            {/* Prompt */}
            <div className="space-y-2">
              <Label htmlFor="prompt" className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-muted-foreground" />
                Describe the scene
              </Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="e.g. riding a bicycle through a sunny park with butterflies"
                rows={3}
                required
                className="resize-none"
              />
            </div>

            {/* Suggestions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">Suggested Prompts</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={refreshSuggestions}
                  className="cursor-pointer gap-1 text-xs"
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map(s => (
                  <Badge
                    key={s.id}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:shadow-sm"
                    onClick={() => applySuggestion(s)}
                  >
                    {s.prompt_text.replace('{{name}}', memberName)}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full cursor-pointer gap-2 h-12 text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 transition-all duration-300"
              disabled={generating || credits <= 0 || !prompt.trim()}
            >
              {generating ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Generating your page...</>
              ) : (
                <><Wand2 className="h-5 w-5" /> Generate Coloring Page</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
