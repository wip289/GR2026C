import { useMemo } from "react";
import { useEvent } from "@/contexts/EventContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, AlertCircle } from "lucide-react";
import { formatRupiahShort, calculateCategoryTotal } from "@/lib/financialPlanner";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function MarketingDashboard() {
  const { state } = useEvent();
  const [, navigate] = useLocation();

  const hasData = !!state.eventInfo.eventName;

  // Find marketing-related expense categories
  const marketingCategories = useMemo(() => {
    return state.expenses.filter(cat =>
      cat.name.toLowerCase().includes("market") ||
      cat.name.toLowerCase().includes("promot") ||
      cat.name.toLowerCase().includes("media") ||
      cat.name.toLowerCase().includes("publication") ||
      cat.name.toLowerCase().includes("dokumentasi") ||
      cat.name.toLowerCase().includes("souven")
    );
  }, [state.expenses]);

  const marketingTotal = useMemo(() =>
    marketingCategories.reduce((sum, cat) => sum + calculateCategoryTotal(cat), 0),
    [marketingCategories]
  );

  const totalExpenses = useMemo(() =>
    state.expenses.reduce((sum, cat) => sum + calculateCategoryTotal(cat), 0),
    [state.expenses]
  );

  const marketingPct = totalExpenses > 0 ? Math.round(marketingTotal / totalExpenses * 100) : 0;

  const expectedEmployers = state.boothTypes.reduce((sum, b) => sum + b.quantity, 0);

  if (!hasData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Belum ada data event</h2>
          <p className="text-muted-foreground mb-6">Lengkapi Financial Planner terlebih dahulu.</p>
          <Button onClick={() => navigate("/planner")}>Buka Financial Planner</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-pink-600" />
            <h1 className="text-3xl font-bold">Marketing Dashboard</h1>
          </div>
          <button onClick={() => navigate("/boss")}
            style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.3)", color: "#D4A017", borderRadius: 8, padding: "0.4rem 0.9rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>
            ← Panel Panitia
          </button>
          </div>
          <p className="text-muted-foreground">{state.eventInfo.eventName} — anggaran & strategi promosi</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Anggaran Marketing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatRupiahShort(marketingTotal)}</div>
              <p className="text-xs text-muted-foreground mt-1">{marketingPct}% dari total biaya</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Target Employer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-600">{expectedEmployers}</div>
              <p className="text-xs text-muted-foreground mt-1">Total booth tersedia</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Target Fill Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{state.fillRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                = {Math.round(expectedEmployers * state.fillRate / 100)} employer terdaftar
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Marketing Budget Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Rincian Anggaran Marketing & Promosi</CardTitle>
            <CardDescription>Berdasarkan kategori expense di Financial Planner</CardDescription>
          </CardHeader>
          <CardContent>
            {marketingCategories.length > 0 ? (
              <div className="space-y-4">
                {marketingCategories.map((cat) => {
                  const catTotal = calculateCategoryTotal(cat);
                  return (
                    <div key={cat.id}>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-sm">{cat.name}</span>
                        <span className="text-sm text-muted-foreground">{formatRupiahShort(catTotal)}</span>
                      </div>
                      <div className="space-y-1 pl-3 border-l-2 border-border">
                        {cat.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-xs text-muted-foreground">
                            <span>{item.name}</span>
                            <span>{formatRupiahShort(item.subtotal || item.unitCost * item.quantity * item.frequency)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Belum ada kategori marketing di expense list.</p>
                <p className="text-xs mt-1">Tambahkan di Financial Planner → Step Expenses.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booth types as outreach target */}
        <Card>
          <CardHeader>
            <CardTitle>Target Outreach per Tipe Booth</CardTitle>
            <CardDescription>Berapa employer yang perlu dihubungi untuk mencapai fill rate {state.fillRate}%</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {state.boothTypes.map((booth) => {
                const target = Math.round(booth.quantity * state.fillRate / 100);
                const pct = Math.round(target / booth.quantity * 100);
                return (
                  <div key={booth.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-semibold">{booth.name}</p>
                      <p className="text-sm text-muted-foreground">{booth.width}×{booth.height}m — {formatRupiahShort(booth.sellingPrice)}/booth</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{target} <span className="text-sm font-normal text-muted-foreground">/ {booth.quantity}</span></p>
                      <Badge variant="outline">{pct}% target</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Employer Database */}
        <Card>
          <CardHeader>
            <CardTitle>Database Employer untuk Outreach</CardTitle>
            <CardDescription>Akses database employer untuk kampanye marketing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-pink-50 dark:bg-pink-950/20 rounded-lg border border-pink-200 dark:border-pink-900">
              <div>
                <p className="font-medium">Lihat Database Employer</p>
                <p className="text-sm text-muted-foreground">Filter berdasarkan industri dan riwayat booth</p>
              </div>
              <Button variant="outline" onClick={() => navigate("/employers")}>
                Buka Database
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
