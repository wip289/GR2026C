/**
 * Job Fair Event Planner - Core Logic
 * 
 * Design: "Event Canvas" — Warm Editorial / Magazine Spread
 * This module contains all the business logic for generating
 * budget breakdowns, timelines, and resource checklists
 * based on the investment amount.
 */

// ─── Types ───────────────────────────────────────────────────

export interface BudgetCategory {
  id: string;
  name: string;
  percentage: number;
  amount: number;
  icon: string;
  description: string;
  subItems: BudgetSubItem[];
}

export interface BudgetSubItem {
  name: string;
  amount: number;
  unit: string;
  quantity: number;
  unitCost: number;
}

export interface TimelinePhase {
  id: string;
  name: string;
  duration: string;
  daysBeforeEvent: number;
  tasks: TimelineTask[];
  color: string;
}

export interface TimelineTask {
  name: string;
  description: string;
  responsible: string;
  status: "pending" | "in-progress" | "completed";
}

export interface ResourceItem {
  id: string;
  category: string;
  name: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
  priority: "essential" | "recommended" | "optional";
  checked: boolean;
}

export interface EventPlan {
  investment: number;
  eventScale: "small" | "medium" | "large" | "enterprise";
  estimatedAttendees: number;
  estimatedBooths: number;
  budget: BudgetCategory[];
  timeline: TimelinePhase[];
  resources: ResourceItem[];
  summary: EventSummary;
}

export interface EventSummary {
  eventScale: string;
  estimatedAttendees: string;
  estimatedBooths: string;
  eventDuration: string;
  planningPeriod: string;
  staffRequired: string;
}

// ─── Scale Determination ─────────────────────────────────────

function determineScale(investment: number): {
  scale: "small" | "medium" | "large" | "enterprise";
  attendees: number;
  booths: number;
} {
  if (investment < 15000000) {
    return { scale: "small", attendees: Math.round(investment / 30000), booths: Math.round(investment / 750000) };
  } else if (investment < 50000000) {
    return { scale: "medium", attendees: Math.round(investment / 25000), booths: Math.round(investment / 600000) };
  } else if (investment < 150000000) {
    return { scale: "large", attendees: Math.round(investment / 20000), booths: Math.round(investment / 500000) };
  } else {
    return { scale: "enterprise", attendees: Math.round(investment / 18000), booths: Math.round(investment / 450000) };
  }
}

// ─── Budget Generation ───────────────────────────────────────

