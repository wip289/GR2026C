import { useMemo } from "react";
import { useEvent } from "@/contexts/EventContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import {
  calculateFinancialSummary,
  calculateCategoryTotal,
  formatRupiah,
  formatRupiahShort,
} from "@/lib/financialPlanner";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function FinanceDashboard() {
  const { state } = useEvent();
  const [, navigate] = useLocation();

  const summary = useMemo(() => {
    if (!state.isComplete && !state.eventInfo.eventName) return null;
    return calculateFinancialSummary({
      eventInfo: state.eventInfo,
      boothTypes: state.boothTypes,
      interviewBooths: state.interviewBooths,
      sponsorTiers: state.sponsorTiers,
      expenses: state.expenses,
      fillRate: state.fillRate,
      contingencyPercent: state.contingencyPercent,
      targetProfitMargin: state.targetProfitMargin,
    });
  }, [state]);

  if (!summary) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Belum ada data event</h2>
          <p className="text-muted-foreground mb-6">Lengkapi Financial Planner terlebih dahulu untuk melihat laporan keuangan.</p>
          <Button onClick={() => navigate("/planner")}>Buka Financial Planner</Button>
        </Card>
      </div>
    );
  }

  const isProfit = summary.profitLoss >= 0;
  const expensePct = summary.totalExpenses > 0
    ? Math.round((summary.totalExpenses / summary.totalRevenue) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold">Finance Dashboard</h1>
          </div>
          <button onClick={() => navigate("/boss")}
            style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.3)", color: "#D4A017", borderRadius: 8, padding: "0.4rem 0.9rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>
            ← Panel Panitia
          </button>
          </div>
          <p className="text-muted-foreground">
            {state.eventInfo.eventName || "Event"} — laporan keuangan proyeksi
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Pendapatan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatRupiahShort(summary.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">Booth + sponsor</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Pengeluaran</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatRupiahShort(summary.totalExpenses)}</div>
              <p className="text-xs text-muted-foreground mt-1">{expensePct}% dari pendapatan</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {isProfit ? "Proyeksi Profit" : "Proyeksi Rugi"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold flex items-center gap-1 ${isProfit ? "text-green-600" : "text-red-600"}`}>
                {isProfit ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                {formatRupiahShort(Math.abs(summary.profitLoss))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Margin {summary.profitMargin.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Fill Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{state.fillRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">Target booth terjual</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Sumber Pendapatan</CardTitle>
              <CardDescription>Booth vs sponsorship</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Pendapatan Booth</span>
                  <span>{formatRupiah(summary.totalBoothRevenue)}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${summary.totalRevenue > 0 ? (summary.totalBoothRevenue / summary.totalRevenue * 100) : 0}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Pendapatan Sponsor</span>
                  <span>{formatRupiah(summary.totalSponsorRevenue)}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${summary.totalRevenue > 0 ? (summary.totalSponsorRevenue / summary.totalRevenue * 100) : 0}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Biaya per Kategori</CardTitle>
              <CardDescription>Breakdown pengeluaran</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {state.expenses.map((cat) => {
                const total = calculateCategoryTotal(cat);
                const pct = summary.totalExpenses > 0 ? (total / summary.totalExpenses * 100) : 0;
                return (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{cat.name}</span>
                      <span className="text-muted-foreground">{formatRupiahShort(total)}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {!state.eventInfo.venueIsFree && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Sewa Venue</span>
                    <span className="text-muted-foreground">{formatRupiahShort(state.eventInfo.venueCost)}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5">
                    <div className="bg-orange-500 h-1.5 rounded-full"
                      style={{ width: `${summary.totalExpenses > 0 ? (state.eventInfo.venueCost / summary.totalExpenses * 100) : 0}%` }} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Booth Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Analisis Harga Booth</CardTitle>
            <CardDescription>Proyeksi pendapatan per tipe booth pada fill rate {state.fillRate}%</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.perBoothCosts.map((pb) => {
                const booth = state.boothTypes.find(b => b.id === pb.boothTypeId);
                const soldQty = Math.round((booth?.quantity ?? 0) * state.fillRate / 100);
                return (
                  <div key={pb.boothTypeId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold">{pb.boothTypeName}</span>
                      <Badge variant="outline">{booth?.quantity ?? 0} unit total</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Harga jual</p>
                        <p className="font-semibold">{formatRupiahShort(pb.sellingPrice)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Biaya produksi</p>
                        <p className="font-semibold">{formatRupiahShort(pb.productionCost)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Margin/booth</p>
                        <p className="font-semibold text-green-600">{formatRupiahShort(pb.marginPerBooth)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Proyeksi terjual</p>
                        <p className="font-semibold">{soldQty} unit</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sponsor tiers */}
        <Card>
          <CardHeader>
            <CardTitle>Tier Sponsorship</CardTitle>
            <CardDescription>Proyeksi pendapatan sponsor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {state.sponsorTiers.map((tier) => (
                <div key={tier.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold">{tier.name}</p>
                    <p className="text-sm text-muted-foreground">{tier.expectedCount} sponsor konfirmasi</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatRupiahShort(tier.pricePerSponsor)}/sponsor</p>
                    <p className="text-sm text-green-600 font-medium">
                      Total: {formatRupiahShort(tier.pricePerSponsor * tier.expectedCount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
