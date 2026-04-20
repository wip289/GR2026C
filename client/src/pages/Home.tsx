/**
 * Home Page — Job Fair Financial Planner Landing
 *
 * Design: "Event Canvas" — Warm Editorial / Magazine Spread
 * - Asymmetric layout with hero on left, CTA on right
 * - Playfair Display for headings, Source Sans 3 for body
 * - Terracotta primary, Sage secondary, Warm Gold accent
 */

import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useEffect } from "react";
import {
  ArrowRight, Sparkles, Calculator, Sliders, TrendingUp,
  LayoutGrid, Calendar, Receipt,
} from "lucide-react";

const HERO_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663503352125/4SyizMS7wLtwuT2MADMeez/hero-jobfair-AjMSZthV2Ypn24AuPWFELF.webp";

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const [, navigate] = useLocation();

  // Redirect authenticated users to event selector (using useEffect to avoid render-phase updates)
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate("/events");
    }
  }, [isAuthenticated, loading, navigate]);

  return (
    <div className="min-h-screen bg-paper paper-texture">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-paper/80 backdrop-blur-md border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm bg-terracotta flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-charcoal tracking-tight">
              JobFair Planner
            </span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 lg:pt-32 lg:pb-20">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Hero Content */}
            <motion.div
              className="lg:col-span-7 space-y-6"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-terracotta/10 text-terracotta text-sm font-body font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                Financial Planning for Job Fairs
              </div>

              <h1 className="font-display text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-charcoal leading-[1.1] tracking-tight">
                Plan, Price &
                <span className="block text-terracotta italic">Profit</span>
                Your Job Fair
              </h1>

              <p className="font-body text-lg text-charcoal-light leading-relaxed max-w-xl">
                The complete financial planning system for job fair events. Configure your venue, booths, sponsors, and expenses — then see exactly how to make it profitable.
              </p>

              {/* Feature highlights */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                {[
                  { icon: Receipt, label: "Editable Expenses", desc: "Full cost breakdown" },
                  { icon: LayoutGrid, label: "Booth Pricing", desc: "Per m² calculation" },
                  { icon: Sliders, label: "What-If Scenarios", desc: "Simulate changes" },
                  { icon: Calculator, label: "Reverse Calculator", desc: "Target profit → pricing" },
                ].map((feature, i) => (
                  <motion.div
                    key={feature.label}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-paper-dark/50 transition-colors"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                  >
                    <div className="w-9 h-9 rounded-md bg-sage/15 flex items-center justify-center shrink-0">
                      <feature.icon className="w-4.5 h-4.5 text-sage" />
                    </div>
                    <div>
                      <p className="font-body font-semibold text-sm text-charcoal">{feature.label}</p>
                      <p className="font-body text-xs text-charcoal-light">{feature.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <Button
                  onClick={() => navigate("/planner")}
                  className="py-6 px-8 text-base font-body font-semibold bg-terracotta hover:bg-terracotta/90 text-white rounded-lg transition-all duration-300 group"
                >
                  Start Planning
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </motion.div>

            {/* Right: Hero Image */}
            <motion.div
              className="lg:col-span-5"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            >
              <div className="relative">
                <div className="rounded-2xl overflow-hidden shadow-2xl shadow-charcoal/10">
                  <img
                    src={HERO_IMAGE}
                    alt="Job fair event"
                    className="w-full h-80 lg:h-[420px] object-cover"
                  />
                </div>
                {/* Floating stat cards */}
                <motion.div
                  className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 border border-border/50"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sage/15 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-sage" />
                    </div>
                    <div>
                      <p className="font-body text-xs text-charcoal-light">Profit Analysis</p>
                      <p className="font-display text-lg font-bold text-sage">Real-time</p>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  className="absolute -top-3 -right-3 bg-white rounded-xl shadow-lg p-3 border border-border/50"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1, duration: 0.4 }}
                >
                  <p className="font-body text-xs text-charcoal-light">Booth Types</p>
                  <p className="font-display text-base font-bold text-terracotta">Customizable</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 lg:py-24 bg-paper-dark/50">
        <div className="container">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-charcoal mb-3">
              How It Works
            </h2>
            <div className="editorial-rule w-20 mx-auto rounded-full" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Event & Venue",
                description: "Enter your event details, venue, and whether the venue is free or rented.",
                color: "terracotta",
              },
              {
                step: "02",
                title: "Booths & Pricing",
                description: "Configure booth types, dimensions, quantities, and selling prices with per-m² cost tracking.",
                color: "sage",
              },
              {
                step: "03",
                title: "Sponsors & Expenses",
                description: "Add sponsorship tiers and edit every expense item — from stage equipment to catering.",
                color: "warm-gold",
              },
              {
                step: "04",
                title: "Analyze & Optimize",
                description: "View the full P&L dashboard, run what-if scenarios, and use the reverse calculator.",
                color: "terracotta",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                className="text-center space-y-4"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
              >
                <span className={`font-display text-5xl font-bold text-${item.color}/30`}>
                  {item.step}
                </span>
                <h3 className="font-display text-xl font-bold text-charcoal">
                  {item.title}
                </h3>
                <p className="font-body text-sm text-charcoal-light leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container text-center">
          <p className="font-body text-sm text-charcoal-light">
            Built for Event Management Professionals
          </p>
        </div>
      </footer>
    </div>
  );
}