function generateBudget(investment: number, scale: string, booths: number, attendees: number): BudgetCategory[] {
  const budgetConfig = [
    {
      id: "venue",
      name: "Venue & Infrastructure",
      percentage: 25,
      icon: "Building2",
      description: "Venue rental, booth construction, electrical setup, and basic infrastructure",
      getSubItems: (amount: number) => [
        { name: "Venue Rental", amount: Math.round(amount * 0.45), unit: "day", quantity: scale === "small" ? 1 : 2, unitCost: Math.round(amount * 0.45 / (scale === "small" ? 1 : 2)) },
        { name: "Booth Construction", amount: Math.round(amount * 0.30), unit: "booth", quantity: booths, unitCost: Math.round(amount * 0.30 / booths) },
        { name: "Electrical & Internet", amount: Math.round(amount * 0.15), unit: "package", quantity: 1, unitCost: Math.round(amount * 0.15) },
        { name: "Signage & Wayfinding", amount: Math.round(amount * 0.10), unit: "set", quantity: 1, unitCost: Math.round(amount * 0.10) },
      ],
    },
    {
      id: "marketing",
      name: "Marketing & Promotion",
      percentage: 20,
      icon: "Megaphone",
      description: "Digital marketing, printed materials, social media campaigns, and PR",
      getSubItems: (amount: number) => [
        { name: "Social Media Ads", amount: Math.round(amount * 0.35), unit: "campaign", quantity: 3, unitCost: Math.round(amount * 0.35 / 3) },
        { name: "Printed Materials", amount: Math.round(amount * 0.25), unit: "set", quantity: Math.round(attendees * 1.5), unitCost: Math.round(amount * 0.25 / (attendees * 1.5)) },
        { name: "Banner & Backdrop", amount: Math.round(amount * 0.20), unit: "piece", quantity: booths + 4, unitCost: Math.round(amount * 0.20 / (booths + 4)) },
        { name: "Digital Design", amount: Math.round(amount * 0.20), unit: "package", quantity: 1, unitCost: Math.round(amount * 0.20) },
      ],
    },
    {
      id: "catering",
      name: "Food & Beverage",
      percentage: 15,
      icon: "UtensilsCrossed",
      description: "Catering for attendees, VIP meals, refreshments, and snack stations",
      getSubItems: (amount: number) => [
        { name: "Attendee Refreshments", amount: Math.round(amount * 0.40), unit: "person", quantity: attendees, unitCost: Math.round(amount * 0.40 / attendees) },
        { name: "VIP Lunch/Dinner", amount: Math.round(amount * 0.30), unit: "person", quantity: Math.round(booths * 2 + 20), unitCost: Math.round(amount * 0.30 / (booths * 2 + 20)) },
        { name: "Snack Stations", amount: Math.round(amount * 0.20), unit: "station", quantity: Math.max(2, Math.round(booths / 5)), unitCost: Math.round(amount * 0.20 / Math.max(2, Math.round(booths / 5))) },
        { name: "Water & Beverages", amount: Math.round(amount * 0.10), unit: "package", quantity: 1, unitCost: Math.round(amount * 0.10) },
      ],
    },
    {
      id: "staffing",
      name: "Staffing & Operations",
      percentage: 15,
      icon: "Users",
      description: "Event staff, security, registration team, and operational support",
      getSubItems: (amount: number) => {
        const staffCount = Math.max(5, Math.round(booths * 0.8));
        const securityCount = Math.max(2, Math.round(attendees / 200));
        return [
          { name: "Event Crew", amount: Math.round(amount * 0.40), unit: "person", quantity: staffCount, unitCost: Math.round(amount * 0.40 / staffCount) },
          { name: "Security Personnel", amount: Math.round(amount * 0.25), unit: "person", quantity: securityCount, unitCost: Math.round(amount * 0.25 / securityCount) },
          { name: "Registration Team", amount: Math.round(amount * 0.20), unit: "person", quantity: Math.max(3, Math.round(attendees / 150)), unitCost: Math.round(amount * 0.20 / Math.max(3, Math.round(attendees / 150))) },
          { name: "Coordinator Fee", amount: Math.round(amount * 0.15), unit: "person", quantity: scale === "small" ? 1 : scale === "medium" ? 2 : 3, unitCost: Math.round(amount * 0.15 / (scale === "small" ? 1 : scale === "medium" ? 2 : 3)) },
        ];
      },
    },
    {
      id: "technology",
      name: "Technology & Equipment",
      percentage: 10,
      icon: "Monitor",
      description: "Sound system, projectors, registration tech, and digital displays",
      getSubItems: (amount: number) => [
        { name: "Sound System", amount: Math.round(amount * 0.30), unit: "set", quantity: 1, unitCost: Math.round(amount * 0.30) },
        { name: "Projector & Screen", amount: Math.round(amount * 0.25), unit: "set", quantity: Math.max(1, Math.round(booths / 10)), unitCost: Math.round(amount * 0.25 / Math.max(1, Math.round(booths / 10))) },
        { name: "Registration System", amount: Math.round(amount * 0.25), unit: "license", quantity: 1, unitCost: Math.round(amount * 0.25) },
        { name: "WiFi & Connectivity", amount: Math.round(amount * 0.20), unit: "package", quantity: 1, unitCost: Math.round(amount * 0.20) },
      ],
    },
    {
      id: "documentation",
      name: "Documentation & Souvenirs",
      percentage: 8,
      icon: "Camera",
      description: "Photography, videography, certificates, and event souvenirs",
      getSubItems: (amount: number) => [
        { name: "Photography", amount: Math.round(amount * 0.35), unit: "day", quantity: scale === "small" ? 1 : 2, unitCost: Math.round(amount * 0.35 / (scale === "small" ? 1 : 2)) },
        { name: "Videography", amount: Math.round(amount * 0.30), unit: "day", quantity: scale === "small" ? 1 : 2, unitCost: Math.round(amount * 0.30 / (scale === "small" ? 1 : 2)) },
        { name: "Certificates", amount: Math.round(amount * 0.15), unit: "piece", quantity: booths + Math.round(attendees * 0.3), unitCost: Math.round(amount * 0.15 / (booths + Math.round(attendees * 0.3))) },
        { name: "Souvenirs", amount: Math.round(amount * 0.20), unit: "piece", quantity: attendees, unitCost: Math.round(amount * 0.20 / attendees) },
      ],
    },
    {
      id: "contingency",
      name: "Contingency Fund",
      percentage: 7,
      icon: "ShieldCheck",
      description: "Emergency fund for unexpected expenses and last-minute adjustments",
      getSubItems: (amount: number) => [
        { name: "Emergency Reserve", amount: Math.round(amount * 0.60), unit: "fund", quantity: 1, unitCost: Math.round(amount * 0.60) },
        { name: "Last-minute Supplies", amount: Math.round(amount * 0.25), unit: "fund", quantity: 1, unitCost: Math.round(amount * 0.25) },
        { name: "Miscellaneous", amount: Math.round(amount * 0.15), unit: "fund", quantity: 1, unitCost: Math.round(amount * 0.15) },
      ],
    },
  ];

  return budgetConfig.map((config) => {
    const amount = Math.round(investment * (config.percentage / 100));
    return {
      id: config.id,
      name: config.name,
      percentage: config.percentage,
      amount,
      icon: config.icon,
      description: config.description,
      subItems: config.getSubItems(amount),
    };
  });
}

