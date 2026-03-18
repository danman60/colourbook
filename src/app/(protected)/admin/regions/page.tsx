'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { getRegions, createRegion, updateRegion } from '@/lib/actions/regions';
import type { Region } from '@/types';
import { toast } from 'sonner';

export default function AdminRegionsPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [province, setProvince] = useState('');
  const [country, setCountry] = useState('CA');

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await getRegions(false);
    if (data) setRegions(data);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await createRegion({ name, province: province || null, country });
    if (error) { toast.error(error); return; }
    toast.success('Region created');
    setDialogOpen(false);
    setName('');
    setProvince('');
    load();
  }

  async function toggleActive(id: string, currentActive: boolean) {
    await updateRegion(id, { is_active: !currentActive });
    load();
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold">Regions</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="cursor-pointer gap-2"><Plus className="h-4 w-4" /> Add Region</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading">Add Region</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Southern Ontario" required /></div>
              <div className="space-y-2"><Label>Province (optional)</Label><Input value={province} onChange={e => setProvince(e.target.value)} placeholder="e.g. ON" /></div>
              <div className="space-y-2"><Label>Country</Label><Input value={country} onChange={e => setCountry(e.target.value)} placeholder="CA" required /></div>
              <Button type="submit" className="w-full cursor-pointer">Create Region</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {regions.length === 0 ? (
        <div className="text-center py-16"><MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No regions configured</p></div>
      ) : (
        <div className="space-y-3">
          {regions.map(region => (
            <Card key={region.id}>
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-heading font-semibold">{region.name}</p>
                    <Badge variant={region.is_active ? 'default' : 'secondary'}>{region.is_active ? 'Active' : 'Inactive'}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{region.province || ''} {region.country}</p>
                </div>
                <Switch checked={region.is_active} onCheckedChange={() => toggleActive(region.id, region.is_active)} className="cursor-pointer" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
