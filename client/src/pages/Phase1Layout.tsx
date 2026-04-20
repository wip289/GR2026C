import { usePhase1 } from '@/contexts/Phase1Context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BoothLayoutVisualization } from '@/components/BoothLayoutVisualization';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Phase1Layout() {
  const { state, dispatch } = usePhase1();
  const [, setLocation] = useLocation();
  const { clientIntake, selectedVenue, layoutSuggestion } = state;

  if (!clientIntake || !selectedVenue || !layoutSuggestion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8">
          <p className="text-muted-foreground">Loading layout information...</p>
        </Card>
      </div>
    );
  }

  const handleApproveLayout = () => {
    dispatch({ type: 'SET_STEP', payload: 'proposal-customize' });
    setLocation('/phase1/proposal-customize');
    toast.success('Layout approved. Proceeding to proposal customization...');
  };

  const handleBack = () => {
    dispatch({ type: 'SET_STEP', payload: 'intake' });
    setLocation('/phase1');
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-foreground mb-2">Booth Layout</h1>
          <p className="text-lg text-muted-foreground">
            Review and customize the booth layout for {clientIntake.eventName}
          </p>
        </div>

        {/* Event Summary */}
        <Card className="p-6 mb-8 border border-border bg-secondary/30">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Event</div>
              <div className="font-semibold">{clientIntake.eventName}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Venue</div>
              <div className="font-semibold">{selectedVenue.name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Expected Employers</div>
              <div className="font-semibold">{clientIntake.expectedEmployers}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Booths</div>
              <div className="font-semibold text-primary">{layoutSuggestion.totalBooths}</div>
            </div>
          </div>
        </Card>

        {/* Layout Visualization */}
        <Card className="p-8 mb-8 border border-border">
          <h2 className="text-2xl font-display font-bold mb-6">Floor Plan</h2>
          <BoothLayoutVisualization
            boothPositions={layoutSuggestion.boothPositions}
            venueWidth={selectedVenue.width}
            venueLength={selectedVenue.length}
            scale={25}
          />

          <div className="mt-6 p-4 bg-accent/10 border border-accent/20 rounded-lg">
            <p className="text-sm text-foreground">{layoutSuggestion.notes}</p>
          </div>
        </Card>

        {/* Booth Summary */}
        <Card className="p-8 mb-8 border border-border">
          <h2 className="text-2xl font-display font-bold mb-6">Booth Configuration</h2>
          <div className="space-y-4">
            {Array.from(
              new Map(
                layoutSuggestion.boothPositions.map((b) => [
                  b.boothTypeName,
                  layoutSuggestion.boothPositions.filter((x) => x.boothTypeName === b.boothTypeName).length,
                ])
              )
            ).map(([boothType, count]) => (
              <div key={boothType} className="flex justify-between items-center p-4 bg-secondary/50 rounded-lg">
                <div>
                  <div className="font-semibold">{boothType}</div>
                  <div className="text-sm text-muted-foreground">Quantity: {count}</div>
                </div>
                <div className="text-2xl font-bold text-primary">{count}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Utilization Info */}
        <Card className="p-8 mb-8 border border-border bg-accent/5">
          <h2 className="text-2xl font-display font-bold mb-4">Space Utilization</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Venue Total Area:</span>
              <span className="font-semibold">{selectedVenue.totalArea}m²</span>
            </div>
            <div className="flex justify-between">
              <span>Booth Area Used:</span>
              <span className="font-semibold">
                {layoutSuggestion.boothPositions.reduce((sum, b) => sum + b.width * b.length, 0)}m²
              </span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="font-semibold">Utilization Rate:</span>
              <span className="font-bold text-primary">{layoutSuggestion.utilizationRate.toFixed(1)}%</span>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-between">
          <Button variant="outline" onClick={handleBack} className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground italic">
              Ingin ubah jumlah atau harga booth? Klik <strong>Approve</strong> lalu edit di langkah Proposal Customize.
            </p>
            <Button onClick={handleApproveLayout} size="lg" className="gap-2">
              Approve &amp; Continue <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