// ─── Timeline Generation ─────────────────────────────────────

function generateTimeline(scale: string): TimelinePhase[] {
  const isSmall = scale === "small";
  const isMedium = scale === "medium";

  return [
    {
      id: "planning",
      name: "Planning & Concept",
      duration: isSmall ? "2 weeks" : isMedium ? "3 weeks" : "4 weeks",
      daysBeforeEvent: isSmall ? 42 : isMedium ? 56 : 70,
      color: "#C4553A",
      tasks: [
        { name: "Define event objectives & KPIs", description: "Set clear goals for the job fair including target number of companies and attendees", responsible: "Event Manager", status: "pending" },
        { name: "Secure venue & date", description: "Book the university venue and confirm the event date with all stakeholders", responsible: "Event Manager", status: "pending" },
        { name: "Create event concept & theme", description: "Design the visual identity, theme, and branding for the job fair", responsible: "Creative Team", status: "pending" },
        { name: "Draft initial budget allocation", description: "Distribute the investment across all budget categories", responsible: "Finance Team", status: "pending" },
        { name: "Identify target companies", description: "Create a list of potential companies to invite as exhibitors", responsible: "Business Development", status: "pending" },
      ],
    },
    {
      id: "preparation",
      name: "Preparation & Outreach",
      duration: isSmall ? "2 weeks" : isMedium ? "3 weeks" : "4 weeks",
      daysBeforeEvent: isSmall ? 28 : isMedium ? 35 : 42,
      color: "#7D8B6A",
      tasks: [
        { name: "Send invitations to companies", description: "Reach out to target companies with event details and booth packages", responsible: "Business Development", status: "pending" },
        { name: "Launch marketing campaign", description: "Begin social media, email, and campus marketing to attract attendees", responsible: "Marketing Team", status: "pending" },
        { name: "Confirm vendors & suppliers", description: "Finalize contracts with catering, AV, printing, and other vendors", responsible: "Procurement", status: "pending" },
        { name: "Design booth layouts", description: "Create floor plans and booth configurations for the venue", responsible: "Creative Team", status: "pending" },
        { name: "Set up registration system", description: "Configure online registration for both companies and attendees", responsible: "Tech Team", status: "pending" },
        { name: "Recruit & brief event staff", description: "Hire and train volunteers, crew, and security personnel", responsible: "HR / Operations", status: "pending" },
      ],
    },
    {
      id: "production",
      name: "Production & Setup",
      duration: isSmall ? "3 days" : isMedium ? "5 days" : "7 days",
      daysBeforeEvent: isSmall ? 3 : isMedium ? 5 : 7,
      color: "#D4A574",
      tasks: [
        { name: "Venue setup & decoration", description: "Install booths, signage, banners, and decorative elements", responsible: "Production Team", status: "pending" },
        { name: "Technical rehearsal", description: "Test all AV equipment, WiFi, registration systems, and displays", responsible: "Tech Team", status: "pending" },
        { name: "Print & distribute materials", description: "Prepare name badges, brochures, maps, and attendee kits", responsible: "Operations", status: "pending" },
        { name: "Final walkthrough", description: "Complete inspection of all areas with the team leads", responsible: "Event Manager", status: "pending" },
        { name: "Catering coordination", description: "Confirm menu, delivery times, and setup with catering vendor", responsible: "F&B Coordinator", status: "pending" },
      ],
    },
    {
      id: "event-day",
      name: "Event Day",
      duration: isSmall ? "1 day" : isMedium ? "1-2 days" : "2 days",
      daysBeforeEvent: 0,
      color: "#C4553A",
      tasks: [
        { name: "Early morning setup check", description: "Final checks on all booths, signage, and equipment before doors open", responsible: "All Teams", status: "pending" },
        { name: "Registration & welcome", description: "Manage attendee check-in, distribute badges and event materials", responsible: "Registration Team", status: "pending" },
        { name: "Live event coordination", description: "Manage flow, handle issues, coordinate speakers and activities", responsible: "Event Manager", status: "pending" },
        { name: "Photography & videography", description: "Capture event highlights, interviews, and key moments", responsible: "Media Team", status: "pending" },
        { name: "VIP management", description: "Escort VIPs, manage special sessions and networking events", responsible: "VIP Liaison", status: "pending" },
        { name: "Real-time social media", description: "Post live updates, stories, and engage with online audience", responsible: "Social Media Team", status: "pending" },
      ],
    },
    {
      id: "post-event",
      name: "Post-Event & Evaluation",
      duration: "1-2 weeks",
      daysBeforeEvent: -1,
      color: "#7D8B6A",
      tasks: [
        { name: "Venue teardown & cleanup", description: "Dismantle booths, return rented equipment, clean the venue", responsible: "Production Team", status: "pending" },
        { name: "Collect feedback surveys", description: "Send satisfaction surveys to companies and attendees", responsible: "Marketing Team", status: "pending" },
        { name: "Financial reconciliation", description: "Compile all expenses, compare with budget, and create financial report", responsible: "Finance Team", status: "pending" },
        { name: "Create event report", description: "Document outcomes, statistics, photos, and lessons learned", responsible: "Event Manager", status: "pending" },
        { name: "Send thank-you communications", description: "Thank participating companies, sponsors, and attendees", responsible: "Business Development", status: "pending" },
        { name: "Distribute certificates", description: "Send participation certificates to companies and key contributors", responsible: "Operations", status: "pending" },
      ],
    },
  ];
}

