import { useMemo } from "react";
import { useEvent } from "@/contexts/EventContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, AlertCircle } from "lucide-react";
import { formatRupiah, formatRupiahShort, calculateSponsorRevenue } from "@/lib/financialPlanner";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function SponsorshipDashboard() {
  const { state } = useEvent();
  const [, navigate] = useLocation();

  const hasData = !!state.eventInfo.eventName;

  const totalSponsorRevenue = useMemo(
    () => calculateSponsorRevenue(state.sponsorTiers),
    [state.sponsorTiers]
  );

  const totalConfirmed = state.sponsorTiers.reduce((sum, t) => sum + t.expectedCount, 0);
  const totalPending = 0; // placeholder — nanti dari data real sponsor yang mendaftar

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

  const tierColors: Record<string, string> = {
    platinum: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    gold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    silver: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3">
            <Gift className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold">Sponsorship Dashboard</h1>
          </div>
          <button onClick={() => navigate("/boss")}
            style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.3)", color: "#D4A017", borderRadius: 8, padding: "0.4rem 0.9rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>
            ← Panel Panitia
          </button>
          </div>
          <p className="text-muted-foreground">{state.eventInfo.eventName} — kelola paket &amp; pendapatan sponsor</p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Proyeksi Pendapatan Sponsor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{formatRupiahShort(totalSponsorRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">Berdasarkan {totalConfirmed} sponsor di planner</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tier Tersedia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{state.sponsorTiers.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Paket sponsorship aktif</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sponsor di Planner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{totalConfirmed}</div>
              <p className="text-xs text-muted-foreground mt-1">Target dalam proyeksi</p>
            </CardContent>
          </Card>
        </div>

        {/* Sponsor Tiers */}
        <Card>
          <CardHeader>
            <CardTitle>Paket Sponsorship</CardTitle>
            <CardDescription>Tier dan benefit dari Financial Planner</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {state.sponsorTiers.map((tier) => {
                const colorKey = Object.keys(tierColors).find(k => tier.id.includes(k) || tier.name.toLowerCase().includes(k));
                const badgeClass = colorKey ? tierColors[colorKey] : "bg-secondary text-foreground";
                const tierTotal = tier.pricePerSponsor * tier.expectedCount;
                return (
                  <div key={tier.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{tier.name}</h3>
                          <Badge className={badgeClass}>{tier.expectedCount} sponsor</Badge>
                        </div>
                        <p className="text-lg font-bold text-purple-600">{formatRupiah(tier.pricePerSponsor)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total proyeksi</p>
                        <p className="font-bold text-green-600">{formatRupiahShort(tierTotal)}</p>
                      </div>
                    </div>
                    {tier.benefits && (
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">Benefits:</p>
                        <p className="leading-relaxed">{tier.benefits}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Revenue summary */}
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Pendapatan Sponsorship</CardTitle>
            <CardDescription>Proyeksi total per tier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {state.sponsorTiers.map((tier) => {
                const tierTotal = tier.pricePerSponsor * tier.expectedCount;
                const pct = totalSponsorRevenue > 0 ? (tierTotal / totalSponsorRevenue * 100) : 0;
                return (
                  <div key={tier.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{tier.name}</span>
                      <span className="text-muted-foreground">{formatRupiahShort(tierTotal)} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              <div className="flex justify-between pt-2 border-t font-bold">
                <span>Total</span>
                <span className="text-purple-600">{formatRupiah(totalSponsorRevenue)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card>
          <CardHeader>
            <CardTitle>Database Employer untuk Outreach Sponsorship</CardTitle>
            <CardDescription>Akses kontak perusahaan untuk pendekatan sponsor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900">
              <div>
                <p className="font-medium">Lihat Database Employer</p>
                <p className="text-sm text-muted-foreground">Filter berdasarkan riwayat sponsorship</p>
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
