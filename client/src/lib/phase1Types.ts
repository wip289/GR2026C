/**
 * Phase 1: Client Onboarding, Venue Management, Booth Layout, Proposal Generation
 * 
 * This module defines the data structures for Phase 1 features.
 * It works alongside the existing Financial Planner (Phase 0) but is kept separate
 * to avoid disrupting the current system.
 */

export interface Venue {
  id: string;
  name: string;
  location: string;
  totalArea: number; // in square meters
  width: number; // in meters
  length: number; // in meters
  description: string;
  photo?: string;
  capacity: number; // estimated number of booths
  amenities: string[]; // e.g., ["AC", "WiFi", "Parking", "Loading Dock"]
  createdAt: Date;
}

export interface BoothPosition {
  id: string;
  boothTypeId: string;
  boothTypeName: string;
  x: number; // position from left (in meters)
  y: number; // position from top (in meters)
  width: number; // in meters
  length: number; // in meters
  label: string; // e.g., "Main Booth 1"
  occupied: boolean;
  occupantName?: string; // employer name if assigned
}

export interface LayoutSuggestion {
  venueId: string;
  boothPositions: BoothPosition[];
  totalBooths: number;
  utilizationRate: number; // percentage of venue used
  notes: string;
  generatedAt: Date;
}

export interface ClientIntakeData {
  id: string;
  clientName: string;
  universityName: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  eventName: string;
  eventDate: Date;
  eventDuration: number; // in days
  venueId: string;
  venueName: string;
  estimatedBudget: number; // in IDR
  expectedEmployers: number;
  expectedAttendees: number;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProposalCustomization {
  eventName: string;
  eventDate: string;
  eventDuration: number;
  venueLocation: string;
  clientName: string;
  universityName: string;
  expectedAttendees: string;
  mainProgram: string[];
  supportingProgram: string[];
  audienceSegments: string[];
  fieldsOfExpertise: string[];
  industryTargets: string[];
  boothPackages: BoothPackage[];
  sponsorTiers: SponsorTier[];
  contactEmail: string;
  contactPhone: string;
  logoUrl?: string;
  brandColor?: string; // hex color code
}

export interface BoothPackage {
  id: string;
  name: string;
  dimensions: string; // e.g., "5 × 5 m"
  price: number;
  features: string[];
  quantity: number;
}

export interface SponsorTier {
  id: string;
  name: string;
  price: number;
  benefits: string[];
  color: string; // for visual distinction
}

export interface ProposalDocument {
  id: string;
  type: 'employer' | 'sponsor'; // which proposal type
  clientIntakeId: string;
  customization: ProposalCustomization;
  htmlContent: string; // HTML for preview
  pdfUrl?: string; // URL to generated PDF
  createdAt: Date;
  updatedAt: Date;
}

export interface Phase1State {
  currentStep: 'intake' | 'venue' | 'layout' | 'proposal-preview' | 'proposal-customize' | 'complete';
  clientIntake: ClientIntakeData | null;
  selectedVenue: Venue | null;
  venueCostPerDay: number;
  venueIsFree: boolean;
  layoutSuggestion: LayoutSuggestion | null;
  proposalCustomization: ProposalCustomization | null;
  employerProposal: ProposalDocument | null;
  sponsorProposal: ProposalDocument | null;
  isLoading: boolean;
  error: string | null;
}