// ─── Resource Checklist Generation ───────────────────────────

function generateResources(investment: number, scale: string, booths: number, attendees: number): ResourceItem[] {
  const staffCount = Math.max(5, Math.round(booths * 0.8));
  const securityCount = Math.max(2, Math.round(attendees / 200));
  const registrationStaff = Math.max(3, Math.round(attendees / 150));

  const resources: ResourceItem[] = [
    // Venue & Infrastructure
    { id: "r1", category: "Venue & Infrastructure", name: "Main Venue Hall", quantity: 1, unit: "venue", estimatedCost: Math.round(investment * 0.25 * 0.45), priority: "essential", checked: false },
    { id: "r2", category: "Venue & Infrastructure", name: "Exhibition Booths", quantity: booths, unit: "booths", estimatedCost: Math.round(investment * 0.25 * 0.30), priority: "essential", checked: false },
    { id: "r3", category: "Venue & Infrastructure", name: "Electrical Setup", quantity: 1, unit: "package", estimatedCost: Math.round(investment * 0.25 * 0.15), priority: "essential", checked: false },
    { id: "r4", category: "Venue & Infrastructure", name: "Directional Signage", quantity: Math.max(10, booths), unit: "pieces", estimatedCost: Math.round(investment * 0.25 * 0.10), priority: "recommended", checked: false },

    // Staffing
    { id: "r5", category: "Staffing", name: "Event Crew Members", quantity: staffCount, unit: "persons", estimatedCost: Math.round(investment * 0.15 * 0.40), priority: "essential", checked: false },
    { id: "r6", category: "Staffing", name: "Security Personnel", quantity: securityCount, unit: "persons", estimatedCost: Math.round(investment * 0.15 * 0.25), priority: "essential", checked: false },
    { id: "r7", category: "Staffing", name: "Registration Staff", quantity: registrationStaff, unit: "persons", estimatedCost: Math.round(investment * 0.15 * 0.20), priority: "essential", checked: false },
    { id: "r8", category: "Staffing", name: "Event Coordinator(s)", quantity: scale === "small" ? 1 : scale === "medium" ? 2 : 3, unit: "persons", estimatedCost: Math.round(investment * 0.15 * 0.15), priority: "essential", checked: false },

    // Technology
    { id: "r9", category: "Technology", name: "Sound System (PA)", quantity: 1, unit: "set", estimatedCost: Math.round(investment * 0.10 * 0.30), priority: "essential", checked: false },
    { id: "r10", category: "Technology", name: "Projector & Screen", quantity: Math.max(1, Math.round(booths / 10)), unit: "sets", estimatedCost: Math.round(investment * 0.10 * 0.25), priority: "recommended", checked: false },
    { id: "r11", category: "Technology", name: "Registration System / App", quantity: 1, unit: "license", estimatedCost: Math.round(investment * 0.10 * 0.25), priority: "essential", checked: false },
    { id: "r12", category: "Technology", name: "WiFi Access Points", quantity: Math.max(2, Math.round(attendees / 100)), unit: "units", estimatedCost: Math.round(investment * 0.10 * 0.20), priority: "recommended", checked: false },

    // Marketing Materials
    { id: "r13", category: "Marketing", name: "Social Media Ad Campaigns", quantity: 3, unit: "campaigns", estimatedCost: Math.round(investment * 0.20 * 0.35), priority: "essential", checked: false },
    { id: "r14", category: "Marketing", name: "Printed Brochures / Flyers", quantity: Math.round(attendees * 1.5), unit: "pieces", estimatedCost: Math.round(investment * 0.20 * 0.25), priority: "recommended", checked: false },
    { id: "r15", category: "Marketing", name: "Banners & Backdrops", quantity: booths + 4, unit: "pieces", estimatedCost: Math.round(investment * 0.20 * 0.20), priority: "essential", checked: false },

    // Catering
    { id: "r16", category: "Catering", name: "Attendee Refreshment Packages", quantity: attendees, unit: "packs", estimatedCost: Math.round(investment * 0.15 * 0.40), priority: "essential", checked: false },
    { id: "r17", category: "Catering", name: "VIP Meal Service", quantity: Math.round(booths * 2 + 20), unit: "persons", estimatedCost: Math.round(investment * 0.15 * 0.30), priority: "recommended", checked: false },
    { id: "r18", category: "Catering", name: "Snack Stations", quantity: Math.max(2, Math.round(booths / 5)), unit: "stations", estimatedCost: Math.round(investment * 0.15 * 0.20), priority: "optional", checked: false },

    // Documentation
    { id: "r19", category: "Documentation", name: "Professional Photographer", quantity: scale === "small" ? 1 : 2, unit: "persons", estimatedCost: Math.round(investment * 0.08 * 0.35), priority: "recommended", checked: false },
    { id: "r20", category: "Documentation", name: "Videographer", quantity: scale === "small" ? 1 : 2, unit: "persons", estimatedCost: Math.round(investment * 0.08 * 0.30), priority: "optional", checked: false },
    { id: "r21", category: "Documentation", name: "Participation Certificates", quantity: booths + Math.round(attendees * 0.3), unit: "pieces", estimatedCost: Math.round(investment * 0.08 * 0.15), priority: "recommended", checked: false },
    { id: "r22", category: "Documentation", name: "Event Souvenirs", quantity: attendees, unit: "pieces", estimatedCost: Math.round(investment * 0.08 * 0.20), priority: "optional", checked: false },
  ];

  return resources;
}

