'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, TrendingUp, DollarSign, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCustomerProfitability } from '@/lib/actions/credits';
import { formatCurrency } from '@/lib/utils';

export default function ProfitabilityPage() {
  const [data, setData] = useState<Array<{
    user_id: string;
    email: string;
    full_name: string | null;
    total_revenue: number;
    total_cost: number;
    profit: number;
    generations: number;
    downloads: number;
    prints: number;
    total_transactions: number;
  }>>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await getCustomerProfitability();
    if (res.data) setData(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const totalRevenue = data.reduce((s, d) => s + d.total_revenue, 0);
  const totalCost = data.reduce((s, d) => s + d.total_cost, 0);
  const totalProfit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-heading font-bold">Customer Profitability</h1>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <DollarSign className="h-6 w-6 text-green-600 mb-2" />
            <p className="text-2xl font-heading font-bold">{formatCurrency(totalRevenue)}</p>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <DollarSign className="h-6 w-6 text-red-500 mb-2" />
            <p className="text-2xl font-heading font-bold">{formatCurrency(totalCost)}</p>
            <p className="text-sm text-muted-foreground">Total Cost</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <TrendingUp className="h-6 w-6 text-primary mb-2" />
            <p className="text-2xl font-heading font-bold">{formatCurrency(totalProfit)}</p>
            <p className="text-sm text-muted-foreground">Net Profit</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Users className="h-6 w-6 text-primary mb-2" />
            <p className="text-2xl font-heading font-bold">{margin}%</p>
            <p className="text-sm text-muted-foreground">Margin</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-Customer Table */}
      <Card>
        <CardHeader><CardTitle className="font-heading">By Customer</CardTitle></CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <p className="text-muted-foreground">No transaction data yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium">Customer</th>
                    <th className="text-right py-2 font-medium">Revenue</th>
                    <th className="text-right py-2 font-medium">Cost</th>
                    <th className="text-right py-2 font-medium">Profit</th>
                    <th className="text-right py-2 font-medium">Gens</th>
                    <th className="text-right py-2 font-medium">DLs</th>
                    <th className="text-right py-2 font-medium">Prints</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(row => (
                    <tr key={row.user_id} className="border-b border-border last:border-0">
                      <td className="py-2">
                        <p className="font-medium">{row.full_name || row.email}</p>
                        {row.full_name && <p className="text-xs text-muted-foreground">{row.email}</p>}
                      </td>
                      <td className="text-right py-2 text-green-600">{formatCurrency(row.total_revenue)}</td>
                      <td className="text-right py-2 text-red-500">{formatCurrency(row.total_cost)}</td>
                      <td className="text-right py-2 font-bold">{formatCurrency(row.profit)}</td>
                      <td className="text-right py-2">{row.generations}</td>
                      <td className="text-right py-2">{row.downloads}</td>
                      <td className="text-right py-2">{row.prints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
