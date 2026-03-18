'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { getBook } from '@/lib/actions/books';
import { getPrintPartners } from '@/lib/actions/print-partners';
import { createOrder } from '@/lib/actions/orders';
import { createCheckoutSession } from '@/lib/actions/stripe';
import { formatCurrency } from '@/lib/utils';
import type { Book, PrintPartner } from '@/types';
import { toast } from 'sonner';

const PROVINCES = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.bookId as string;

  const [book, setBook] = useState<Book | null>(null);
  const [partners, setPartners] = useState<PrintPartner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Shipping form
  const [shippingName, setShippingName] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('ON');
  const [postalCode, setPostalCode] = useState('');

  const load = useCallback(async () => {
    const [bookRes, partnersRes] = await Promise.all([
      getBook(bookId),
      getPrintPartners(),
    ]);
    if (bookRes.data) setBook(bookRes.data);
    if (partnersRes.data) {
      setPartners(partnersRes.data);
      if (partnersRes.data.length > 0) setSelectedPartner(partnersRes.data[0].id);
    }
    setLoading(false);
  }, [bookId]);

  useEffect(() => { load(); }, [load]);

  const partner = partners.find(p => p.id === selectedPartner);
  const extraPages = Math.max(0, (book?.page_count || 0) - 10);
  const baseCents = partner?.price_per_book_cents || 0;
  const extraCents = extraPages * (partner?.price_per_extra_page_cents || 0);
  const shippingCents = partner?.shipping_flat_rate_cents || 0;
  const totalCents = baseCents + extraCents + shippingCents;

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!partner || !book) return;

    setProcessing(true);
    try {
      // Create order
      const { data: order, error: orderError } = await createOrder({
        book_id: bookId,
        print_partner_id: selectedPartner,
        shipping_name: shippingName,
        shipping_address_line1: address1,
        shipping_address_line2: address2 || null,
        shipping_city: city,
        shipping_province: province,
        shipping_postal_code: postalCode,
        shipping_country: 'CA',
      });

      if (orderError || !order) {
        toast.error(orderError || 'Failed to create order');
        setProcessing(false);
        return;
      }

      // Create Stripe checkout session
      const { data: session, error: stripeError } = await createCheckoutSession(order.id);

      if (stripeError || !session) {
        toast.error(stripeError || 'Failed to create payment session');
        setProcessing(false);
        return;
      }

      // Redirect to Stripe
      window.location.href = session.url;
    } catch {
      toast.error('Something went wrong');
      setProcessing(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!book) {
    return <p>Book not found</p>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href={`/books/${bookId}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer">
        <ArrowLeft className="h-4 w-4" /> Back to Book
      </Link>

      <h1 className="text-3xl font-heading font-bold">Order Your Book</h1>

      <form onSubmit={handleCheckout} className="space-y-6">
        {/* Book Summary */}
        <Card>
          <CardHeader><CardTitle className="font-heading">Book Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between"><span>Book:</span><span className="font-medium">{book.title}</span></div>
            <div className="flex justify-between"><span>Pages:</span><span>{book.page_count}</span></div>
          </CardContent>
        </Card>

        {/* Print Partner */}
        <Card>
          <CardHeader><CardTitle className="font-heading">Print Partner</CardTitle></CardHeader>
          <CardContent>
            <Select value={selectedPartner} onValueChange={(v: string | null) => v !== null && setSelectedPartner(v)}>
              <SelectTrigger className="cursor-pointer">
                <SelectValue placeholder="Select print partner" />
              </SelectTrigger>
              <SelectContent>
                {partners.map(p => (
                  <SelectItem key={p.id} value={p.id} className="cursor-pointer">
                    {p.name} — {p.city}, {p.province} ({p.turnaround_days} day turnaround)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Shipping */}
        <Card>
          <CardHeader><CardTitle className="font-heading">Shipping Address</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={shippingName} onChange={e => setShippingName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={address1} onChange={e => setAddress1(e.target.value)} placeholder="Street address" required />
              <Input value={address2} onChange={e => setAddress2(e.target.value)} placeholder="Apt, suite, etc. (optional)" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={city} onChange={e => setCity(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Province</Label>
                <Select value={province} onValueChange={(v: string | null) => v !== null && setProvince(v)}>
                  <SelectTrigger className="cursor-pointer"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROVINCES.map(p => <SelectItem key={p} value={p} className="cursor-pointer">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Postal Code</Label>
              <Input value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="A1A 1A1" required />
            </div>
          </CardContent>
        </Card>

        {/* Price Breakdown */}
        <Card>
          <CardHeader><CardTitle className="font-heading">Price</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between"><span>Base book (up to 10 pages)</span><span>{formatCurrency(baseCents)}</span></div>
            {extraPages > 0 && (
              <div className="flex justify-between"><span>{extraPages} extra page{extraPages !== 1 ? 's' : ''}</span><span>{formatCurrency(extraCents)}</span></div>
            )}
            <div className="flex justify-between"><span>Shipping</span><span>{formatCurrency(shippingCents)}</span></div>
            <Separator />
            <div className="flex justify-between text-lg font-heading font-bold">
              <span>Total</span><span>{formatCurrency(totalCents)}</span>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full cursor-pointer gap-2" disabled={processing || !partner}>
          {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
          {processing ? 'Processing...' : `Pay ${formatCurrency(totalCents)}`}
        </Button>
      </form>
    </div>
  );
}
