/**
 * Dashboard Page — Financial Analysis & What-If Scenarios
 *
 * Design: "Event Canvas" — Warm Editorial / Magazine Spread
 * Shows: P&L overview, expense/revenue charts, what-if simulator, reverse calculator
 */

import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useEvent } from "@/contexts/EventContext";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import {
  ArrowLeft, TrendingUp, TrendingDown, Calculator, Sliders,
  Calendar, DollarSign, LayoutGrid, Handshake, AlertTriangle, CheckCircle2,
  Printer, FileDown,
} from "lucide-react";
import {
  formatRupiah, formatRupiahShort,
  calculateTotalExpenses, calculateBoothRevenue, calculateSponsorRevenue,
  calculateFinancialSummary, reverseCalculate, calculateCategoryTotal,
} from "@/lib/financialPlanner";

const COLORS = [
  "oklch(0.55 0.14 25)", // terracotta
  "oklch(0.58 0.05 140)", // sage
  "oklch(0.73 0.08 70)", // warm-gold
  "oklch(0.50 0.12 250)", // blue
  "oklch(0.65 0.10 330)", // pink
  "oklch(0.60 0.15 60)", // orange
  "oklch(0.45 0.08 200)", // teal
];

// ─── P&L Report Generator ───────────────────────────────────
function generatePLReportHTML(state: any, summary: any): string {
  const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");
  const fmtShort = (n: number) => {
    if (Math.abs(n) >= 1_000_000_000) return "Rp " + (n / 1_000_000_000).toFixed(1) + "M";
    if (Math.abs(n) >= 1_000_000) return "Rp " + (n / 1_000_000).toFixed(0) + "jt";
    return "Rp " + n.toLocaleString("id-ID");
  };
  const isProfit = summary.projectedProfitLoss >= 0;
  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  const expenseRows = state.expenses.map((cat: any) => {
    const catTotal = cat.items.reduce((s: number, item: any) =>
      s + item.quantity * item.unitCost * item.frequency, 0);
    const itemRows = cat.items.map((item: any) => {
      const sub = item.quantity * item.unitCost * item.frequency;
      return `<tr class="item-row">
        <td class="item-name">${item.name}</td>
        <td>${item.quantity} ${item.unit}</td>
        <td>${fmt(item.unitCost)}</td>
        <td>${item.frequencyUnit === "day" ? item.frequency + " hari" : "—"}</td>
        <td class="amount">${fmt(sub)}</td>
      </tr>`;
    }).join("");
    return `<tr class="cat-row">
      <td colspan="4" class="cat-name">${cat.name}</td>
      <td class="amount cat-total">${fmt(catTotal)}</td>
    </tr>${itemRows}`;
  }).join("");

  const boothRows = state.boothTypes.map((b: any) => {
    const projected = Math.round(b.quantity * state.fillRate / 100);
    return `<tr>
      <td>${b.name} (${b.width}×${b.height}m)</td>
      <td class="num">${b.quantity}</td>
      <td class="num">${fmt(b.sellingPrice)}</td>
      <td class="num">${projected}</td>
      <td class="num amount">${fmt(projected * b.sellingPrice)}</td>
    </tr>`;
  }).join("");

  const sponsorRows = state.sponsorTiers.map((t: any) => `<tr>
    <td>${t.name}</td>
    <td class="num">${fmt(t.pricePerSponsor)}</td>
    <td class="num">${t.expectedCount}</td>
    <td class="num amount">${fmt(t.pricePerSponsor * t.expectedCount)}</td>
  </tr>`).join("");

  const perBoothRows = summary.perBoothCosts.map((p: any) => `<tr>
    <td>${p.boothTypeName}</td>
    <td class="num">${fmt(p.productionCost)}</td>
    <td class="num">${fmt(p.sellingPrice)}</td>
    <td class="num ${p.marginPerBooth >= 0 ? "pos" : "neg"}">${fmt(p.marginPerBooth)}</td>
    <td class="num ${p.marginPercent >= 0 ? "pos" : "neg"}">${p.marginPercent.toFixed(1)}%</td>
  </tr>`).join("");

  return `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"/>
<title>Laporan P&L — ${state.eventInfo.eventName}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Arial',sans-serif;color:#1a1a1a;background:#fff;font-size:11pt}
@page{margin:18mm 16mm;size:A4}
@media print{body{font-size:10pt}}

.cover{page-break-after:always;padding:60px 0;text-align:center;border-bottom:3px solid #C4553A}
.cover-label{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#C4553A;margin-bottom:12px}
.cover-title{font-size:32px;font-weight:bold;color:#1a2e44;margin-bottom:8px}
.cover-sub{font-size:16px;color:#666;margin-bottom:32px}
.cover-meta{display:inline-grid;grid-template-columns:repeat(3,180px);gap:24px;text-align:left;border-top:1px solid #e5e7eb;padding-top:24px}
.meta-label{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#999;display:block;margin-bottom:4px}
.meta-value{font-size:14px;font-weight:600;color:#1a2e44}

.section{margin-bottom:32px;page-break-inside:avoid}
h2{font-size:16px;color:#1a2e44;border-bottom:2px solid #C4553A;padding-bottom:8px;margin-bottom:16px}
h3{font-size:13px;color:#444;margin-bottom:10px}

.kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px}
.kpi{background:#f8f4f0;border-radius:8px;padding:14px;text-align:center}
.kpi-label{font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#999;margin-bottom:6px}
.kpi-value{font-size:18px;font-weight:bold;color:#C4553A}
.kpi-sub{font-size:10px;color:#888;margin-top:3px}
.kpi.profit .kpi-value{color:#2d6a4f}
.kpi.loss .kpi-value{color:#c0392b}

table{width:100%;border-collapse:collapse;font-size:10.5pt;margin-bottom:8px}
th{background:#1a2e44;color:white;padding:8px 10px;text-align:left;font-size:9.5pt}
th.num,td.num{text-align:right}
td{padding:6px 10px;border-bottom:1px solid #f0f0f0}
tr:hover td{background:#fafafa}
.cat-row td{background:#f5f0eb;font-weight:bold;padding:8px 10px}
.cat-name{font-size:11pt}
.cat-total{font-weight:bold;color:#C4553A}
.item-row td{font-size:9.5pt;color:#555;padding:5px 10px 5px 22px}
.item-name{color:#333}
.amount{text-align:right;font-family:monospace}
.total-row td{background:#1a2e44;color:white;font-weight:bold;padding:9px 10px}
.total-row .amount{color:#ffd700}
.pos{color:#2d6a4f;font-weight:bold}
.neg{color:#c0392b;font-weight:bold}

.pl-box{border-radius:10px;padding:20px 24px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center}
.pl-box.profit{background:#e8f5e9;border:1.5px solid #a5d6a7}
.pl-box.loss{background:#fce4ec;border:1.5px solid #f48fb1}
.pl-label{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;margin-bottom:4px}
.pl-value{font-size:28px;font-weight:bold}
.pl-value.profit{color:#2d6a4f}
.pl-value.loss{color:#c0392b}
.pl-margin{font-size:13px;color:#888}

.footer{text-align:center;font-size:9pt;color:#999;margin-top:40px;padding-top:12px;border-top:1px solid #e5e7eb}
</style></head><body>

<div class="cover">
  <div class="cover-label">Laporan Keuangan Proyeksi</div>
  <div class="cover-title">${state.eventInfo.eventName}</div>
  <div class="cover-sub">Profit &amp; Loss Report</div>
  <div class="cover-meta">
    <div><span class="meta-label">Klien</span><span class="meta-value">${state.eventInfo.clientName || "—"}</span></div>
    <div><span class="meta-label">Venue</span><span class="meta-value">${state.eventInfo.venueName || "—"}</span></div>
    <div><span class="meta-label">Durasi</span><span class="meta-value">${state.eventInfo.eventDuration} Hari</span></div>
    <div><span class="meta-label">Fill Rate Target</span><span class="meta-value">${state.fillRate}%</span></div>
    <div><span class="meta-label">Kontingensi</span><span class="meta-value">${state.contingencyPercent}%</span></div>
    <div><span class="meta-label">Dibuat</span><span class="meta-value">${today}</span></div>
  </div>
</div>

<!-- KPI -->
<div class="kpi-row">
  <div class="kpi"><div class="kpi-label">Total Pengeluaran</div><div class="kpi-value">${fmtShort(summary.totalExpenses)}</div></div>
  <div class="kpi"><div class="kpi-label">Revenue Booth</div><div class="kpi-value">${fmtShort(summary.projectedBoothRevenue)}</div><div class="kpi-sub">Fill ${state.fillRate}%</div></div>
  <div class="kpi"><div class="kpi-label">Revenue Sponsor</div><div class="kpi-value">${fmtShort(summary.totalSponsorRevenue)}</div></div>
  <div class="kpi ${isProfit ? "profit" : "loss"}"><div class="kpi-label">${isProfit ? "Proyeksi Surplus" : "Proyeksi Defisit"}</div><div class="kpi-value ${isProfit ? "profit" : "loss"}">${fmtShort(Math.abs(summary.projectedProfitLoss))}</div><div class="kpi-sub">Margin ${summary.profitMargin.toFixed(1)}%</div></div>
</div>

<!-- P&L Summary -->
<div class="section">
  <h2>Ringkasan Profit &amp; Loss</h2>
  <div class="pl-box ${isProfit ? "profit" : "loss"}">
    <div>
      <div class="pl-label">${isProfit ? "Proyeksi Surplus" : "Proyeksi Defisit"}</div>
      <div class="pl-value ${isProfit ? "profit" : "loss"}">${fmt(Math.abs(summary.projectedProfitLoss))}</div>
      <div class="pl-margin">Profit margin: ${summary.profitMargin.toFixed(1)}% &nbsp;|&nbsp; Break-even: ${summary.breakEvenBooths} booth</div>
    </div>
    <div style="text-align:right">
      <div class="pl-label">Total Pendapatan</div>
      <div style="font-size:18px;font-weight:bold;color:#1a2e44">${fmt(summary.projectedTotalRevenue)}</div>
      <div style="font-size:12px;color:#888;margin-top:4px">Total Pengeluaran: ${fmt(summary.totalExpenses)}</div>
    </div>
  </div>
</div>

<!-- Revenue Booth -->
<div class="section">
  <h2>Proyeksi Pendapatan Booth</h2>
  <table>
    <thead><tr><th>Tipe Booth</th><th class="num">Total Unit</th><th class="num">Harga/Unit</th><th class="num">Proyeksi Terjual</th><th class="num">Proyeksi Revenue</th></tr></thead>
    <tbody>
      ${boothRows}
      <tr class="total-row"><td colspan="4"><b>Total Revenue Booth</b></td><td class="amount">${fmt(summary.projectedBoothRevenue)}</td></tr>
    </tbody>
  </table>
</div>

<!-- Revenue Sponsor -->
<div class="section">
  <h2>Proyeksi Pendapatan Sponsorship</h2>
  <table>
    <thead><tr><th>Tier</th><th class="num">Harga/Sponsor</th><th class="num">Jumlah</th><th class="num">Total</th></tr></thead>
    <tbody>
      ${sponsorRows}
      <tr class="total-row"><td colspan="3"><b>Total Revenue Sponsor</b></td><td class="amount">${fmt(summary.totalSponsorRevenue)}</td></tr>
    </tbody>
  </table>
</div>

<!-- Expense Breakdown -->
<div class="section">
  <h2>Rincian Pengeluaran</h2>
  <table>
    <thead><tr><th>Nama Item</th><th>Qty</th><th>Harga Satuan</th><th>Frekuensi</th><th class="num">Subtotal</th></tr></thead>
    <tbody>
      ${expenseRows}
      ${!state.eventInfo.venueIsFree && state.eventInfo.venueCost > 0 ? `
      <tr class="cat-row"><td colspan="4" class="cat-name">Sewa Venue</td><td class="amount cat-total">${fmt(state.eventInfo.venueCost)}</td></tr>` : ""}
      <tr class="total-row"><td colspan="4"><b>Total Pengeluaran (termasuk kontingensi ${state.contingencyPercent}%)</b></td><td class="amount">${fmt(summary.totalExpenses)}</td></tr>
    </tbody>
  </table>
</div>

<!-- Per-Booth Analysis -->
<div class="section">
  <h2>Analisis Margin per Booth</h2>
  <table>
    <thead><tr><th>Tipe Booth</th><th class="num">Biaya Produksi</th><th class="num">Harga Jual</th><th class="num">Margin/Booth</th><th class="num">Margin %</th></tr></thead>
    <tbody>
      ${perBoothRows}
    </tbody>
  </table>
</div>

<div class="footer">${state.eventInfo.eventName} &nbsp;|&nbsp; ${state.eventInfo.clientName || ""} &nbsp;|&nbsp; Dicetak: ${today} &nbsp;|&nbsp; Dokumen ini bersifat proyeksi dan dapat berubah</div>
</body></html>`;
}

