/**
 * Job Fair Financial Planner — Core Logic Engine
 *
 * Design: "Event Canvas" — Warm Editorial / Magazine Spread
 *
 * This module handles all financial calculations for a job fair event:
 * - Expense breakdown (supplier + operational)
 * - Revenue projection (booth sales + sponsorship)
 * - Profit/loss analysis
 * - Reverse calculator (target profit → required pricing)
 * - What-if scenario comparisons
 * - Per-booth cost tracking (cost per m²)
 */

// ─── Types ───────────────────────────────────────────────────

export interface EventInfo {
  eventName: string;
  clientName: string;
  // Venue basic
  venueName: string;
  venueLocation: string;
  eventDuration: number; // days
  venueCost: number;
  venueIsFree: boolean;
  // Venue dimensions (from Phase 1)
  venueWidth: number;
  venueLength: number;
  venueTotalArea: number;
  venueCapacity: number;
  venueAmenities: string[];
}

export interface BoothType {
  id: string;
  name: string;
  width: number; // meters
  height: number; // meters
  area: number; // m² (auto-calculated)
  quantity: number;
  costPerSqm: number; // supplier cost per m²
  productionCostPerBooth: number; // auto-calculated
  sellingPrice: number;
  facilities: string;
}

export interface SponsorTier {
  id: string;
  name: string;
  pricePerSponsor: number;
  expectedCount: number;
  benefits: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  isAutoCalculated: boolean;
  items: ExpenseItem[];
}

export interface ExpenseItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  frequency: number; // e.g., 2 for "per day × 2 days"
  frequencyUnit: string; // "event" | "day"
  subtotal: number; // auto-calculated
  isEditable: boolean;
}

export interface FinancialSummary {
  totalExpenses: number;
  supplierCosts: number;
  operationalCosts: number;
  totalBoothRevenue: number;
  totalSponsorRevenue: number;
  totalRevenue: number;
  profitLoss: number;
  profitMargin: number; // percentage
  breakEvenBooths: number;
  fillRate: number; // percentage
  projectedBoothRevenue: number;
  projectedTotalRevenue: number;
  projectedProfitLoss: number;
  perBoothCosts: PerBoothCost[];
}

export interface PerBoothCost {
  boothTypeId: string;
  boothTypeName: string;
  productionCost: number;
  sellingPrice: number;
  marginPerBooth: number;
  marginPercent: number;
}

export interface WhatIfScenario {
  id: string;
  name: string;
  fillRate: number;
  boothTypes: BoothType[];
  sponsorTiers: SponsorTier[];
  totalExpenses: number;
  totalRevenue: number;
  profitLoss: number;
  profitMargin: number;
}

export interface ReverseCalcResult {
  requiredRevenue: number;
  suggestedMainPrice: number;
  suggestedStandardPrice: number;
  requiredSponsorRevenue: number;
  requiredFillRate: number;
}

export interface EventPlanData {
  eventInfo: EventInfo;
  boothTypes: BoothType[];
  interviewBooths: number;
  sponsorTiers: SponsorTier[];
  expenses: ExpenseCategory[];
  fillRate: number;
  contingencyPercent: number;
  targetProfitMargin: number;
}

// ─── Default Templates ──────────────────────────────────────

export function createDefaultEventInfo(): EventInfo {
  return {
    eventName: "",
    clientName: "",
    venueName: "",
    venueLocation: "",
    eventDuration: 2,
    venueCost: 0,
    venueIsFree: true,
    venueWidth: 0,
    venueLength: 0,
    venueTotalArea: 0,
    venueCapacity: 0,
    venueAmenities: [],
  };
}

export function createDefaultBoothTypes(): BoothType[] {
  return [
    {
      id: "main",
      name: "Main Booth",
      width: 5,
      height: 5,
      area: 25,
      quantity: 12,
      costPerSqm: 100000,
      productionCostPerBooth: 2500000,
      sellingPrice: 10000000,
      facilities: "Strategic location, digital branding, VIP lounge, 220V electricity, table & chairs, WiFi",
    },
    {
      id: "standard",
      name: "Standard Booth",
      width: 3,
      height: 3,
      area: 9,
      quantity: 36,
      costPerSqm: 100000,
      productionCostPerBooth: 900000,
      sellingPrice: 7500000,
      facilities: "Main area location, 220V electricity, table & chairs, WiFi",
    },
  ];
}

