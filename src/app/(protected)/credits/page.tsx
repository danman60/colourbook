'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sparkles, Loader2, Check, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getCreditPacks, getCreditBalance, getCreditHistory, purchaseCredits } from '@/lib/actions/credits';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { CreditPack, CreditTransaction } from '@/types';
import { toast } from 'sonner';

const ACTION_LABELS: Record<string, string> = {
  purchase: 'Credit Purchase',
  grant: 'Credits Granted',
  generate_page: 'Page Generation',
  regenerate_page: 'Page Regeneration',
  finalize_book: 'Book Finalized',
  download_pdf: 'PDF Download',
  print_ship: 'Print & Ship',
  refund: 'Refund',
  adjustment: 'Adjustment',
};

export default function CreditsPage() {
  const searchParams = useSearchParams();
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [history, setHistory] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const load = useCallback(async () => {
    const [packsRes, balanceRes, historyRes] = await Promise.all([
      getCreditPacks(),
      getCreditBalance(),
      getCreditHistory(),
    ]);
    if (packsRes.data) setPacks(packsRes.data);
    if (balanceRes.data !== null) setBalance(balanceRes.data);
    if (historyRes.data) setHistory(historyRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (searchParams.get('purchase') === 'success') {
      toast.success('Credits purchased successfully!');
      load(); // Refresh balance
    } else if (searchParams.get('purchase') === 'cancelled') {
      toast.error('Purchase cancelled');
    }
  }, [searchParams, load]);

  async function handlePurchase(packId: string) {
    setPurchasing(packId);
    try {
      const { data, error } = await purchaseCredits(packId);
      if (error || !data) {
        toast.error(error || 'Failed to start checkout');
        setPurchasing(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error('Something went wrong');
      setPurchasing(null);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold">Credits</h1>
        <p className="text-muted-foreground mt-1">Purchase credits to generate pages, download PDFs, and order prints.</p>
      </div>

      {/* Current Balance */}
      <Card>
        <CardContent className="pt-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current Balance</p>
            <p className="text-4xl font-heading font-bold">{balance}</p>
            <p className="text-sm text-muted-foreground">credits</p>
          </div>
          <Sparkles className="h-12 w-12 text-primary opacity-50" />
        </CardContent>
      </Card>

      {/* Credit Costs Reference */}
      <Card>
        <CardHeader><CardTitle className="font-heading text-lg">What Credits Buy</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="font-bold text-lg">1</p>
              <p className="text-muted-foreground">Generate Page</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="font-bold text-lg">2</p>
              <p className="text-muted-foreground">Finalize Book</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="font-bold text-lg">3</p>
              <p className="text-muted-foreground">Download PDF</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="font-bold text-lg">15</p>
              <p className="text-muted-foreground">Print & Ship</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credit Packs */}
      <div>
        <h2 className="text-xl font-heading font-bold mb-4">Buy Credits</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {packs.map(pack => (
            <Card key={pack.id} className={pack.name === 'Popular' ? 'border-primary ring-1 ring-primary' : ''}>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-heading font-bold">{pack.name}</h3>
                  {pack.name === 'Popular' && <Badge>Best Value</Badge>}
                </div>
                <div>
                  <span className="text-3xl font-heading font-bold">{formatCurrency(pack.price_cents)}</span>
                </div>
                <p className="text-muted-foreground">
                  {pack.credits} credits
                  <span className="text-xs ml-1">({formatCurrency(Math.round(pack.price_cents / pack.credits))}/credit)</span>
                </p>
                <Button
                  onClick={() => handlePurchase(pack.id)}
                  disabled={purchasing !== null}
                  className="w-full cursor-pointer"
                >
                  {purchasing === pack.id ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</>
                  ) : (
                    <>Buy {pack.credits} Credits</>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <Button
          variant="ghost"
          onClick={() => setShowHistory(!showHistory)}
          className="gap-2 cursor-pointer"
        >
          <History className="h-4 w-4" />
          {showHistory ? 'Hide' : 'Show'} Transaction History
        </Button>

        {showHistory && (
          <Card className="mt-3">
            <CardContent className="pt-6">
              {history.length === 0 ? (
                <p className="text-muted-foreground text-sm">No transactions yet</p>
              ) : (
                <div className="space-y-2">
                  {history.map(txn => (
                    <div key={txn.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium">{ACTION_LABELS[txn.action] || txn.action}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(txn.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${txn.credits > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {txn.credits > 0 ? '+' : ''}{txn.credits}
                        </p>
                        <p className="text-xs text-muted-foreground">bal: {txn.balance_after}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
