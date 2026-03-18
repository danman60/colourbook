'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { getPrintPartners, createPrintPartner, updatePrintPartner } from '@/lib/actions/print-partners';
import { getRegions } from '@/lib/actions/regions';
import { formatCurrency } from '@/lib/utils';
import type { PrintPartner, Region } from '@/types';
import { toast } from 'sonner';

export default function AdminPrintPartnersPage() {
  const [partners, setPartners] = useState<PrintPartner[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [regionId, setRegionId] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('ON');
  const [postalCode, setPostalCode] = useState('');
  const [priceCents, setPriceCents] = useState('2999');
  const [extraPageCents, setExtraPageCents] = useState('100');
  const [shippingCents, setShippingCents] = useState('999');
  const [turnaroundDays, setTurnaroundDays] = useState('7');

  useEffect(() => { load(); }, []);

  async function load() {
    const [partnersRes, regionsRes] = await Promise.all([
      getPrintPartners(false),
      getRegions(false),
    ]);
    if (partnersRes.data) setPartners(partnersRes.data);
    if (regionsRes.data) setRegions(regionsRes.data);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await createPrintPartner({
      name, contact_email: email, contact_phone: null, website_url: null,
      region_id: regionId, address, city, province, postal_code: postalCode,
      is_active: true,
      price_per_book_cents: parseInt(priceCents),
      price_per_extra_page_cents: parseInt(extraPageCents),
      shipping_flat_rate_cents: parseInt(shippingCents),
      turnaround_days: parseInt(turnaroundDays),
    });
    if (error) { toast.error(error); return; }
    toast.success('Partner created');
    setDialogOpen(false);
    load();
  }

  async function toggleActive(id: string, currentActive: boolean) {
    await updatePrintPartner(id, { is_active: !currentActive });
    load();
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold">Print Partners</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="cursor-pointer gap-2"><Plus className="h-4 w-4" /> Add Partner</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-heading">Add Print Partner</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
              <div className="space-y-2">
                <Label>Region</Label>
                <Select value={regionId} onValueChange={(v: string | null) => v !== null && setRegionId(v)} required>
                  <SelectTrigger className="cursor-pointer"><SelectValue placeholder="Select region" /></SelectTrigger>
                  <SelectContent>{regions.map(r => <SelectItem key={r.id} value={r.id} className="cursor-pointer">{r.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Address</Label><Input value={address} onChange={e => setAddress(e.target.value)} required /></div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2"><Label>City</Label><Input value={city} onChange={e => setCity(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Province</Label><Input value={province} onChange={e => setProvince(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Postal Code</Label><Input value={postalCode} onChange={e => setPostalCode(e.target.value)} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2"><Label>Base Price (cents)</Label><Input type="number" value={priceCents} onChange={e => setPriceCents(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Extra Page (cents)</Label><Input type="number" value={extraPageCents} onChange={e => setExtraPageCents(e.target.value)} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2"><Label>Shipping (cents)</Label><Input type="number" value={shippingCents} onChange={e => setShippingCents(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Turnaround (days)</Label><Input type="number" value={turnaroundDays} onChange={e => setTurnaroundDays(e.target.value)} required /></div>
              </div>
              <Button type="submit" className="w-full cursor-pointer">Create Partner</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {partners.length === 0 ? (
        <div className="text-center py-16"><Settings className="h-8 w-8 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No print partners configured</p></div>
      ) : (
        <div className="space-y-3">
          {partners.map(partner => (
            <Card key={partner.id}>
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-heading font-semibold">{partner.name}</p>
                    <Badge variant={partner.is_active ? 'default' : 'secondary'}>{partner.is_active ? 'Active' : 'Inactive'}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{partner.city}, {partner.province} &middot; {partner.region?.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatCurrency(partner.price_per_book_cents)} base &middot; {formatCurrency(partner.price_per_extra_page_cents)}/extra page &middot; {formatCurrency(partner.shipping_flat_rate_cents)} shipping &middot; {partner.turnaround_days}d
                  </p>
                </div>
                <Switch checked={partner.is_active} onCheckedChange={() => toggleActive(partner.id, partner.is_active)} className="cursor-pointer" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
