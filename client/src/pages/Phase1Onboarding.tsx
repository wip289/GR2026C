import { useLocation } from 'wouter';
import { useState } from 'react';
import { usePhase1 } from '@/contexts/Phase1Context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { getAllVenues, calculateBoothLayout } from '@/lib/venueDatabase';
import { ClientIntakeData, LayoutSuggestion, BoothPosition } from '@/lib/phase1Types';
import { toast } from 'sonner';

export default function Phase1Onboarding() {
  const { state, dispatch } = usePhase1();
  const [venueCostPerDay, setVenueCostPerDay] = useState<number>(0);
  const [venueIsFree, setVenueIsFree] = useState<boolean>(true);
  const [formData, setFormData] = useState<Partial<ClientIntakeData>>({
    clientName: '',
    universityName: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    eventName: '',
    eventDate: new Date(),
    eventDuration: 2,
    expectedEmployers: 50,
    expectedAttendees: 3000,
    notes: '',
  });

  const venues = getAllVenues();
  const selectedVenue = state.selectedVenue;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'eventDuration' || name === 'expectedEmployers' || name === 'expectedAttendees' ? parseInt(value) : value,
    }));
  };

  const handleVenueSelect = (venueId: string) => {
    const venue = venues.find((v) => v.id === venueId);
    if (venue) {
      dispatch({ type: 'SET_VENUE', payload: venue });
      dispatch({ type: 'SET_VENUE_COST', payload: { costPerDay: venueCostPerDay, isFree: venueIsFree } });
      setFormData((prev) => ({
        ...prev,
        venueId: venue.id,
        venueName: venue.name,
      }));
    }
  };

  const handleGenerateLayout = () => {
    if (!selectedVenue) {
      return;
    }

    // Simple booth configuration based on expected employers
    const boothTypes = [
      { name: 'Main Booth (5×5m)', width: 5, length: 5, quantity: Math.ceil(formData.expectedEmployers! * 0.2) },
      { name: 'Standard Booth (3×3m)', width: 3, length: 3, quantity: Math.ceil(formData.expectedEmployers! * 0.8) },
    ];

    const layout = calculateBoothLayout(selectedVenue.width, selectedVenue.length, boothTypes);

    const layoutSuggestion: LayoutSuggestion = {
      venueId: selectedVenue.id,
      boothPositions: layout.positions.map((p, idx) => ({
        id: `booth-${idx}`,
        boothTypeId: `type-${p.boothTypeName}`,
        boothTypeName: p.boothTypeName,
        x: p.x,
        y: p.y,
        width: p.width,
        length: p.length,
        label: p.label,
        occupied: false,
      })),
      totalBooths: layout.totalBooths,
      utilizationRate: layout.utilizationRate,
      notes: `Layout generated for ${formData.expectedEmployers} expected employers at ${selectedVenue.name}`,
      generatedAt: new Date(),
    };

    dispatch({ type: 'SET_LAYOUT', payload: layoutSuggestion });
  };

  const handleContinue = () => {
    if (!formData.clientName || !formData.universityName || !formData.eventName) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!selectedVenue) {
      toast.error('Please select a venue');
      return;
    }

    const clientIntake: ClientIntakeData = {
      id: `intake-${Date.now()}`,
      clientName: formData.clientName!,
      universityName: formData.universityName!,
      contactPerson: formData.contactPerson || '',
      contactEmail: formData.contactEmail || '',
      contactPhone: formData.contactPhone || '',
      eventName: formData.eventName!,
      eventDate: formData.eventDate!,
      eventDuration: formData.eventDuration || 2,
      venueId: formData.venueId || '',
      venueName: formData.venueName || '',
      estimatedBudget: formData.estimatedBudget || 0,
      expectedEmployers: formData.expectedEmployers || 50,
      expectedAttendees: formData.expectedAttendees || 3000,
      notes: formData.notes || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dispatch({ type: 'SET_CLIENT_INTAKE', payload: clientIntake });
    handleGenerateLayout();
    dispatch({ type: 'SET_STEP', payload: 'layout' });
    toast.success('Event information saved');
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-foreground mb-2">Event Onboarding</h1>
          <p className="text-lg text-muted-foreground">Set up your job fair event in a few simple steps</p>
        </div>

        <div className="grid gap-8">
          {/* Client Information */}
          <Card className="p-8 border border-border">
            <h2 className="text-2xl font-display font-bold mb-6">Client Information</h2>
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input
                    id="clientName"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleInputChange}
                    placeholder="e.g., Koperasi Poltekpar NHI"
                  />
                </div>
                <div>
                  <Label htmlFor="universityName">University/Organization Name *</Label>
                  <Input
                    id="universityName"
                    name="universityName"
                    value={formData.universityName}
                    onChange={handleInputChange}
                    placeholder="e.g., Poltekpar NHI Bandung"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input
                    id="contactPerson"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  placeholder="+62 XXX XXXX XXXX"
                />
              </div>
            </div>
          </Card>

          {/* Event Information */}
          <Card className="p-8 border border-border">
            <h2 className="text-2xl font-display font-bold mb-6">Event Information</h2>
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="eventName">Event Name *</Label>
                  <Input
                    id="eventName"
                    name="eventName"
                    value={formData.eventName}
                    onChange={handleInputChange}
                    placeholder="e.g., Grand Recruitment 2026"
                  />
                </div>
                <div>
                  <Label htmlFor="eventDate">Event Date</Label>
                  <Input
                    id="eventDate"
                    name="eventDate"
                    type="date"
                    value={formData.eventDate instanceof Date ? formData.eventDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, eventDate: new Date(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="eventDuration">Duration (days)</Label>
                  <Input
                    id="eventDuration"
                    name="eventDuration"
                    type="number"
                    value={formData.eventDuration}
                    onChange={handleInputChange}
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="expectedEmployers">Expected Employers</Label>
                  <Input
                    id="expectedEmployers"
                    name="expectedEmployers"
                    type="number"
                    value={formData.expectedEmployers}
                    onChange={handleInputChange}
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="expectedAttendees">Expected Attendees</Label>
                  <Input
                    id="expectedAttendees"
                    name="expectedAttendees"
                    type="number"
                    value={formData.expectedAttendees}
                    onChange={handleInputChange}
                    min="100"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any additional notes or requirements..."
                  rows={4}
                />
              </div>
            </div>
          </Card>

          {/* Venue Selection */}
          <Card className="p-8 border border-border">
            <h2 className="text-2xl font-display font-bold mb-6">Venue Selection</h2>
            <div className="grid gap-6">
              <div>
                <Label htmlFor="venue">Select Venue</Label>
                <Select value={selectedVenue?.id || ''} onValueChange={handleVenueSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a venue" />
                  </SelectTrigger>
                  <SelectContent>
                    {venues.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.name} ({venue.capacity} booths max)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedVenue && (
                <div className="bg-secondary/50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">{selectedVenue.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{selectedVenue.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold">Dimensions:</span> {selectedVenue.width}m × {selectedVenue.length}m
                    </div>
                    <div>
                      <span className="font-semibold">Total Area:</span> {selectedVenue.totalArea}m²
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="font-semibold text-sm">Amenities:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedVenue.amenities.map((amenity) => (
                        <span key={amenity} className="bg-primary/20 text-primary text-xs px-2 py-1 rounded">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Venue Cost */}
                  <div className="mt-4 pt-4 border-t border-border space-y-3">
                    <h4 className="font-semibold text-sm">Biaya Sewa Venue</h4>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={venueIsFree}
                        onChange={(e) => {
                          setVenueIsFree(e.target.checked);
                          if (e.target.checked) setVenueCostPerDay(0);
                          dispatch({ type: 'SET_VENUE_COST', payload: { costPerDay: e.target.checked ? 0 : venueCostPerDay, isFree: e.target.checked } });
                        }}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm">Venue ini gratis / disediakan oleh institusi</span>
                    </label>
                    {!venueIsFree && (
                      <div>
                        <Label className="text-sm">Harga sewa per hari (Rp)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={venueCostPerDay}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setVenueCostPerDay(val);
                            dispatch({ type: 'SET_VENUE_COST', payload: { costPerDay: val, isFree: false } });
                          }}
                          placeholder="e.g. 5000000"
                          className="mt-1"
                        />
                        {venueCostPerDay > 0 && formData.eventDuration && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Total {formData.eventDuration} hari = Rp {(venueCostPerDay * formData.eventDuration).toLocaleString('id-ID')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Button variant="outline" onClick={() => { dispatch({ type: 'RESET' }); window.location.href = '/'; }}>
              ← Kembali ke Beranda
            </Button>
            <Button onClick={handleContinue} size="lg">
              Continue to Layout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