// ─── Main Generator ──────────────────────────────────────────

export function generateEventPlan(investment: number): EventPlan {
  const { scale, attendees, booths } = determineScale(investment);
  const budget = generateBudget(investment, scale, booths, attendees);
  const timeline = generateTimeline(scale);
  const resources = generateResources(investment, scale, booths, attendees);

  const scaleLabels = {
    small: "Small Scale",
    medium: "Medium Scale",
    large: "Large Scale",
    enterprise: "Enterprise Scale",
  };

  const summary: EventSummary = {
    eventScale: scaleLabels[scale],
    estimatedAttendees: `${attendees.toLocaleString()} people`,
    estimatedBooths: `${booths} company booths`,
    eventDuration: scale === "small" ? "1 day" : scale === "medium" ? "1-2 days" : "2 days",
    planningPeriod: scale === "small" ? "6 weeks" : scale === "medium" ? "8 weeks" : "10 weeks",
    staffRequired: `${Math.max(5, Math.round(booths * 0.8)) + Math.max(2, Math.round(attendees / 200)) + Math.max(3, Math.round(attendees / 150)) + (scale === "small" ? 1 : scale === "medium" ? 2 : 3)} people`,
  };

  return {
    investment,
    eventScale: scale,
    estimatedAttendees: attendees,
    estimatedBooths: booths,
    budget,
    timeline,
    resources,
    summary,
  };
}

// ─── Currency Formatter ──────────────────────────────────────

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("id-ID").format(num);
}
