/**
 * Planner Page — Multi-step Event Configuration Wizard
 *
 * Design: "Event Canvas" — Warm Editorial / Magazine Spread
 * Steps: 1) Event Info  2) Booth Config  3) Sponsors  4) Expenses  5) Review → Dashboard
 */

import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useEvent } from "@/contexts/EventContext";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, Check, Building2, LayoutGrid, Handshake,
  Receipt, ClipboardCheck, Calendar, Plus, Trash2, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  formatRupiah, formatNumber, parseRupiahInput,
  calculateBoothArea, calculateExpenseItemSubtotal, calculateCategoryTotal,
  calculateTotalExpenses, calculateBoothRevenue, calculateSponsorRevenue,
  type ExpenseItem,
} from "@/lib/financialPlanner";

const STEPS = [
  { id: 0, label: "Event Info", icon: Calendar, desc: "Basic details" },
  { id: 1, label: "Booths", icon: LayoutGrid, desc: "Configure booths" },
  { id: 2, label: "Sponsors", icon: Handshake, desc: "Sponsorship tiers" },
  { id: 3, label: "Expenses", icon: Receipt, desc: "Cost breakdown" },
  { id: 4, label: "Review", icon: ClipboardCheck, desc: "Final check" },
];

export default function Planner() {
  const { state, dispatch } = useEvent();
  const [, navigate] = useLocation();
  const step = state.currentStep;

  const goNext = () => {
    if (step < STEPS.length - 1) dispatch({ type: "SET_STEP", step: step + 1 });
  };
  const goBack = () => {
    if (step > 0) dispatch({ type: "SET_STEP", step: step - 1 });
  };
  const goToDashboard = () => {
    dispatch({ type: "MARK_COMPLETE" });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-paper paper-texture">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-paper/80 backdrop-blur-md border-b border-border/50">
        <div className="container flex items-center justify-between h-14">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <div className="w-7 h-7 rounded-sm bg-terracotta flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-base text-charcoal tracking-tight">JobFair Planner</span>
          </button>
          <span className="font-body text-sm text-charcoal-light">Step {step + 1} of {STEPS.length}</span>
        
          <button onClick={() => navigate("/boss")}
            style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.3)", color: "#D4A017", borderRadius: 8, padding: "0.4rem 0.9rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
            Panel Panitia
          </button>
          </div>
      </nav>

      {/* Step Indicator */}
      <div className="pt-14">
        <div className="container py-6">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <button
                  onClick={() => dispatch({ type: "SET_STEP", step: i })}
                  className={`flex flex-col items-center gap-1 transition-all ${
                    i === step ? "opacity-100" : i < step ? "opacity-70" : "opacity-30"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-body font-semibold transition-colors ${
                    i < step ? "bg-sage text-white" : i === step ? "bg-terracotta text-white" : "bg-paper-dark text-charcoal-light"
                  }`}>
                    {i < step ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                  </div>
                  <span className="font-body text-xs text-charcoal hidden sm:block">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 sm:w-16 h-0.5 mx-1 sm:mx-2 transition-colors ${i < step ? "bg-sage" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="container pb-32">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {step === 0 && <StepEventInfo />}
              {step === 1 && <StepBooths />}
              {step === 2 && <StepSponsors />}
              {step === 3 && <StepExpenses />}
              {step === 4 && <StepReview />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-border/50 z-50">
        <div className="container py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <Button variant="outline" onClick={goBack} disabled={step === 0} className="gap-2 font-body">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={goNext} className="gap-2 font-body bg-terracotta hover:bg-terracotta/90 text-white">
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={goToDashboard} className="gap-2 font-body bg-sage hover:bg-sage/90 text-white">
                <ClipboardCheck className="w-4 h-4" /> View Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step Components ────────────────────────────────────────

function StepEventInfo() {
  const { state, dispatch } = useEvent();
  const info = state.eventInfo;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl font-bold text-charcoal mb-2">Event Information</h2>
        <div className="editorial-rule w-16 rounded-full mb-4" />
        <p className="font-body text-charcoal-light">Basic details about the job fair event and venue.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField label="Event Name" value={info.eventName} placeholder="e.g., Grand Recruitment 2026"
          onChange={(v) => dispatch({ type: "UPDATE_EVENT_INFO", info: { eventName: v } })} />
        <InputField label="Client / Organization" value={info.clientName} placeholder="e.g., Koperasi Poltekpar NHI"
          onChange={(v) => dispatch({ type: "UPDATE_EVENT_INFO", info: { clientName: v } })} />
        <InputField label="Venue Name" value={info.venueName} placeholder="e.g., Gedung Graha I Gede Ardika (Dome)"
          onChange={(v) => dispatch({ type: "UPDATE_EVENT_INFO", info: { venueName: v } })} />
        <div>
          <label className="block font-body text-sm font-semibold text-charcoal mb-2">Event Duration (days)</label>
          <input type="number" min={1} max={7} value={info.eventDuration}
            onChange={(e) => dispatch({ type: "UPDATE_EVENT_INFO", info: { eventDuration: Math.max(1, parseInt(e.target.value) || 1) } })}
            className="w-full px-4 py-3 rounded-lg border-2 border-border bg-white font-body text-charcoal focus:border-terracotta focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-6 space-y-4">
        <h3 className="font-display text-lg font-bold text-charcoal">Venue Cost</h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={info.venueIsFree}
            onChange={(e) => dispatch({ type: "UPDATE_EVENT_INFO", info: { venueIsFree: e.target.checked, venueCost: e.target.checked ? 0 : info.venueCost } })}
            className="w-5 h-5 rounded border-border text-terracotta focus:ring-terracotta"
          />
          <span className="font-body text-charcoal">Venue is provided free by the client / institution</span>
        </label>
        {!info.venueIsFree && (
          <RupiahInput label="Venue Rental Cost" value={info.venueCost}
            onChange={(v) => dispatch({ type: "UPDATE_EVENT_INFO", info: { venueCost: v } })} />
        )}
      </div>
    </div>
  );
}

function StepBooths() {
  const { state, dispatch } = useEvent();

  const addBoothType = () => {
    const id = `custom-${Date.now()}`;
    dispatch({
      type: "ADD_BOOTH_TYPE",
      boothType: {
        id, name: "Custom Booth", width: 3, height: 3, area: 9,
        quantity: 10, costPerSqm: 100000, productionCostPerBooth: 900000,
        sellingPrice: 5000000, facilities: "",
      },
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl font-bold text-charcoal mb-2">Booth Configuration</h2>
        <div className="editorial-rule w-16 rounded-full mb-4" />
        <p className="font-body text-charcoal-light">Configure booth types, dimensions, quantities, and pricing. Cost per m² is used to calculate your production cost per booth.</p>
      </div>

      {state.boothTypes.map((bt) => (
        <BoothTypeCard key={bt.id} booth={bt} onUpdate={(updates) => dispatch({ type: "UPDATE_BOOTH_TYPE", id: bt.id, updates })}
          onRemove={state.boothTypes.length > 1 ? () => dispatch({ type: "REMOVE_BOOTH_TYPE", id: bt.id }) : undefined} />
      ))}

      <button onClick={addBoothType}
        className="w-full py-4 rounded-xl border-2 border-dashed border-border hover:border-terracotta/50 flex items-center justify-center gap-2 font-body text-charcoal-light hover:text-terracotta transition-colors">
        <Plus className="w-4 h-4" /> Add Booth Type
      </button>

      <div className="bg-white rounded-xl border border-border p-6 space-y-4">
        <h3 className="font-display text-lg font-bold text-charcoal">Interview Booths</h3>
        <p className="font-body text-sm text-charcoal-light">Free service booths for employer interviews (not sold separately). Max 2 hours per company per day.</p>
        <div className="flex items-center gap-4">
          <label className="font-body text-sm font-semibold text-charcoal">Number of Interview Booths:</label>
          <input type="number" min={0} max={30} value={state.interviewBooths}
            onChange={(e) => dispatch({ type: "SET_INTERVIEW_BOOTHS", count: Math.max(0, parseInt(e.target.value) || 0) })}
            className="w-24 px-3 py-2 rounded-lg border-2 border-border bg-white font-body text-charcoal focus:border-terracotta focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Fill Rate */}
      <div className="bg-white rounded-xl border border-border p-6 space-y-4">
        <h3 className="font-display text-lg font-bold text-charcoal">Expected Fill Rate</h3>
        <p className="font-body text-sm text-charcoal-light">What percentage of booths do you expect to sell?</p>
        <div className="flex items-center gap-4">
          <input type="range" min={30} max={100} step={5} value={state.fillRate}
            onChange={(e) => dispatch({ type: "SET_FILL_RATE", rate: parseInt(e.target.value) })}
            className="flex-1 accent-terracotta"
          />
          <span className="font-display text-2xl font-bold text-terracotta w-16 text-right">{state.fillRate}%</span>
        </div>
      </div>
    </div>
  );
}

function BoothTypeCard({ booth, onUpdate, onRemove }: {
  booth: import("@/lib/financialPlanner").BoothType;
  onUpdate: (updates: Partial<import("@/lib/financialPlanner").BoothType>) => void;
  onRemove?: () => void;
}) {
  const area = calculateBoothArea(booth.width, booth.height);
  const prodCost = area * booth.costPerSqm;

  return (
    <div className="bg-white rounded-xl border border-border p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-terracotta/10 flex items-center justify-center">
            <LayoutGrid className="w-5 h-5 text-terracotta" />
          </div>
          <input type="text" value={booth.name} onChange={(e) => onUpdate({ name: e.target.value })}
            className="font-display text-xl font-bold text-charcoal bg-transparent border-none focus:outline-none focus:underline decoration-terracotta"
          />
        </div>
        {onRemove && (
          <button onClick={onRemove} className="p-2 rounded-lg hover:bg-destructive/10 text-charcoal-light hover:text-destructive transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block font-body text-xs font-semibold text-charcoal-light mb-1">Width (m)</label>
          <input type="number" min={1} max={20} step={0.5} value={booth.width}
            onChange={(e) => {
              const w = parseFloat(e.target.value) || 1;
              onUpdate({ width: w, area: calculateBoothArea(w, booth.height), productionCostPerBooth: calculateBoothArea(w, booth.height) * booth.costPerSqm });
            }}
            className="w-full px-3 py-2 rounded-lg border border-border bg-white font-body text-sm text-charcoal focus:border-terracotta focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-body text-xs font-semibold text-charcoal-light mb-1">Height (m)</label>
          <input type="number" min={1} max={20} step={0.5} value={booth.height}
            onChange={(e) => {
              const h = parseFloat(e.target.value) || 1;
              onUpdate({ height: h, area: calculateBoothArea(booth.width, h), productionCostPerBooth: calculateBoothArea(booth.width, h) * booth.costPerSqm });
            }}
            className="w-full px-3 py-2 rounded-lg border border-border bg-white font-body text-sm text-charcoal focus:border-terracotta focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-body text-xs font-semibold text-charcoal-light mb-1">Quantity</label>
          <input type="number" min={1} max={100} value={booth.quantity}
            onChange={(e) => onUpdate({ quantity: Math.max(1, parseInt(e.target.value) || 1) })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-white font-body text-sm text-charcoal focus:border-terracotta focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-body text-xs font-semibold text-charcoal-light mb-1">Cost/m² (Rp)</label>
          <input type="text" value={formatNumber(String(booth.costPerSqm))}
            onChange={(e) => {
              const v = parseRupiahInput(e.target.value);
              onUpdate({ costPerSqm: v, productionCostPerBooth: area * v });
            }}
            className="w-full px-3 py-2 rounded-lg border border-border bg-white font-body text-sm text-charcoal focus:border-terracotta focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm font-body">
        <div className="px-3 py-1.5 rounded-full bg-paper-dark">
          <span className="text-charcoal-light">Area: </span>
          <span className="font-semibold text-charcoal">{area} m²</span>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-paper-dark">
          <span className="text-charcoal-light">Production/booth: </span>
          <span className="font-semibold text-charcoal">{formatRupiah(prodCost)}</span>
        </div>
      </div>

      <div>
        <label className="block font-body text-xs font-semibold text-charcoal-light mb-1">Selling Price per Booth (Rp)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm text-charcoal-light">Rp</span>
          <input type="text" value={formatNumber(String(booth.sellingPrice))}
            onChange={(e) => onUpdate({ sellingPrice: parseRupiahInput(e.target.value) })}
            className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-border bg-white font-display text-xl font-bold text-charcoal focus:border-terracotta focus:outline-none"
          />
        </div>
        <p className="mt-1 font-body text-xs text-charcoal-light">
          Margin per booth: <span className={`font-semibold ${booth.sellingPrice - prodCost >= 0 ? "text-sage" : "text-destructive"}`}>
            {formatRupiah(booth.sellingPrice - prodCost)}
          </span>
        </p>
      </div>
    </div>
  );
}

function StepSponsors() {
  const { state, dispatch } = useEvent();

  const addTier = () => {
    const id = `custom-${Date.now()}`;
    dispatch({
      type: "ADD_SPONSOR_TIER",
      tier: { id, name: "Custom Tier", pricePerSponsor: 10000000, expectedCount: 0, benefits: "" },
    });
  };

  const totalSponsor = calculateSponsorRevenue(state.sponsorTiers);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl font-bold text-charcoal mb-2">Sponsorship</h2>
        <div className="editorial-rule w-16 rounded-full mb-4" />
        <p className="font-body text-charcoal-light">Configure sponsorship tiers and expected number of sponsors.</p>
      </div>

      {state.sponsorTiers.map((tier) => (
        <div key={tier.id} className="bg-white rounded-xl border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <input type="text" value={tier.name}
              onChange={(e) => dispatch({ type: "UPDATE_SPONSOR_TIER", id: tier.id, updates: { name: e.target.value } })}
              className="font-display text-xl font-bold text-charcoal bg-transparent border-none focus:outline-none focus:underline decoration-terracotta"
            />
            {state.sponsorTiers.length > 1 && (
              <button onClick={() => dispatch({ type: "REMOVE_SPONSOR_TIER", id: tier.id })}
                className="p-2 rounded-lg hover:bg-destructive/10 text-charcoal-light hover:text-destructive transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RupiahInput label="Price per Sponsor" value={tier.pricePerSponsor}
              onChange={(v) => dispatch({ type: "UPDATE_SPONSOR_TIER", id: tier.id, updates: { pricePerSponsor: v } })} />
            <div>
              <label className="block font-body text-sm font-semibold text-charcoal mb-2">Expected Sponsors</label>
              <input type="number" min={0} max={50} value={tier.expectedCount}
                onChange={(e) => dispatch({ type: "UPDATE_SPONSOR_TIER", id: tier.id, updates: { expectedCount: Math.max(0, parseInt(e.target.value) || 0) } })}
                className="w-full px-4 py-3 rounded-lg border-2 border-border bg-white font-body text-charcoal focus:border-terracotta focus:outline-none transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block font-body text-xs font-semibold text-charcoal-light mb-1">Benefits</label>
            <textarea value={tier.benefits} rows={2}
              onChange={(e) => dispatch({ type: "UPDATE_SPONSOR_TIER", id: tier.id, updates: { benefits: e.target.value } })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-white font-body text-sm text-charcoal focus:border-terracotta focus:outline-none resize-none"
            />
          </div>
          <p className="font-body text-sm text-charcoal-light">
            Subtotal: <span className="font-semibold text-charcoal">{formatRupiah(tier.pricePerSponsor * tier.expectedCount)}</span>
          </p>
        </div>
      ))}

      <button onClick={addTier}
        className="w-full py-4 rounded-xl border-2 border-dashed border-border hover:border-terracotta/50 flex items-center justify-center gap-2 font-body text-charcoal-light hover:text-terracotta transition-colors">
        <Plus className="w-4 h-4" /> Add Sponsor Tier
      </button>

      <div className="bg-sage/10 rounded-xl p-6 text-center">
        <p className="font-body text-sm text-charcoal-light mb-1">Total Expected Sponsorship Revenue</p>
        <p className="font-display text-3xl font-bold text-sage">{formatRupiah(totalSponsor)}</p>
      </div>
    </div>
  );
}

function StepExpenses() {
  const { state, dispatch } = useEvent();
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const toggleCat = (id: string) => setExpandedCat(expandedCat === id ? null : id);

  const totalExpenses = calculateTotalExpenses(
    state.expenses,
    state.eventInfo.venueIsFree ? 0 : state.eventInfo.venueCost,
    state.contingencyPercent
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-bold text-charcoal mb-2">Expense Breakdown</h2>
        <div className="editorial-rule w-16 rounded-full mb-4" />
        <p className="font-body text-charcoal-light">Edit quantities and unit costs for each expense item. All items are fully customizable.</p>
      </div>

      {/* Venue cost reminder */}
      {!state.eventInfo.venueIsFree && state.eventInfo.venueCost > 0 && (
        <div className="bg-warm-gold/10 rounded-xl p-4 flex items-center gap-3">
          <Building2 className="w-5 h-5 text-warm-gold shrink-0" />
          <p className="font-body text-sm text-charcoal">Venue cost: <span className="font-semibold">{formatRupiah(state.eventInfo.venueCost)}</span> (included in total)</p>
        </div>
      )}

      {state.expenses.map((cat) => {
        const catTotal = calculateCategoryTotal(cat);
        const isExpanded = expandedCat === cat.id;

        return (
          <div key={cat.id} className="bg-white rounded-xl border border-border overflow-hidden">
            <button onClick={() => toggleCat(cat.id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-paper-dark/30 transition-colors">
              <div className="flex items-center gap-3">
                <span className="font-display text-lg font-bold text-charcoal">{cat.name}</span>
                <span className="font-body text-xs text-charcoal-light bg-paper-dark px-2 py-0.5 rounded-full">{cat.items.length} items</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display text-lg font-bold text-terracotta">{formatRupiah(catTotal)}</span>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-charcoal-light" /> : <ChevronDown className="w-4 h-4 text-charcoal-light" />}
              </div>
            </button>

            {isExpanded && (
              <div className="px-6 pb-4 space-y-3 border-t border-border/50">
                {cat.items.map((item) => (
                  <ExpenseItemRow key={item.id} item={item} categoryId={cat.id} eventDuration={state.eventInfo.eventDuration} />
                ))}
                <button onClick={() => {
                  const newItem: ExpenseItem = {
                    id: `custom-${Date.now()}`, name: "New Item", description: "", quantity: 1, unit: "pcs",
                    unitCost: 0, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true,
                  };
                  dispatch({ type: "ADD_EXPENSE_ITEM", categoryId: cat.id, item: newItem });
                }}
                  className="w-full py-2 rounded-lg border border-dashed border-border hover:border-terracotta/50 flex items-center justify-center gap-2 font-body text-xs text-charcoal-light hover:text-terracotta transition-colors">
                  <Plus className="w-3 h-3" /> Add Item
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Contingency */}
      <div className="bg-white rounded-xl border border-border p-6 space-y-4">
        <h3 className="font-display text-lg font-bold text-charcoal">Contingency Fund</h3>
        <div className="flex items-center gap-4">
          <input type="range" min={0} max={15} step={1} value={state.contingencyPercent}
            onChange={(e) => dispatch({ type: "SET_CONTINGENCY", percent: parseInt(e.target.value) })}
            className="flex-1 accent-terracotta"
          />
          <span className="font-display text-xl font-bold text-terracotta w-12 text-right">{state.contingencyPercent}%</span>
        </div>
        <p className="font-body text-sm text-charcoal-light">
          Contingency amount: <span className="font-semibold text-charcoal">{formatRupiah(totalExpenses.contingency)}</span>
        </p>
      </div>

      {/* Total */}
      <div className="bg-charcoal rounded-xl p-6 text-center">
        <p className="font-body text-sm text-white/60 mb-1">Total Expenses (incl. contingency)</p>
        <p className="font-display text-3xl font-bold text-white">{formatRupiah(totalExpenses.total)}</p>
      </div>
    </div>
  );
}

function ExpenseItemRow({ item, categoryId, eventDuration }: { item: ExpenseItem; categoryId: string; eventDuration: number }) {
  const { dispatch } = useEvent();
  const subtotal = calculateExpenseItemSubtotal(item);

  return (
    <div className="pt-3 space-y-2">
      <div className="flex items-center justify-between">
        <input type="text" value={item.name}
          onChange={(e) => dispatch({ type: "UPDATE_EXPENSE_ITEM", categoryId, itemId: item.id, updates: { name: e.target.value } })}
          className="font-body text-sm font-semibold text-charcoal bg-transparent border-none focus:outline-none focus:underline decoration-terracotta"
        />
        <div className="flex items-center gap-2">
          <span className="font-body text-sm font-semibold text-charcoal">{formatRupiah(subtotal)}</span>
          <button onClick={() => dispatch({ type: "REMOVE_EXPENSE_ITEM", categoryId, itemId: item.id })}
            className="p-1 rounded hover:bg-destructive/10 text-charcoal-light hover:text-destructive transition-colors">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="block font-body text-[10px] text-charcoal-light mb-0.5">Qty</label>
          <input type="number" min={0} value={item.quantity}
            onChange={(e) => dispatch({ type: "UPDATE_EXPENSE_ITEM", categoryId, itemId: item.id, updates: { quantity: Math.max(0, parseInt(e.target.value) || 0) } })}
            className="w-full px-2 py-1.5 rounded border border-border bg-white font-body text-xs text-charcoal focus:border-terracotta focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-body text-[10px] text-charcoal-light mb-0.5">Unit</label>
          <input type="text" value={item.unit}
            onChange={(e) => dispatch({ type: "UPDATE_EXPENSE_ITEM", categoryId, itemId: item.id, updates: { unit: e.target.value } })}
            className="w-full px-2 py-1.5 rounded border border-border bg-white font-body text-xs text-charcoal focus:border-terracotta focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-body text-[10px] text-charcoal-light mb-0.5">Unit Cost</label>
          <input type="text" value={formatNumber(String(item.unitCost))}
            onChange={(e) => dispatch({ type: "UPDATE_EXPENSE_ITEM", categoryId, itemId: item.id, updates: { unitCost: parseRupiahInput(e.target.value) } })}
            className="w-full px-2 py-1.5 rounded border border-border bg-white font-body text-xs text-charcoal focus:border-terracotta focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-body text-[10px] text-charcoal-light mb-0.5">× Days</label>
          <select value={item.frequencyUnit}
            onChange={(e) => {
              const fu = e.target.value;
              dispatch({ type: "UPDATE_EXPENSE_ITEM", categoryId, itemId: item.id, updates: { frequencyUnit: fu, frequency: fu === "day" ? eventDuration : 1 } });
            }}
            className="w-full px-2 py-1.5 rounded border border-border bg-white font-body text-xs text-charcoal focus:border-terracotta focus:outline-none"
          >
            <option value="event">Per event</option>
            <option value="day">Per day (×{eventDuration})</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function StepReview() {
  const { state } = useEvent();

  const totalExpenses = calculateTotalExpenses(
    state.expenses,
    state.eventInfo.venueIsFree ? 0 : state.eventInfo.venueCost,
    state.contingencyPercent
  );
  const boothRevenue = calculateBoothRevenue(state.boothTypes, state.fillRate);
  const sponsorRevenue = calculateSponsorRevenue(state.sponsorTiers);
  const projectedTotal = boothRevenue.projectedRevenue + sponsorRevenue;
  const gap = projectedTotal - totalExpenses.total;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl font-bold text-charcoal mb-2">Review & Confirm</h2>
        <div className="editorial-rule w-16 rounded-full mb-4" />
        <p className="font-body text-charcoal-light">Review your event configuration before viewing the full dashboard.</p>
      </div>

      {/* Event Info Summary */}
      <div className="bg-white rounded-xl border border-border p-6 space-y-3">
        <h3 className="font-display text-lg font-bold text-charcoal">Event Details</h3>
        <div className="grid grid-cols-2 gap-3 font-body text-sm">
          <div><span className="text-charcoal-light">Event: </span><span className="font-semibold text-charcoal">{state.eventInfo.eventName || "—"}</span></div>
          <div><span className="text-charcoal-light">Client: </span><span className="font-semibold text-charcoal">{state.eventInfo.clientName || "—"}</span></div>
          <div><span className="text-charcoal-light">Venue: </span><span className="font-semibold text-charcoal">{state.eventInfo.venueName || "—"}</span></div>
          <div><span className="text-charcoal-light">Duration: </span><span className="font-semibold text-charcoal">{state.eventInfo.eventDuration} day(s)</span></div>
          <div><span className="text-charcoal-light">Venue Cost: </span><span className="font-semibold text-charcoal">{state.eventInfo.venueIsFree ? "Free" : formatRupiah(state.eventInfo.venueCost)}</span></div>
        </div>
      </div>

      {/* Booths Summary */}
      <div className="bg-white rounded-xl border border-border p-6 space-y-3">
        <h3 className="font-display text-lg font-bold text-charcoal">Booths</h3>
        {state.boothTypes.map((bt) => (
          <div key={bt.id} className="flex items-center justify-between font-body text-sm py-1 border-b border-border/30 last:border-0">
            <span className="text-charcoal">{bt.name} ({bt.width}×{bt.height}m²) × {bt.quantity}</span>
            <span className="font-semibold text-charcoal">{formatRupiah(bt.sellingPrice)}/booth</span>
          </div>
        ))}
        <div className="flex items-center justify-between font-body text-sm text-charcoal-light">
          <span>Interview Booths: {state.interviewBooths} (free service)</span>
          <span>Fill Rate: {state.fillRate}%</span>
        </div>
      </div>

      {/* Financial Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-border p-5 text-center">
          <p className="font-body text-xs text-charcoal-light mb-1">Total Expenses</p>
          <p className="font-display text-2xl font-bold text-charcoal">{formatRupiah(totalExpenses.total)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-5 text-center">
          <p className="font-body text-xs text-charcoal-light mb-1">Projected Revenue</p>
          <p className="font-display text-2xl font-bold text-sage">{formatRupiah(projectedTotal)}</p>
        </div>
        <div className={`rounded-xl border p-5 text-center ${gap >= 0 ? "bg-sage/10 border-sage/30" : "bg-destructive/10 border-destructive/30"}`}>
          <p className="font-body text-xs text-charcoal-light mb-1">{gap >= 0 ? "Projected Surplus" : "Projected Deficit"}</p>
          <p className={`font-display text-2xl font-bold ${gap >= 0 ? "text-sage" : "text-destructive"}`}>{formatRupiah(Math.abs(gap))}</p>
        </div>
      </div>

      <div className="bg-terracotta/5 rounded-xl p-6 text-center">
        <p className="font-body text-charcoal">Click <span className="font-semibold">"View Dashboard"</span> below to see the full financial analysis with charts, what-if scenarios, and reverse calculator.</p>
      </div>
    </div>
  );
}

// ─── Shared Input Components ────────────────────────────────

function InputField({ label, value, placeholder, onChange }: {
  label: string; value: string; placeholder: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block font-body text-sm font-semibold text-charcoal mb-2">{label}</label>
      <input type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border-2 border-border bg-white font-body text-charcoal placeholder:text-charcoal-light/40 focus:border-terracotta focus:outline-none transition-colors"
      />
    </div>
  );
}

function RupiahInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block font-body text-sm font-semibold text-charcoal mb-2">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body text-sm text-charcoal-light">Rp</span>
        <input type="text" value={formatNumber(String(value))}
          onChange={(e) => onChange(parseRupiahInput(e.target.value))}
          className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-border bg-white font-body text-charcoal focus:border-terracotta focus:outline-none transition-colors"
        />
      </div>
    </div>
  );
}
