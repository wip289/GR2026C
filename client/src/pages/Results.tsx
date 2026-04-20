/**
 * Results Page — Job Fair Event Planner
 * 
 * Design: "Event Canvas" — Warm Editorial / Magazine Spread
 * - Magazine-spread layout with staggered sections
 * - Pull-quote style for key budget numbers
 * - Vertical editorial flow for timeline
 * - Terracotta (#C4553A) primary, Sage (#7D8B6A) secondary
 */

import { useState, useMemo, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Building2,
  Megaphone,
  UtensilsCrossed,
  Users,
  Monitor,
  Camera,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Check,
  Calendar,
  Printer,
} from "lucide-react";
import { generateEventPlan, formatCurrency, type EventPlan, type BudgetCategory } from "@/lib/eventPlanner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const BUDGET_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663503352125/4SyizMS7wLtwuT2MADMeez/budget-illustration-VfieAEhp5QL7dn2R6seXTb.webp";
const TIMELINE_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663503352125/4SyizMS7wLtwuT2MADMeez/timeline-illustration-7bECPh7trqaJGsZAVAKwma.webp";
const CHECKLIST_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663503352125/4SyizMS7wLtwuT2MADMeez/checklist-illustration-DwZfuyAiM8ayKjt6y8FY7X.webp";

const iconMap: Record<string, React.ElementType> = {
  Building2,
  Megaphone,
  UtensilsCrossed,
  Users,
  Monitor,
  Camera,
  ShieldCheck,
};

const CHART_COLORS = [
  "#C4553A", // terracotta
  "#7D8B6A", // sage
  "#D4A574", // warm gold
  "#8B6F5C", // warm brown
  "#A3785F", // copper
  "#6B8E7B", // muted green
  "#B8856C", // dusty rose
];

export default function Results() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(search);
  const investment = parseInt(params.get("investment") || "0", 10);
  const printRef = useRef<HTMLDivElement>(null);

  const plan = useMemo(() => {
    if (investment < 5000000) return null;
    return generateEventPlan(investment);
  }, [investment]);

  if (!plan) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="font-display text-2xl font-bold text-charcoal">Invalid Investment Amount</h2>
          <p className="font-body text-charcoal-light">Please enter a valid investment amount.</p>
          <Button onClick={() => navigate("/")} className="bg-terracotta hover:bg-terracotta/90 text-white">
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper paper-texture" ref={printRef}>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-paper/80 backdrop-blur-md border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 font-body text-sm text-charcoal-light hover:text-terracotta transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            New Plan
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm bg-terracotta flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-charcoal tracking-tight">
              JobFair Planner
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="font-body text-sm border-terracotta/30 text-terracotta hover:bg-terracotta/5"
            onClick={() => window.print()}
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print
          </Button>
        </div>
      </nav>

      {/* Summary Header */}
      <SummaryHeader plan={plan} />

      {/* Budget Breakdown */}
      <BudgetSection plan={plan} />

      {/* Timeline */}
      <TimelineSection plan={plan} />

      {/* Resource Checklist */}
      <ResourceSection plan={plan} />

      {/* Footer CTA */}
      <section className="py-12 border-t border-border/50">
        <div className="container text-center space-y-4">
          <h3 className="font-display text-2xl font-bold text-charcoal">Need to adjust?</h3>
          <p className="font-body text-charcoal-light">Change the investment amount to regenerate the entire plan.</p>
          <Button
            onClick={() => navigate("/")}
            className="bg-terracotta hover:bg-terracotta/90 text-white font-body font-semibold px-8 py-5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Create New Plan
          </Button>
        </div>
      </section>
    </div>
  );
}

// ─── Summary Header ──────────────────────────────────────────

