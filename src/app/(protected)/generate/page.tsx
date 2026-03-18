'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wand2, Loader2, RefreshCw, Sparkles } from 'lucide-react';
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
    const { data } = await getRandomSuggestions(6);
    if (data) setSuggestions(data);
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

    toast.success('Coloring page is being generated! Check your gallery.');
    setCredits(prev => prev - 1);
    router.push(`/gallery/${data!.id}`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold">Generate Coloring Page</h1>
        <p className="text-muted-foreground mt-1">
          Describe a scene and we&apos;ll create a beautiful coloring page
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleGenerate} className="space-y-6">
            {/* Family Member Selection */}
            <div className="space-y-2">
              <Label>Family Member (optional)</Label>
              <Select value={selectedMember} onValueChange={(v: string | null) => v !== null && setSelectedMember(v)}>
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
              <Label htmlFor="prompt">Describe the scene</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="e.g. riding a bicycle through a sunny park with butterflies"
                rows={3}
                required
              />
            </div>

            {/* Suggestions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Suggested Prompts</Label>
                <Button type="button" variant="ghost" size="sm" onClick={refreshSuggestions} className="cursor-pointer gap-1 text-xs">
                  <RefreshCw className="h-3 w-3" /> Refresh
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map(s => (
                  <Badge
                    key={s.id}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => applySuggestion(s)}
                  >
                    {s.prompt_text.replace('{{name}}', selectedMember !== 'none' ? members.find(m => m.id === selectedMember)?.name || '...' : '...')}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Credits & Submit */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                {credits} credit{credits !== 1 ? 's' : ''} remaining
              </div>
              <Button type="submit" className="cursor-pointer gap-2" disabled={generating || credits <= 0 || !prompt.trim()}>
                {generating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                  <><Wand2 className="h-4 w-4" /> Generate Page</>
                )}
              </Button>
            </div>

            {credits <= 0 && (
              <p className="text-sm text-destructive text-center">
                No credits remaining. Order a printed book to support us!
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