export default function Dashboard() {
  const { state, dispatch } = useEvent();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"overview" | "whatif" | "reverse">("overview");

  // Redirect if not complete
  if (!state.isComplete) {
    return (
      <div className="min-h-screen bg-paper paper-texture flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="font-display text-2xl font-bold text-charcoal">No event data yet</p>
          <p className="font-body text-charcoal-light">Please configure your event first.</p>
          <Button onClick={() => navigate("/planner")} className="bg-terracotta hover:bg-terracotta/90 text-white font-body">
            Go to Planner
          </Button>
        </div>
      </div>
    );
  }

  const summary = useMemo(() => calculateFinancialSummary({
    eventInfo: state.eventInfo,
    boothTypes: state.boothTypes,
    interviewBooths: state.interviewBooths,
    sponsorTiers: state.sponsorTiers,
    expenses: state.expenses,
    fillRate: state.fillRate,
    contingencyPercent: state.contingencyPercent,
    targetProfitMargin: state.targetProfitMargin,
  }), [state]);

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: TrendingUp },
    { id: "whatif" as const, label: "What-If Simulator", icon: Sliders },
    { id: "reverse" as const, label: "Reverse Calculator", icon: Calculator },
  ];

  return (
    <div className="min-h-screen bg-paper paper-texture">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-paper/80 backdrop-blur-md border-b border-border/50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/planner")} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
              <ArrowLeft className="w-4 h-4 text-charcoal" />
              <span className="font-body text-sm text-charcoal">Edit Plan</span>
            </button>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-sm bg-terracotta flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-display font-bold text-base text-charcoal tracking-tight">
                {state.eventInfo.eventName || "Job Fair Dashboard"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => window.print()} variant="outline" size="sm" className="gap-2 font-body text-xs">
              <Printer className="w-3 h-3" /> Print
            </Button>
            <Button onClick={() => {
              const html = generatePLReportHTML(state, summary);
              const blob = new Blob([html], { type: "text/html;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const win = window.open(url, "_blank");
              if (win) win.addEventListener("load", () => setTimeout(() => URL.revokeObjectURL(url), 5000));
              else { const a = document.createElement("a"); a.href = url; a.download = `PL-Report-${state.eventInfo.eventName || "event"}.html`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
            }} size="sm" className="gap-2 font-body text-xs bg-terracotta hover:bg-terracotta/90 text-white">
              <FileDown className="w-3 h-3" /> Export P&L
            </Button>
          </div>
        </div>
      </nav>

      <div className="pt-14">
        {/* Event Header */}
        <div className="container py-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-charcoal">{state.eventInfo.eventName || "Financial Dashboard"}</h1>
              <p className="font-body text-charcoal-light mt-1">
                {state.eventInfo.clientName && `${state.eventInfo.clientName} · `}
                {state.eventInfo.venueName && `${state.eventInfo.venueName} · `}
                {state.eventInfo.eventDuration} day(s)
              </p>
            </div>
            <div className={`px-5 py-3 rounded-xl text-center ${summary.projectedProfitLoss >= 0 ? "bg-sage/10" : "bg-destructive/10"}`}>
              <p className="font-body text-xs text-charcoal-light">{summary.projectedProfitLoss >= 0 ? "Projected Surplus" : "Projected Deficit"}</p>
              <p className={`font-display text-2xl font-bold ${summary.projectedProfitLoss >= 0 ? "text-sage" : "text-destructive"}`}>
                {formatRupiah(Math.abs(summary.projectedProfitLoss))}
              </p>
            </div>
          </div>
          <div className="editorial-rule w-full mt-4 rounded-full" />
        </div>

        {/* Tab Navigation */}
        <div className="container pb-4">
          <div className="flex gap-2 bg-paper-dark rounded-xl p-1.5 max-w-lg">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-body text-sm font-medium transition-all ${
                  activeTab === tab.id ? "bg-white text-charcoal shadow-sm" : "text-charcoal-light hover:text-charcoal"
                }`}>
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="container pb-12">
          {activeTab === "overview" && <OverviewTab summary={summary} state={state} />}
          {activeTab === "whatif" && <WhatIfTab />}
          {activeTab === "reverse" && <ReverseTab />}
        </div>
      </div>
    </div>
  );
}

// ─── Overview Tab ───────────────────────────────────────────

function OverviewTab({ summary, state }: { summary: ReturnType<typeof calculateFinancialSummary>; state: any }) {
  // Expense pie data
  const expensePieData = useMemo(() => {
    const data = state.expenses.map((cat: any) => ({
      name: cat.name,
      value: calculateCategoryTotal(cat),
    }));
    if (!state.eventInfo.venueIsFree && state.eventInfo.venueCost > 0) {
      data.unshift({ name: "Venue Rental", value: state.eventInfo.venueCost });
    }
    return data.filter((d: any) => d.value > 0);
  }, [state]);

  // Revenue bar data
  const revenueBarData = useMemo(() => {
    return state.boothTypes.map((bt: any) => ({
      name: bt.name,
      maxRevenue: bt.quantity * bt.sellingPrice,
      projectedRevenue: Math.round(bt.quantity * bt.sellingPrice * (state.fillRate / 100)),
    }));
  }, [state]);

  // P&L comparison
  const plData = useMemo(() => [
    { name: "Expenses", value: summary.totalExpenses, fill: "oklch(0.55 0.14 25)" },
    { name: "Revenue (Projected)", value: summary.projectedTotalRevenue, fill: "oklch(0.58 0.05 140)" },
  ], [summary]);

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Expenses" value={formatRupiah(summary.totalExpenses)} icon={DollarSign} color="terracotta" />
        <KPICard label="Booth Revenue" value={formatRupiah(summary.projectedBoothRevenue)} sub={`${state.fillRate}% fill rate`} icon={LayoutGrid} color="sage" />
        <KPICard label="Sponsor Revenue" value={formatRupiah(summary.totalSponsorRevenue)} icon={Handshake} color="warm-gold" />
        <KPICard label="Break-even" value={`${summary.breakEvenBooths} booths`} sub="needed to cover costs" icon={summary.projectedProfitLoss >= 0 ? CheckCircle2 : AlertTriangle}
          color={summary.projectedProfitLoss >= 0 ? "sage" : "destructive"} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown Pie */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h3 className="font-display text-lg font-bold text-charcoal mb-4">Expense Breakdown</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={expensePieData} cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2} dataKey="value"
                label={({ name, percent }) => `${name.split(" ")[0]} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                style={{ fontSize: "11px", fontFamily: "Source Sans 3" }}
              >
                {expensePieData.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatRupiah(value)} contentStyle={{ fontFamily: "Source Sans 3", fontSize: "13px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by Booth Type Bar */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h3 className="font-display text-lg font-bold text-charcoal mb-4">Revenue by Booth Type</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 70)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fontFamily: "Source Sans 3" }} />
              <YAxis tickFormatter={(v) => formatRupiahShort(v)} tick={{ fontSize: 11, fontFamily: "Source Sans 3" }} />
              <Tooltip formatter={(value: number) => formatRupiah(value)} contentStyle={{ fontFamily: "Source Sans 3", fontSize: "13px" }} />
              <Legend wrapperStyle={{ fontFamily: "Source Sans 3", fontSize: "12px" }} />
              <Bar dataKey="maxRevenue" name="Max Revenue (100%)" fill="oklch(0.58 0.05 140 / 0.3)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="projectedRevenue" name={`Projected (${state.fillRate}%)`} fill="oklch(0.58 0.05 140)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* P&L Summary Bar */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h3 className="font-display text-lg font-bold text-charcoal mb-4">Profit & Loss Comparison</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={plData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.01 70)" />
            <XAxis type="number" tickFormatter={(v) => formatRupiahShort(v)} tick={{ fontSize: 11, fontFamily: "Source Sans 3" }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fontFamily: "Source Sans 3" }} width={130} />
            <Tooltip formatter={(value: number) => formatRupiah(value)} contentStyle={{ fontFamily: "Source Sans 3", fontSize: "13px" }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {plData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Per-Booth Cost Analysis */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h3 className="font-display text-lg font-bold text-charcoal mb-4">Per-Booth Cost Analysis</h3>
        <div className="overflow-x-auto">
          <table className="w-full font-body text-sm">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-3 px-2 text-charcoal-light font-semibold">Booth Type</th>
                <th className="text-right py-3 px-2 text-charcoal-light font-semibold">Allocated Cost</th>
                <th className="text-right py-3 px-2 text-charcoal-light font-semibold">Selling Price</th>
                <th className="text-right py-3 px-2 text-charcoal-light font-semibold">Margin/Booth</th>
                <th className="text-right py-3 px-2 text-charcoal-light font-semibold">Margin %</th>
              </tr>
            </thead>
            <tbody>
              {summary.perBoothCosts.map((pbc) => (
                <tr key={pbc.boothTypeId} className="border-b border-border/50">
                  <td className="py-3 px-2 font-semibold text-charcoal">{pbc.boothTypeName}</td>
                  <td className="py-3 px-2 text-right text-charcoal">{formatRupiah(pbc.productionCost)}</td>
                  <td className="py-3 px-2 text-right text-charcoal">{formatRupiah(pbc.sellingPrice)}</td>
                  <td className={`py-3 px-2 text-right font-semibold ${pbc.marginPerBooth >= 0 ? "text-sage" : "text-destructive"}`}>
                    {formatRupiah(pbc.marginPerBooth)}
                  </td>
                  <td className={`py-3 px-2 text-right font-semibold ${pbc.marginPercent >= 0 ? "text-sage" : "text-destructive"}`}>
                    {pbc.marginPercent.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Expense Table */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h3 className="font-display text-lg font-bold text-charcoal mb-4">Detailed Expense Breakdown</h3>
        <div className="space-y-4">
          {state.expenses.map((cat: any) => {
            const catTotal = calculateCategoryTotal(cat);
            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between py-2 border-b-2 border-border">
                  <span className="font-body text-sm font-bold text-charcoal">{cat.name}</span>
                  <span className="font-body text-sm font-bold text-terracotta">{formatRupiah(catTotal)}</span>
                </div>
                {cat.items.map((item: any) => {
                  const sub = item.quantity * item.unitCost * item.frequency;
                  return (
                    <div key={item.id} className="flex items-center justify-between py-1.5 pl-4 text-xs font-body border-b border-border/30">
                      <span className="text-charcoal-light">{item.name} ({item.quantity} {item.unit} × {formatRupiah(item.unitCost)}{item.frequencyUnit === "day" ? ` × ${item.frequency} days` : ""})</span>
                      <span className="text-charcoal">{formatRupiah(sub)}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── What-If Tab ────────────────────────────────────────────

function WhatIfTab() {
  const { state } = useEvent();
  const [scenarioFillRate, setScenarioFillRate] = useState(state.fillRate);
  const [scenarioMainPrice, setScenarioMainPrice] = useState(state.boothTypes.find(b => b.id === "main")?.sellingPrice || 10000000);
  const [scenarioStdPrice, setScenarioStdPrice] = useState(state.boothTypes.find(b => b.id === "standard")?.sellingPrice || 7500000);
  const [scenarioPlatinum, setScenarioPlatinum] = useState(state.sponsorTiers.find(t => t.id === "platinum")?.expectedCount || 0);
  const [scenarioGold, setScenarioGold] = useState(state.sponsorTiers.find(t => t.id === "gold")?.expectedCount || 0);
  const [scenarioSilver, setScenarioSilver] = useState(state.sponsorTiers.find(t => t.id === "silver")?.expectedCount || 0);

  const totalExpenses = useMemo(() =>
    calculateTotalExpenses(state.expenses, state.eventInfo.venueIsFree ? 0 : state.eventInfo.venueCost, state.contingencyPercent),
    [state]
  );

  // Current scenario
  const currentBoothRevenue = calculateBoothRevenue(state.boothTypes, state.fillRate);
  const currentSponsorRevenue = calculateSponsorRevenue(state.sponsorTiers);
  const currentTotal = currentBoothRevenue.projectedRevenue + currentSponsorRevenue;
  const currentPL = currentTotal - totalExpenses.total;

  // What-if scenario
  const whatIfBoothTypes = state.boothTypes.map((bt: any) => ({
    ...bt,
    sellingPrice: bt.id === "main" ? scenarioMainPrice : bt.id === "standard" ? scenarioStdPrice : bt.sellingPrice,
  }));
  const whatIfBoothRevenue = calculateBoothRevenue(whatIfBoothTypes, scenarioFillRate);
  const whatIfSponsorTiers = state.sponsorTiers.map((t: any) => ({
    ...t,
    expectedCount: t.id === "platinum" ? scenarioPlatinum : t.id === "gold" ? scenarioGold : t.id === "silver" ? scenarioSilver : t.expectedCount,
  }));
  const whatIfSponsorRevenue = calculateSponsorRevenue(whatIfSponsorTiers);
  const whatIfTotal = whatIfBoothRevenue.projectedRevenue + whatIfSponsorRevenue;
  const whatIfPL = whatIfTotal - totalExpenses.total;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-charcoal mb-2">What-If Simulator</h2>
        <p className="font-body text-charcoal-light">Adjust parameters to see how changes affect your bottom line.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-border p-6 space-y-5">
            <h3 className="font-display text-lg font-bold text-charcoal">Adjust Parameters</h3>

            <div>
              <label className="block font-body text-sm font-semibold text-charcoal mb-2">Fill Rate: {scenarioFillRate}%</label>
              <input type="range" min={30} max={100} step={5} value={scenarioFillRate}
                onChange={(e) => setScenarioFillRate(parseInt(e.target.value))}
                className="w-full accent-terracotta"
              />
            </div>

            {state.boothTypes.find((b: any) => b.id === "main") && (
              <div>
                <label className="block font-body text-sm font-semibold text-charcoal mb-2">Main Booth Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm text-charcoal-light">Rp</span>
                  <input type="text" value={new Intl.NumberFormat("id-ID").format(scenarioMainPrice)}
                    onChange={(e) => setScenarioMainPrice(parseInt(e.target.value.replace(/\D/g, "")) || 0)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-white font-body text-charcoal focus:border-terracotta focus:outline-none"
                  />
                </div>
              </div>
            )}

            {state.boothTypes.find((b: any) => b.id === "standard") && (
              <div>
                <label className="block font-body text-sm font-semibold text-charcoal mb-2">Standard Booth Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm text-charcoal-light">Rp</span>
                  <input type="text" value={new Intl.NumberFormat("id-ID").format(scenarioStdPrice)}
                    onChange={(e) => setScenarioStdPrice(parseInt(e.target.value.replace(/\D/g, "")) || 0)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-white font-body text-charcoal focus:border-terracotta focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-body text-xs font-semibold text-charcoal mb-1">Platinum Sponsors</label>
                <input type="number" min={0} max={10} value={scenarioPlatinum}
                  onChange={(e) => setScenarioPlatinum(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-white font-body text-sm text-charcoal focus:border-terracotta focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-body text-xs font-semibold text-charcoal mb-1">Gold Sponsors</label>
                <input type="number" min={0} max={10} value={scenarioGold}
                  onChange={(e) => setScenarioGold(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-white font-body text-sm text-charcoal focus:border-terracotta focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-body text-xs font-semibold text-charcoal mb-1">Silver Sponsors</label>
                <input type="number" min={0} max={10} value={scenarioSilver}
                  onChange={(e) => setScenarioSilver(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-white font-body text-sm text-charcoal focus:border-terracotta focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Comparison */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="font-display text-lg font-bold text-charcoal mb-4">Comparison</h3>
            <table className="w-full font-body text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left py-2 text-charcoal-light font-semibold"></th>
                  <th className="text-right py-2 text-charcoal-light font-semibold">Current</th>
                  <th className="text-right py-2 text-charcoal-light font-semibold">What-If</th>
                  <th className="text-right py-2 text-charcoal-light font-semibold">Diff</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-2 text-charcoal">Booth Revenue</td>
                  <td className="py-2 text-right text-charcoal">{formatRupiahShort(currentBoothRevenue.projectedRevenue)}</td>
                  <td className="py-2 text-right text-charcoal">{formatRupiahShort(whatIfBoothRevenue.projectedRevenue)}</td>
                  <td className={`py-2 text-right font-semibold ${whatIfBoothRevenue.projectedRevenue - currentBoothRevenue.projectedRevenue >= 0 ? "text-sage" : "text-destructive"}`}>
                    {formatRupiahShort(whatIfBoothRevenue.projectedRevenue - currentBoothRevenue.projectedRevenue)}
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 text-charcoal">Sponsor Revenue</td>
                  <td className="py-2 text-right text-charcoal">{formatRupiahShort(currentSponsorRevenue)}</td>
                  <td className="py-2 text-right text-charcoal">{formatRupiahShort(whatIfSponsorRevenue)}</td>
                  <td className={`py-2 text-right font-semibold ${whatIfSponsorRevenue - currentSponsorRevenue >= 0 ? "text-sage" : "text-destructive"}`}>
                    {formatRupiahShort(whatIfSponsorRevenue - currentSponsorRevenue)}
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 text-charcoal">Total Revenue</td>
                  <td className="py-2 text-right text-charcoal">{formatRupiahShort(currentTotal)}</td>
                  <td className="py-2 text-right text-charcoal">{formatRupiahShort(whatIfTotal)}</td>
                  <td className={`py-2 text-right font-semibold ${whatIfTotal - currentTotal >= 0 ? "text-sage" : "text-destructive"}`}>
                    {formatRupiahShort(whatIfTotal - currentTotal)}
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 text-charcoal">Total Expenses</td>
                  <td className="py-2 text-right text-charcoal" colSpan={2}>{formatRupiahShort(totalExpenses.total)}</td>
                  <td className="py-2 text-right text-charcoal-light">—</td>
                </tr>
                <tr>
                  <td className="py-3 font-bold text-charcoal">Profit / Loss</td>
                  <td className={`py-3 text-right font-bold ${currentPL >= 0 ? "text-sage" : "text-destructive"}`}>{formatRupiah(currentPL)}</td>
                  <td className={`py-3 text-right font-bold ${whatIfPL >= 0 ? "text-sage" : "text-destructive"}`}>{formatRupiah(whatIfPL)}</td>
                  <td className={`py-3 text-right font-bold ${whatIfPL - currentPL >= 0 ? "text-sage" : "text-destructive"}`}>
                    {formatRupiah(whatIfPL - currentPL)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Visual indicator */}
          <div className={`rounded-xl p-6 text-center ${whatIfPL >= 0 ? "bg-sage/10" : "bg-destructive/10"}`}>
            {whatIfPL >= 0 ? (
              <>
                <CheckCircle2 className="w-8 h-8 text-sage mx-auto mb-2" />
                <p className="font-display text-xl font-bold text-sage">Profitable Scenario</p>
                <p className="font-body text-sm text-charcoal-light mt-1">Margin: {totalExpenses.total > 0 ? ((whatIfPL / totalExpenses.total) * 100).toFixed(1) : 0}%</p>
              </>
            ) : (
              <>
                <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
                <p className="font-display text-xl font-bold text-destructive">Deficit Scenario</p>
                <p className="font-body text-sm text-charcoal-light mt-1">Need {formatRupiah(Math.abs(whatIfPL))} more revenue</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Reverse Calculator Tab ─────────────────────────────────

function ReverseTab() {
  const { state } = useEvent();
  const [targetMargin, setTargetMargin] = useState(state.targetProfitMargin);
  const [useCurrentSponsors, setUseCurrentSponsors] = useState(true);

  const totalExpenses = useMemo(() =>
    calculateTotalExpenses(state.expenses, state.eventInfo.venueIsFree ? 0 : state.eventInfo.venueCost, state.contingencyPercent),
    [state]
  );

  const sponsorRevenue = useCurrentSponsors ? calculateSponsorRevenue(state.sponsorTiers) : 0;

  const result = useMemo(() =>
    reverseCalculate(totalExpenses.total, targetMargin, state.boothTypes, state.fillRate, sponsorRevenue),
    [totalExpenses, targetMargin, state.boothTypes, state.fillRate, sponsorRevenue]
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-charcoal mb-2">Reverse Calculator</h2>
        <p className="font-body text-charcoal-light">Set your target profit margin and the system will calculate the required booth pricing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="bg-white rounded-xl border border-border p-6 space-y-6">
          <h3 className="font-display text-lg font-bold text-charcoal">Your Target</h3>

          <div>
            <label className="block font-body text-sm font-semibold text-charcoal mb-2">Target Profit Margin: {targetMargin}%</label>
            <input type="range" min={-20} max={50} step={5} value={targetMargin}
              onChange={(e) => setTargetMargin(parseInt(e.target.value))}
              className="w-full accent-terracotta"
            />
            <div className="flex justify-between font-body text-xs text-charcoal-light mt-1">
              <span>-20% (loss)</span>
              <span>0% (break-even)</span>
              <span>50% (high profit)</span>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={useCurrentSponsors}
                onChange={(e) => setUseCurrentSponsors(e.target.checked)}
                className="w-5 h-5 rounded border-border text-terracotta focus:ring-terracotta"
              />
              <span className="font-body text-sm text-charcoal">Include current sponsor revenue ({formatRupiah(calculateSponsorRevenue(state.sponsorTiers))})</span>
            </label>
          </div>

          <div className="bg-paper-dark rounded-lg p-4 space-y-2 font-body text-sm">
            <div className="flex justify-between">
              <span className="text-charcoal-light">Total Expenses:</span>
              <span className="font-semibold text-charcoal">{formatRupiah(totalExpenses.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-light">Current Fill Rate:</span>
              <span className="font-semibold text-charcoal">{state.fillRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-light">Sponsor Revenue:</span>
              <span className="font-semibold text-charcoal">{formatRupiah(sponsorRevenue)}</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="bg-terracotta/5 rounded-xl border border-terracotta/20 p-6 space-y-4">
            <h3 className="font-display text-lg font-bold text-charcoal">Required Revenue</h3>
            <p className="font-display text-3xl font-bold text-terracotta">{formatRupiah(result.requiredRevenue)}</p>
            <p className="font-body text-sm text-charcoal-light">
              To achieve {targetMargin}% profit margin on {formatRupiah(totalExpenses.total)} expenses
            </p>
          </div>

          <div className="bg-white rounded-xl border border-border p-6 space-y-4">
            <h3 className="font-display text-lg font-bold text-charcoal">Suggested Booth Pricing</h3>
            <div className="space-y-3">
              {state.boothTypes.find((b: any) => b.id === "main") && (
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div>
                    <p className="font-body text-sm font-semibold text-charcoal">Main Booth</p>
                    <p className="font-body text-xs text-charcoal-light">Current: {formatRupiah(state.boothTypes.find((b: any) => b.id === "main")!.sellingPrice)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl font-bold text-sage">{formatRupiah(result.suggestedMainPrice)}</p>
                    <p className="font-body text-xs text-charcoal-light">
                      {result.suggestedMainPrice > (state.boothTypes.find((b: any) => b.id === "main")?.sellingPrice || 0) ? "↑ increase" : "↓ or same"}
                    </p>
                  </div>
                </div>
              )}
              {state.boothTypes.find((b: any) => b.id === "standard") && (
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-body text-sm font-semibold text-charcoal">Standard Booth</p>
                    <p className="font-body text-xs text-charcoal-light">Current: {formatRupiah(state.boothTypes.find((b: any) => b.id === "standard")!.sellingPrice)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl font-bold text-sage">{formatRupiah(result.suggestedStandardPrice)}</p>
                    <p className="font-body text-xs text-charcoal-light">
                      {result.suggestedStandardPrice > (state.boothTypes.find((b: any) => b.id === "standard")?.sellingPrice || 0) ? "↑ increase" : "↓ or same"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-paper-dark rounded-xl p-4 text-center">
            <p className="font-body text-xs text-charcoal-light">Prices are rounded up to the nearest Rp 500,000 for practical pricing.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared Components ──────────────────────────────────────

function KPICard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string; icon: any; color: string;
}) {
  return (
    <motion.div
      className="bg-white rounded-xl border border-border p-5 space-y-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`w-9 h-9 rounded-lg bg-${color}/10 flex items-center justify-center`}>
        <Icon className={`w-4.5 h-4.5 text-${color}`} />
      </div>
      <p className="font-body text-xs text-charcoal-light">{label}</p>
      <p className="font-display text-xl font-bold text-charcoal leading-tight">{value}</p>
      {sub && <p className="font-body text-[10px] text-charcoal-light">{sub}</p>}
    </motion.div>
  );
}