function SummaryHeader({ plan }: { plan: EventPlan }) {
  return (
    <section className="py-12 lg:py-16">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="editorial-rule w-20 mb-6 rounded-full" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7">
              <p className="font-body text-sm font-semibold text-terracotta uppercase tracking-wider mb-2">
                Event Plan Generated
              </p>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-charcoal leading-tight">
                {plan.summary.eventScale}
                <span className="block text-terracotta italic">Job Fair</span>
              </h1>
              <p className="font-body text-lg text-charcoal-light mt-4 max-w-lg">
                A comprehensive plan for your university job fair event, automatically tailored to your investment of{" "}
                <span className="font-semibold text-charcoal">{formatCurrency(plan.investment)}</span>.
              </p>
            </div>

            <div className="lg:col-span-5">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Attendees", value: plan.summary.estimatedAttendees },
                  { label: "Booths", value: plan.summary.estimatedBooths },
                  { label: "Duration", value: plan.summary.eventDuration },
                  { label: "Planning", value: plan.summary.planningPeriod },
                  { label: "Staff", value: plan.summary.staffRequired },
                  { label: "Total Budget", value: formatCurrency(plan.investment) },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    className="bg-white rounded-lg p-4 border border-border/60 shadow-sm"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
                  >
                    <p className="font-body text-xs text-charcoal-light uppercase tracking-wider">{stat.label}</p>
                    <p className="font-display text-lg font-bold text-charcoal mt-1">{stat.value}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Budget Section ──────────────────────────────────────────

function BudgetSection({ plan }: { plan: EventPlan }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const chartData = plan.budget.map((cat) => ({
    name: cat.name,
    value: cat.amount,
    percentage: cat.percentage,
  }));

  return (
    <section className="py-12 lg:py-16 bg-paper-dark/40">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Section header with illustration */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
            <div className="lg:col-span-8">
              <p className="font-body text-sm font-semibold text-terracotta uppercase tracking-wider mb-2">
                Section One
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-charcoal mb-3">
                Budget Allocation
              </h2>
              <div className="editorial-rule w-16 rounded-full mb-4" />
              <p className="font-body text-charcoal-light leading-relaxed max-w-2xl">
                Your investment of <span className="font-semibold text-charcoal">{formatCurrency(plan.investment)}</span> is
                distributed across seven key categories, each carefully proportioned based on industry standards for job fair events.
              </p>
            </div>
            <div className="lg:col-span-4 flex justify-end">
              <img
                src={BUDGET_IMG}
                alt="Budget planning illustration"
                className="w-48 h-36 object-cover rounded-lg opacity-80"
              />
            </div>
          </div>

          {/* Chart + Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Pie Chart */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-xl p-6 border border-border/60 shadow-sm sticky top-24">
                <h3 className="font-display text-lg font-bold text-charcoal mb-4">Distribution</h3>
                <div className="w-full aspect-square max-w-[280px] mx-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius="35%"
                        outerRadius="75%"
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          fontFamily: '"Source Sans 3", sans-serif',
                          fontSize: "13px",
                          borderRadius: "8px",
                          border: "1px solid #e8e0d8",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="space-y-2 mt-4">
                  {plan.budget.map((cat, i) => (
                    <div key={cat.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-sm shrink-0"
                          style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        <span className="font-body text-charcoal-light truncate">{cat.name}</span>
                      </div>
                      <span className="font-body font-semibold text-charcoal">{cat.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Budget Cards */}
            <div className="lg:col-span-8 space-y-4">
              {plan.budget.map((category, i) => (
                <BudgetCard
                  key={category.id}
                  category={category}
                  index={i}
                  isExpanded={expandedId === category.id}
                  onToggle={() => setExpandedId(expandedId === category.id ? null : category.id)}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function BudgetCard({
  category,
  index,
  isExpanded,
  onToggle,
}: {
  category: BudgetCategory;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const Icon = iconMap[category.icon] || Building2;

  return (
    <motion.div
      className="bg-white rounded-xl border border-border/60 shadow-sm overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-center gap-4 text-left hover:bg-paper-dark/30 transition-colors"
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${CHART_COLORS[index % CHART_COLORS.length]}15` }}
        >
          <Icon className="w-5 h-5" style={{ color: CHART_COLORS[index % CHART_COLORS.length] }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-lg font-bold text-charcoal">{category.name}</h3>
            <span className="pull-quote text-xl text-terracotta shrink-0">
              {formatCurrency(category.amount)}
            </span>
          </div>
          <p className="font-body text-sm text-charcoal-light mt-0.5">{category.description}</p>
        </div>
        <div className="shrink-0 ml-2">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-charcoal-light" />
          ) : (
            <ChevronDown className="w-5 h-5 text-charcoal-light" />
          )}
        </div>
      </button>

      {isExpanded && (
        <motion.div
          className="px-5 pb-5 border-t border-border/40"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
        >
          <div className="pt-4">
            <table className="w-full">
              <thead>
                <tr className="font-body text-xs text-charcoal-light uppercase tracking-wider">
                  <th className="text-left pb-2">Item</th>
                  <th className="text-right pb-2">Qty</th>
                  <th className="text-right pb-2">Unit Cost</th>
                  <th className="text-right pb-2">Subtotal</th>
                </tr>
              </thead>
              <tbody className="font-body text-sm">
                {category.subItems.map((item, i) => (
                  <tr key={i} className="border-t border-border/30">
                    <td className="py-2.5 text-charcoal">{item.name}</td>
                    <td className="py-2.5 text-right text-charcoal-light">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-2.5 text-right text-charcoal-light">{formatCurrency(item.unitCost)}</td>
                    <td className="py-2.5 text-right font-semibold text-charcoal">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Timeline Section ────────────────────────────────────────

function TimelineSection({ plan }: { plan: EventPlan }) {
  return (
    <section className="py-12 lg:py-16">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Section header */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
            <div className="lg:col-span-4 flex justify-start order-2 lg:order-1">
              <img
                src={TIMELINE_IMG}
                alt="Timeline planning illustration"
                className="w-48 h-36 object-cover rounded-lg opacity-80"
              />
            </div>
            <div className="lg:col-span-8 order-1 lg:order-2">
              <p className="font-body text-sm font-semibold text-sage uppercase tracking-wider mb-2">
                Section Two
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-charcoal mb-3">
                Event Timeline
              </h2>
              <div className="editorial-rule w-16 rounded-full mb-4" />
              <p className="font-body text-charcoal-light leading-relaxed max-w-2xl">
                A {plan.summary.planningPeriod} planning period divided into five distinct phases, from initial concept through post-event evaluation.
              </p>
            </div>
          </div>

          {/* Timeline phases */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 lg:left-8 top-0 bottom-0 w-0.5 bg-border/60" />

            <div className="space-y-8">
              {plan.timeline.map((phase, i) => (
                <motion.div
                  key={phase.id}
                  className="relative pl-16 lg:pl-20"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  {/* Timeline dot */}
                  <div
                    className="absolute left-4 lg:left-6 top-2 w-5 h-5 rounded-full border-[3px] border-white shadow-md"
                    style={{ backgroundColor: phase.color }}
                  />

                  <div className="bg-white rounded-xl border border-border/60 shadow-sm p-6">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <h3 className="font-display text-xl font-bold text-charcoal">{phase.name}</h3>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-body font-semibold text-white"
                        style={{ backgroundColor: phase.color }}
                      >
                        {phase.duration}
                      </span>
                      {phase.daysBeforeEvent > 0 && (
                        <span className="text-xs font-body text-charcoal-light">
                          {phase.daysBeforeEvent} days before event
                        </span>
                      )}
                      {phase.daysBeforeEvent === 0 && (
                        <span className="text-xs font-body font-semibold text-terracotta">
                          Event Day
                        </span>
                      )}
                      {phase.daysBeforeEvent < 0 && (
                        <span className="text-xs font-body text-sage font-semibold">
                          After event
                        </span>
                      )}
                    </div>

                    <div className="space-y-3">
                      {phase.tasks.map((task, j) => (
                        <div
                          key={j}
                          className="flex items-start gap-3 p-3 rounded-lg bg-paper/60 hover:bg-paper-dark/40 transition-colors"
                        >
                          <div className="w-5 h-5 rounded-full border-2 border-border flex items-center justify-center shrink-0 mt-0.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: phase.color, opacity: 0.5 }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-body text-sm font-semibold text-charcoal">{task.name}</p>
                            <p className="font-body text-xs text-charcoal-light mt-0.5">{task.description}</p>
                            <p className="font-body text-xs text-sage font-medium mt-1">{task.responsible}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Resource Section ────────────────────────────────────────

function ResourceSection({ plan }: { plan: EventPlan }) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Group resources by category
  const grouped = plan.resources.reduce<Record<string, typeof plan.resources>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const totalChecked = checkedItems.size;
  const totalItems = plan.resources.length;
  const progress = Math.round((totalChecked / totalItems) * 100);

  const priorityColors = {
    essential: { bg: "bg-terracotta/10", text: "text-terracotta", label: "Essential" },
    recommended: { bg: "bg-sage/10", text: "text-sage", label: "Recommended" },
    optional: { bg: "bg-warm-gold/10", text: "text-warm-gold", label: "Optional" },
  };

  return (
    <section className="py-12 lg:py-16 bg-paper-dark/40">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Section header */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
            <div className="lg:col-span-8">
              <p className="font-body text-sm font-semibold text-warm-gold uppercase tracking-wider mb-2">
                Section Three
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-charcoal mb-3">
                Resource Checklist
              </h2>
              <div className="editorial-rule w-16 rounded-full mb-4" />
              <p className="font-body text-charcoal-light leading-relaxed max-w-2xl">
                A comprehensive list of {totalItems} resources needed for your job fair event. Check off items as you secure them to track your preparation progress.
              </p>
            </div>
            <div className="lg:col-span-4 flex justify-end">
              <img
                src={CHECKLIST_IMG}
                alt="Checklist illustration"
                className="w-48 h-36 object-cover rounded-lg opacity-80"
              />
            </div>
          </div>

          {/* Progress bar */}
          <div className="bg-white rounded-xl border border-border/60 shadow-sm p-5 mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="font-body text-sm font-semibold text-charcoal">Preparation Progress</span>
              <span className="font-display text-lg font-bold text-terracotta">{progress}%</span>
            </div>
            <div className="w-full h-3 bg-paper-dark rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, #C4553A, #D4A574, #7D8B6A)",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <p className="font-body text-xs text-charcoal-light mt-2">
              {totalChecked} of {totalItems} resources secured
            </p>
          </div>

          {/* Resource groups */}
          <div className="space-y-6">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="bg-white rounded-xl border border-border/60 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border/40 bg-paper/50">
                  <h3 className="font-display text-lg font-bold text-charcoal">{category}</h3>
                </div>
                <div className="divide-y divide-border/30">
                  {items.map((item) => {
                    const isChecked = checkedItems.has(item.id);
                    const priority = priorityColors[item.priority];
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        className={`w-full flex items-center gap-4 p-4 text-left transition-colors ${
                          isChecked ? "bg-sage/5" : "hover:bg-paper-dark/30"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                            isChecked
                              ? "bg-sage border-sage"
                              : "border-border hover:border-charcoal-light"
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`font-body text-sm font-semibold ${
                                isChecked ? "text-charcoal-light line-through" : "text-charcoal"
                              }`}
                            >
                              {item.name}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-body font-semibold ${priority.bg} ${priority.text}`}>
                              {priority.label}
                            </span>
                          </div>
                          <p className="font-body text-xs text-charcoal-light mt-0.5">
                            {item.quantity} {item.unit} — Est. {formatCurrency(item.estimatedCost)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
