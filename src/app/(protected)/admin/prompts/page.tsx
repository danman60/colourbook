'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Wand2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { getPromptSuggestions, createSuggestion, deleteSuggestion } from '@/lib/actions/prompt-suggestions';
import type { PromptSuggestion } from '@/types';
import { toast } from 'sonner';

const CATEGORIES = ['outdoor', 'holiday', 'fantasy', 'everyday', 'sports', 'animals', 'adventure'];

export default function AdminPromptsPage() {
  const [suggestions, setSuggestions] = useState<PromptSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [category, setCategory] = useState('outdoor');
  const [promptText, setPromptText] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await getPromptSuggestions();
    if (data) setSuggestions(data);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await createSuggestion({ category, prompt_text: promptText, sort_order: suggestions.length });
    if (error) { toast.error(error); return; }
    toast.success('Prompt added');
    setDialogOpen(false);
    setPromptText('');
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this prompt suggestion?')) return;
    await deleteSuggestion(id);
    toast.success('Deleted');
    load();
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const grouped = CATEGORIES.map(cat => ({
    category: cat,
    items: suggestions.filter(s => s.category === cat),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold">Prompt Suggestions</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="cursor-pointer gap-2"><Plus className="h-4 w-4" /> Add Prompt</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading">Add Prompt Suggestion</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background cursor-pointer">
                  {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Prompt Text</Label>
                <Input value={promptText} onChange={e => setPromptText(e.target.value)} placeholder="Use {{name}} for the family member's name" required />
                <p className="text-xs text-muted-foreground">Use {"{{name}}"} as a placeholder — it gets replaced with the selected family member&apos;s name</p>
              </div>
              <Button type="submit" className="w-full cursor-pointer">Add Prompt</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {suggestions.length === 0 ? (
        <div className="text-center py-16"><Wand2 className="h-8 w-8 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No prompt suggestions yet</p></div>
      ) : (
        <div className="space-y-6">
          {grouped.filter(g => g.items.length > 0).map(group => (
            <div key={group.category}>
              <h2 className="text-lg font-heading font-semibold capitalize mb-3">{group.category}</h2>
              <div className="space-y-2">
                {group.items.map(item => (
                  <Card key={item.id}>
                    <CardContent className="flex items-center justify-between pt-4 pb-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">{item.category}</Badge>
                        <span className="text-sm">{item.prompt_text}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-destructive" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