export function createDefaultSponsorTiers(): SponsorTier[] {
  return [
    {
      id: "platinum",
      name: "Platinum",
      pricePerSponsor: 25000000,
      expectedCount: 0,
      benefits: "Logo on all materials, 15-min presentation, 8x social media, full page guidebook, VIP 3 pax",
    },
    {
      id: "gold",
      name: "Gold",
      pricePerSponsor: 15000000,
      expectedCount: 0,
      benefits: "Logo on materials, 10-min presentation, 5x social media, half page guidebook, VIP 2 pax",
    },
    {
      id: "silver",
      name: "Silver",
      pricePerSponsor: 7500000,
      expectedCount: 0,
      benefits: "Logo on selected materials, 3x social media, quarter page guidebook, 2 pax access",
    },
  ];
}

export function createDefaultExpenses(eventDuration: number): ExpenseCategory[] {
  return [
    {
      id: "stage",
      name: "Stage & Equipment",
      icon: "Monitor",
      isAutoCalculated: false,
      items: [
        { id: "led-display", name: "LED Display", description: "TV LED / LED Screen", quantity: 1, unit: "packg", unitCost: 9000000, frequency: eventDuration, frequencyUnit: "day", subtotal: 0, isEditable: true },
        { id: "multimedia", name: "Content Multimedia", description: "Produksi konten", quantity: 1, unit: "packg", unitCost: 2500000, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true },
        { id: "sound", name: "Sound System", description: "5000 watt, wireless mic, mic podium", quantity: 1, unit: "packg", unitCost: 7500000, frequency: eventDuration, frequencyUnit: "day", subtotal: 0, isEditable: true },
        { id: "lighting", name: "Lighting System", description: "Par Led, Moving Beam, Gun smoke, confetty", quantity: 1, unit: "packg", unitCost: 4500000, frequency: eventDuration, frequencyUnit: "day", subtotal: 0, isEditable: true },
        { id: "backdrop", name: "Backdrop & Stage Decoration", description: "Backdrop, stage decoration, karpet", quantity: 1, unit: "packg", unitCost: 14550000, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true },
      ],
    },
    {
      id: "dome",
      name: "Venue Infrastructure",
      icon: "Building2",
      isAutoCalculated: false,
      items: [
        { id: "ac-cooling", name: "AC / Cooling System", description: "Standing AC units", quantity: 20, unit: "unit", unitCost: 1000000, frequency: eventDuration, frequencyUnit: "day", subtotal: 0, isEditable: true },
        { id: "genset", name: "Generator Set", description: "For AC, sound, lighting, booths", quantity: 4, unit: "unit", unitCost: 4500000, frequency: eventDuration, frequencyUnit: "day", subtotal: 0, isEditable: true },
        { id: "gardening", name: "Gardening & Decoration", description: "Dome area, gate area, totem, landscape", quantity: 1, unit: "packg", unitCost: 12000000, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true },
        { id: "main-gate", name: "Main Gate & Signage", description: "Main gate, entrance/exit signage, photo wall", quantity: 1, unit: "packg", unitCost: 27450000, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true },
        { id: "furniture", name: "Tables, Chairs & Carpet", description: "Meja, kursi, karpet for booths and registration", quantity: 1, unit: "packg", unitCost: 60000000, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true },
        { id: "electrical", name: "Electrical & Utilities", description: "Titik listrik, blower, misty fan, handy talkie", quantity: 1, unit: "packg", unitCost: 20050000, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true },
        { id: "interview-room", name: "Interview Room Setup", description: "Partisi, chairs, tables for interview booths", quantity: 1, unit: "packg", unitCost: 18600000, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true },
      ],
    },
    {
      id: "merchandise",
      name: "Merchandise & Souvenirs",
      icon: "Gift",
      isAutoCalculated: false,
      items: [
        { id: "polo-shirt", name: "Polo Shirt (Committee)", description: "Bahan lacoste", quantity: 170, unit: "pcs", unitCost: 120000, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true },
        { id: "tshirt", name: "T-Shirt", description: "Bahan katun", quantity: 150, unit: "pcs", unitCost: 100000, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true },
        { id: "nametag", name: "Name Tags", description: "Panitia + Employers", quantity: 320, unit: "pax", unitCost: 17500, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true },
        { id: "goody-bag", name: "Goody Bags & Maps", description: "Canvas bags + art paper maps", quantity: 200, unit: "pcs", unitCost: 36250, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true },
        { id: "booklet", name: "Booklet / Katalog", description: "A4 format", quantity: 100, unit: "pax", unitCost: 25000, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true },
        { id: "sweater", name: "Sweater (VIP)", description: "For VIP committee", quantity: 25, unit: "pcs", unitCost: 150000, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true },
      ],
    },
    {
      id: "printing",
      name: "Printing & Promotion",
      icon: "Printer",
      isAutoCalculated: false,
      items: [
        { id: "poster", name: "Poster A3", description: "Art paper", quantity: 500, unit: "eks", unitCost: 7500, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true },
        { id: "flyers", name: "Flyers A5", description: "Art paper", quantity: 10000, unit: "eks", unitCost: 500, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true },
        { id: "baliho", name: "Baliho / Billboard", description: "Digital print + installation", quantity: 6, unit: "pcs", unitCost: 2500000, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true },
        { id: "spanduk", name: "Spanduk / Banner", description: "Digital print", quantity: 11, unit: "pcs", unitCost: 318000, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true },
      ],
    },
    {
      id: "catering",
      name: "Food & Beverage",
      icon: "UtensilsCrossed",
      isAutoCalculated: false,
      items: [
        { id: "crew-meals", name: "Crew Meals", description: "Lunch + snack for committee", quantity: 170, unit: "person", unitCost: 50000, frequency: eventDuration, frequencyUnit: "day", subtotal: 0, isEditable: true },
        { id: "employer-meals", name: "Employer Refreshments", description: "Lunch + refreshments for employers", quantity: 150, unit: "person", unitCost: 75000, frequency: eventDuration, frequencyUnit: "day", subtotal: 0, isEditable: true },
        { id: "vip-catering", name: "VIP Catering", description: "Special catering for VIP guests", quantity: 30, unit: "person", unitCost: 150000, frequency: eventDuration, frequencyUnit: "day", subtotal: 0, isEditable: true },
        { id: "water-beverages", name: "Water & Beverages", description: "Mineral water, coffee, tea for all", quantity: 1, unit: "packg", unitCost: 5000000, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true },
      ],
    },
    {
      id: "staffing",
      name: "Staffing & Operations",
      icon: "Users",
      isAutoCalculated: false,
      items: [
        { id: "security", name: "Security Personnel", description: "Event security", quantity: 10, unit: "person", unitCost: 250000, frequency: eventDuration, frequencyUnit: "day", subtotal: 0, isEditable: true },
        { id: "mc", name: "MC / Host", description: "Professional MC", quantity: 1, unit: "person", unitCost: 5000000, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true },
        { id: "documentation", name: "Documentation Team", description: "Photographer + Videographer", quantity: 2, unit: "person", unitCost: 3000000, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true },
        { id: "transport", name: "Transportation", description: "Crew transport & logistics", quantity: 1, unit: "packg", unitCost: 5000000, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true },
      ],
    },
    {
      id: "it",
      name: "IT & Technology",
      icon: "Wifi",
      isAutoCalculated: false,
      items: [
        { id: "wifi", name: "WiFi / Internet", description: "High-speed WiFi for venue", quantity: 1, unit: "packg", unitCost: 5000000, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true },
        { id: "registration-system", name: "Registration System", description: "Digital registration & check-in", quantity: 1, unit: "license", unitCost: 3000000, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true },
      ],
    },
    {
      id: "secretariat",
      name: "Secretariat & Administration",
      icon: "ClipboardList",
      isAutoCalculated: false,
      items: [
        { id: "atk", name: "ATK & Office Supplies", description: "Alat tulis kantor, kertas, tinta", quantity: 1, unit: "packg", unitCost: 2500000, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true },
        { id: "surat-izin", name: "Surat Izin & Perizinan", description: "Pengurusan izin keramaian, keamanan", quantity: 1, unit: "packg", unitCost: 1500000, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true },
        { id: "akomodasi", name: "Akomodasi Panitia", description: "Hotel/penginapan panitia dari luar kota", quantity: 0, unit: "room", unitCost: 500000, frequency: eventDuration, frequencyUnit: "day", subtotal: 0, isEditable: true },
        { id: "komunikasi", name: "Komunikasi & Pulsa", description: "Biaya komunikasi, HT, pulsa panitia", quantity: 1, unit: "packg", unitCost: 1000000, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true },
        { id: "rapat", name: "Biaya Rapat & Koordinasi", description: "Konsumsi rapat persiapan", quantity: 1, unit: "packg", unitCost: 500000, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true },
        { id: "p3k", name: "P3K & Kesehatan", description: "Kotak P3K, tenaga medis standby", quantity: 1, unit: "packg", unitCost: 1000000, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true },
      ],
    },
    {
      id: "tax",
      name: "Pajak & Biaya Lain",
      icon: "Receipt",
      isAutoCalculated: false,
      items: [
        { id: "ppn", name: "PPN (11%)", description: "Pajak Pertambahan Nilai atas transaksi kena pajak", quantity: 1, unit: "item", unitCost: 0, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true },
        { id: "pph23", name: "PPh 23", description: "Pajak penghasilan atas jasa (2% dari bruto)", quantity: 1, unit: "item", unitCost: 0, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true },
        { id: "biaya-bank", name: "Biaya Administrasi Bank", description: "Transfer fee, VA, payment gateway", quantity: 1, unit: "packg", unitCost: 500000, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true },
        { id: "asuransi", name: "Asuransi Event", description: "Event liability insurance", quantity: 1, unit: "packg", unitCost: 0, frequency: 1, frequencyUnit: "event", subtotal: 0, isEditable: true },
      ],
    },
  ];
}

