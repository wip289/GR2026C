import { useState } from 'react';
import { usePhase1 } from '@/contexts/Phase1Context';
import { useEvent } from '@/contexts/EventContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Download, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import type { BoothType, SponsorTier, EventInfo } from '@/lib/financialPlanner';
import { createDefaultExpenses } from '@/lib/financialPlanner';

/** Parse "5 × 5 m" → { width: 5, height: 5 } */
function parseDimensions(dim: string): { width: number; height: number } {
  const match = dim.replace(/\s/g, '').match(/(\d+(?:\.\d+)?)[×x](\d+(?:\.\d+)?)/i);
  if (match) return { width: parseFloat(match[1]), height: parseFloat(match[2]) };
  return { width: 3, height: 3 };
}

export default function Phase1Complete() {
  const { state: phase1State, dispatch: phase1Dispatch } = usePhase1();
  const { dispatch: eventDispatch } = useEvent();
  const [, setLocation] = useLocation();
  const [isSaving, setIsSaving] = useState(false);
  const { clientIntake, selectedVenue, layoutSuggestion, proposalCustomization, venueCostPerDay, venueIsFree } = phase1State;

  const createEventMutation = trpc.event.createEvent.useMutation({
    onSuccess: () => {
      // Invalidate event list so EventDashboardSelector re-fetches
      trpc.useUtils().event.getMyEvents.invalidate();
    },
    onError: (err) => {
      console.warn('[Phase1Complete] Event save failed:', err.message);
      // Non-blocking — user can still proceed to Planner
    },
  });

  const handleGoToFinancialPlanner = async () => {
    if (!clientIntake || !selectedVenue) {
      toast.error('Data event tidak lengkap. Kembali ke Phase 1.');
      return;
    }
    setIsSaving(true);

    // ── 1. Event Info ──────────────────────────────────────────
    const eventInfo: EventInfo = {
      eventName: clientIntake.eventName,
      clientName: clientIntake.clientName,
      venueName: selectedVenue.name,
      venueLocation: selectedVenue.location,
      eventDuration: clientIntake.eventDuration,
      venueCost: venueIsFree ? 0 : venueCostPerDay * clientIntake.eventDuration,
      venueIsFree,
      venueWidth: selectedVenue.width,
      venueLength: selectedVenue.length,
      venueTotalArea: selectedVenue.totalArea,
      venueCapacity: selectedVenue.capacity,
      venueAmenities: selectedVenue.amenities,
    };
    eventDispatch({ type: 'UPDATE_EVENT_INFO', info: eventInfo });

    // ── 2. Booth Types ─────────────────────────────────────────
    if (proposalCustomization?.boothPackages?.length) {
      const boothTypes: BoothType[] = proposalCustomization.boothPackages.map((pkg) => {
        const { width, height } = parseDimensions(pkg.dimensions);
        const area = width * height;
        const costPerSqm = 100000; // default supplier cost per m²
        return {
          id: pkg.id,
          name: pkg.name,
          width,
          height,
          area,
          quantity: pkg.quantity,
          costPerSqm,
          productionCostPerBooth: area * costPerSqm,
          sellingPrice: pkg.price,
          facilities: pkg.features.join(', '),
        };
      });
      eventDispatch({ type: 'SET_BOOTH_TYPES', boothTypes });
    }

    // ── 3. Sponsor Tiers ───────────────────────────────────────
    if (proposalCustomization?.sponsorTiers?.length) {
      const sponsorTiers: SponsorTier[] = proposalCustomization.sponsorTiers.map((tier) => ({
        id: tier.id,
        name: tier.name,
        pricePerSponsor: tier.price,
        expectedCount: 0,
        benefits: Array.isArray(tier.benefits) ? tier.benefits.join(', ') : String(tier.benefits),
      }));
      eventDispatch({ type: 'SET_SPONSOR_TIERS', tiers: sponsorTiers });
    }

    // ── 4. Interview Booths ────────────────────────────────────
    if (layoutSuggestion) {
      const interviewCount = Math.round(layoutSuggestion.totalBooths * 0.15);
      eventDispatch({ type: 'SET_INTERVIEW_BOOTHS', count: Math.max(5, interviewCount) });
    }

    // ── 5. Expenses (regenerate for correct duration) ──────────
    const expenses = createDefaultExpenses(clientIntake.eventDuration);
    eventDispatch({ type: 'SET_EXPENSES', expenses });

    // ── 6. Reset planner to step 0 ─────────────────────────────
    eventDispatch({ type: 'SET_STEP', step: 0 });

    // ── 7. Save event to database (non-blocking) ──────────────
    try {
      await createEventMutation.mutateAsync({
        name: clientIntake.eventName,
        clientName: clientIntake.clientName,
        university: clientIntake.universityName,
        contactEmail: clientIntake.contactEmail || undefined,
        contactPhone: clientIntake.contactPhone || undefined,
        eventDate: clientIntake.eventDate
          ? new Date(clientIntake.eventDate).toISOString().split('T')[0]
          : undefined,
        expectedEmployers: clientIntake.expectedEmployers,
        expectedAttendees: clientIntake.expectedAttendees,
        budget: venueIsFree ? undefined : String(venueCostPerDay * clientIntake.eventDuration),
      });
    } catch {
      // Already logged in onError — continue anyway
    }

    setIsSaving(false);
    toast.success('Data event berhasil dimuat ke Financial Planner!', {
      description: `${clientIntake.eventName} — ${selectedVenue.name}`,
    });

    setLocation('/planner');
  };

  const handleStartNewEvent = () => {
    phase1Dispatch({ type: 'RESET' });
    setLocation('/phase1');
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-20 h-20 text-green-500" />
          </div>
          <h1 className="text-4xl font-display font-bold text-foreground mb-2">Event Setup Complete!</h1>
          <p className="text-lg text-muted-foreground">
            Your event plan is ready. Here's what you've created:
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 mb-12">
          {/* Event Information */}
          <Card className="p-8 border border-border">
            <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              Event Information
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Event Name</div>
                <div className="font-semibold">{clientIntake?.eventName}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Client</div>
                <div className="font-semibold">{clientIntake?.clientName}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">University</div>
                <div className="font-semibold">{clientIntake?.universityName}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Venue</div>
                <div className="font-semibold">{selectedVenue?.name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Expected Employers</div>
                <div className="font-semibold">{clientIntake?.expectedEmployers}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Expected Attendees</div>
                <div className="font-semibold">{clientIntake?.expectedAttendees?.toLocaleString()}</div>
              </div>
            </div>
          </Card>

          {/* Booth Layout */}
          <Card className="p-8 border border-border">
            <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              Booth Layout
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Booths</div>
                <div className="text-2xl font-bold text-primary">{layoutSuggestion?.totalBooths}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Venue Size</div>
                <div className="text-lg font-semibold">
                  {selectedVenue?.width}×{selectedVenue?.length}m
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Area</div>
                <div className="text-lg font-semibold">{selectedVenue?.totalArea}m²</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Utilization</div>
                <div className="text-lg font-semibold">{layoutSuggestion?.utilizationRate.toFixed(1)}%</div>
              </div>
            </div>
          </Card>

          {/* Proposals Generated */}
          <Card className="p-8 border border-border">
            <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              Proposals Ready
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                <div>
                  <div className="font-semibold">Employer Proposal</div>
                  <div className="text-sm text-muted-foreground">For booth rental packages</div>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                <div>
                  <div className="font-semibold">Sponsor Proposal</div>
                  <div className="text-sm text-muted-foreground">For sponsorship packages</div>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </div>
          </Card>

          {/* What gets pre-filled — NEW: show user what will be carried over */}
          <Card className="p-8 border-2 border-primary/20 bg-primary/5">
            <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Siap Lanjut ke Financial Planner
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              Data berikut akan otomatis dimuat ke Financial Planner — kamu tidak perlu mengisi ulang:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Nama event: <strong>{clientIntake?.eventName}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Venue: <strong>{selectedVenue?.name}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Durasi: <strong>{clientIntake?.eventDuration} hari</strong></span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>
                  Paket booth: <strong>{proposalCustomization?.boothPackages?.length ?? 0} tipe</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>
                  Tier sponsor: <strong>{proposalCustomization?.sponsorTiers?.length ?? 0} tier</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>
                  Harga &amp; fasilitas booth dari proposal
                </span>
              </div>
            </div>
          </Card>

          {/* Next Steps */}
          <Card className="p-8 border border-border bg-accent/5">
            <h2 className="text-2xl font-display font-bold mb-6">Next Steps</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <div className="font-semibold">Go to Financial Planner</div>
                  <p className="text-sm text-muted-foreground">
                    Data event sudah dimuat otomatis — langsung atur harga, biaya, dan proyeksi profit
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <div className="font-semibold">Share Proposals with Client</div>
                  <p className="text-sm text-muted-foreground">
                    Download and email the employer and sponsor proposals to your client
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <div className="font-semibold">Get Client Approval</div>
                  <p className="text-sm text-muted-foreground">
                    Wait for client feedback and approval before proceeding with vendor bookings
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={handleStartNewEvent}>
            Start New Event
          </Button>
          <Button
            onClick={handleGoToFinancialPlanner}
            disabled={isSaving}
            size="lg"
            className="gap-2 bg-terracotta hover:bg-terracotta/90 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menyimpan event...
              </>
            ) : (
              <>
                Lanjut ke Financial Planner
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