// ─── Calculation Functions ──────────────────────────────────

export function calculateBoothArea(width: number, height: number): number {
  return width * height;
}

export function calculateBoothProductionCost(area: number, costPerSqm: number): number {
  return area * costPerSqm;
}

export function calculateExpenseItemSubtotal(item: ExpenseItem): number {
  return item.quantity * item.unitCost * item.frequency;
}

export function calculateCategoryTotal(category: ExpenseCategory): number {
  return category.items.reduce((sum, item) => {
    return sum + calculateExpenseItemSubtotal(item);
  }, 0);
}

export function calculateTotalExpenses(expenses: ExpenseCategory[], venueCost: number, contingencyPercent: number): {
  supplierCosts: number;
  operationalCosts: number;
  contingency: number;
  total: number;
} {
  const supplierIds      = ["stage", "dome"];
  const operationalIds   = ["merchandise", "printing", "catering", "staffing", "it", "secretariat", "tax"];

  let supplierCosts = venueCost;
  let operationalCosts = 0;

  expenses.forEach((cat) => {
    const catTotal = calculateCategoryTotal(cat);
    if (supplierIds.includes(cat.id)) {
      supplierCosts += catTotal;
    } else if (operationalIds.includes(cat.id)) {
      operationalCosts += catTotal;
    }
  });

  const subtotal = supplierCosts + operationalCosts;
  const contingency = Math.round(subtotal * (contingencyPercent / 100));
  const total = subtotal + contingency;

  return { supplierCosts, operationalCosts, contingency, total };
}

export function calculateBoothRevenue(boothTypes: BoothType[], fillRate: number): {
  maxRevenue: number;
  projectedRevenue: number;
  totalBooths: number;
  soldBooths: number;
} {
  const maxRevenue = boothTypes.reduce((sum, bt) => sum + bt.quantity * bt.sellingPrice, 0);
  const totalBooths = boothTypes.reduce((sum, bt) => sum + bt.quantity, 0);
  const soldBooths = Math.round(totalBooths * (fillRate / 100));
  const projectedRevenue = Math.round(maxRevenue * (fillRate / 100));

  return { maxRevenue, projectedRevenue, totalBooths, soldBooths };
}

export function calculateSponsorRevenue(sponsorTiers: SponsorTier[]): number {
  return sponsorTiers.reduce((sum, tier) => sum + tier.pricePerSponsor * tier.expectedCount, 0);
}

export function calculateBoothProductionCosts(boothTypes: BoothType[], eventDuration: number): number {
  return boothTypes.reduce((sum, bt) => {
    const partisiCost = bt.area * bt.costPerSqm * eventDuration;
    return sum + partisiCost * bt.quantity;
  }, 0);
}

export function calculateFinancialSummary(data: EventPlanData): FinancialSummary {
  const expenseCalc = calculateTotalExpenses(data.expenses, data.eventInfo.venueIsFree ? 0 : data.eventInfo.venueCost, data.contingencyPercent);
  const boothCalc = calculateBoothRevenue(data.boothTypes, data.fillRate);
  const sponsorRevenue = calculateSponsorRevenue(data.sponsorTiers);

  const totalRevenue = boothCalc.maxRevenue + sponsorRevenue;
  const projectedTotalRevenue = boothCalc.projectedRevenue + sponsorRevenue;
  const profitLoss = totalRevenue - expenseCalc.total;
  const projectedProfitLoss = projectedTotalRevenue - expenseCalc.total;
  const profitMargin = expenseCalc.total > 0 ? (projectedProfitLoss / expenseCalc.total) * 100 : 0;

  // Break-even calculation
  const avgBoothPrice = data.boothTypes.length > 0
    ? data.boothTypes.reduce((sum, bt) => sum + bt.sellingPrice, 0) / data.boothTypes.length
    : 0;
  const breakEvenBooths = avgBoothPrice > 0
    ? Math.ceil((expenseCalc.total - sponsorRevenue) / avgBoothPrice)
    : 0;

  // Per-booth cost analysis
  const perBoothCosts: PerBoothCost[] = data.boothTypes.map((bt) => {
    const totalBooths = data.boothTypes.reduce((s, b) => s + b.quantity, 0);
    const boothShare = totalBooths > 0 ? bt.quantity / totalBooths : 0;
    const allocatedExpense = Math.round(expenseCalc.total * boothShare / bt.quantity);
    return {
      boothTypeId: bt.id,
      boothTypeName: bt.name,
      productionCost: allocatedExpense,
      sellingPrice: bt.sellingPrice,
      marginPerBooth: bt.sellingPrice - allocatedExpense,
      marginPercent: allocatedExpense > 0 ? ((bt.sellingPrice - allocatedExpense) / allocatedExpense) * 100 : 0,
    };
  });

  return {
    totalExpenses: expenseCalc.total,
    supplierCosts: expenseCalc.supplierCosts,
    operationalCosts: expenseCalc.operationalCosts,
    totalBoothRevenue: boothCalc.maxRevenue,
    totalSponsorRevenue: sponsorRevenue,
    totalRevenue,
    profitLoss,
    profitMargin,
    breakEvenBooths,
    fillRate: data.fillRate,
    projectedBoothRevenue: boothCalc.projectedRevenue,
    projectedTotalRevenue,
    projectedProfitLoss,
    perBoothCosts,
  };
}

// ─── Reverse Calculator ─────────────────────────────────────

export function reverseCalculate(
  totalExpenses: number,
  targetMarginPercent: number,
  boothTypes: BoothType[],
  fillRate: number,
  sponsorRevenue: number,
): ReverseCalcResult {
  const requiredRevenue = totalExpenses * (1 + targetMarginPercent / 100);
  const revenueFromBooths = requiredRevenue - sponsorRevenue;

  // Distribute required booth revenue proportionally to current ratio
  const currentMainTotal = boothTypes.find(b => b.id === "main");
  const currentStdTotal = boothTypes.find(b => b.id === "standard");

  const mainQty = currentMainTotal?.quantity || 0;
  const stdQty = currentStdTotal?.quantity || 0;
  const totalBooths = mainQty + stdQty;

  // Assume main booth is ~1.33x the standard price (based on area ratio 25/9 ≈ 2.78, but market doesn't scale linearly)
  const priceRatio = 1.33;
  const effectiveUnits = mainQty * priceRatio + stdQty;
  const adjustedForFillRate = revenueFromBooths / (fillRate / 100);

  const suggestedStandardPrice = effectiveUnits > 0 ? Math.ceil(adjustedForFillRate / effectiveUnits / 500000) * 500000 : 0;
  const suggestedMainPrice = Math.ceil(suggestedStandardPrice * priceRatio / 500000) * 500000;

  const requiredFillRate = totalBooths > 0
    ? Math.min(100, Math.round((revenueFromBooths / (mainQty * suggestedMainPrice + stdQty * suggestedStandardPrice)) * 100))
    : 0;

  return {
    requiredRevenue,
    suggestedMainPrice,
    suggestedStandardPrice,
    requiredSponsorRevenue: sponsorRevenue,
    requiredFillRate,
  };
}

// ─── Formatting Utilities ───────────────────────────────────

export function formatRupiah(amount: number): string {
  if (amount === 0) return "Rp 0";
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat("id-ID").format(absAmount);
  return `${isNegative ? "-" : ""}Rp ${formatted}`;
}

export function formatRupiahShort(amount: number): string {
  const absAmount = Math.abs(amount);
  const isNegative = amount < 0;
  const prefix = isNegative ? "-" : "";

  if (absAmount >= 1000000000) {
    return `${prefix}Rp ${(absAmount / 1000000000).toFixed(1)}M`;
  }
  if (absAmount >= 1000000) {
    return `${prefix}Rp ${(absAmount / 1000000).toFixed(0)}Jt`;
  }
  if (absAmount >= 1000) {
    return `${prefix}Rp ${(absAmount / 1000).toFixed(0)}Rb`;
  }
  return `${prefix}Rp ${absAmount}`;
}

export function parseRupiahInput(value: string): number {
  return parseInt(value.replace(/\D/g, ""), 10) || 0;
}

export function formatNumber(value: string): string {
  const numericValue = value.replace(/\D/g, "");
  if (!numericValue) return "";
  return new Intl.NumberFormat("id-ID").format(parseInt(numericValue, 10));
}
