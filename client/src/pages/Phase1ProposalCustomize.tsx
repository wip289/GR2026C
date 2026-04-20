import { useState } from 'react';
import { usePhase1 } from '@/contexts/Phase1Context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { ProposalCustomization } from '@/lib/phase1Types';

export default function Phase1ProposalCustomize() {
  const { state, dispatch } = usePhase1();
  const [, setLocation] = useLocation();
  const { clientIntake, selectedVenue, layoutSuggestion } = state;

  const [customization, setCustomization] = useState<Partial<ProposalCustomization>>({
    eventName: clientIntake?.eventName || '',
    eventDate: clientIntake?.eventDate?.toISOString().split('T')[0] || '',
    eventDuration: clientIntake?.eventDuration || 2,
    venueLocation: selectedVenue?.location || '',
    clientName: clientIntake?.clientName || '',
    universityName: clientIntake?.universityName || '',
    expectedAttendees: `${clientIntake?.expectedAttendees || 3000}`,
    mainProgram: [
      'On-site recruitment sessions at the company booth',
      'In-person interviews with selected candidates',
      'Networking session with academics and industry professionals',
      'Introduction to company culture and values',
    ],
    supportingProgram: [
      'Career Workshop',
      'Industry Talk Show',
      'CV Clinic',
      'Company Presentation',
    ],
    audienceSegments: [
      'Fresh Graduates',
      'NHI Alumni',
      'Active Students',
      'Public Job Seekers',
    ],
    fieldsOfExpertise: [
      'Hospitality Services',
      'MICE',
      'Cruise Line',
      'Hotel Management',
      'Travel & Tourism',
      'HR',
      'Event Management',
      'Culinary Arts',
    ],
    industryTargets: [
      'Cruise Line',
      'Hotel & Resort',
      'Tour & Travel',
      'FnB & Restaurant',
      'Spa & Wellness',
      'MICE Industry',
    ],
    boothPackages: [
      {
        id: 'main',
        name: 'Main Booth',
        dimensions: '5 × 5 m',
        price: 10000000,
        features: [
          'Strategic booth location',
          'Digital branding across all platforms',
          'Exclusive VIP lounge',
          '220V power supply',
          'Tables and chairs',
          'Dedicated WiFi access',
        ],
        quantity: 12,
      },
      {
        id: 'standard',
        name: 'Standard Booth',
        dimensions: '3 × 3 m',
        price: 7500000,
        features: [
          'Strategic booth location',
          '220V power supply',
          'Tables and chairs',
          'Dedicated WiFi access',
        ],
        quantity: 36,
      },
    ],
    sponsorTiers: [
      {
        id: 'platinum',
        name: 'Platinum | Main Sponsor',
        price: 25000000,
        benefits: [
          'Biggest logo on every promotion media',
          'Company presentation at main stage (15 minutes)',
          'Company mention at social media (8 posts)',
          'Full page advertisement in event guidebook',
          'Photo session with organizing committee',
          'VIP access for 3 people',
        ],
        color: '#2D5A5A',
      },
      {
        id: 'gold',
        name: 'Gold | Premium Sponsor',
        price: 15000000,
        benefits: [
          'Logo on main promotion media',
          'Company presentation at main stage (10 minutes)',
          'Company mention at social media (5 posts)',
          'Full page advertisement in event guidebook',
          'VIP access for 2 people',
        ],
        color: '#D4A574',
      },
      {
        id: 'silver',
        name: 'Silver | Supporting Sponsor',
        price: 7500000,
        benefits: [
          'Logo on promotion media',
          'Company mention at social media (3 posts)',
          'Quarter page advertisement in event guidebook',
          'Standard access for 2 people',
        ],
        color: '#999999',
      },
    ],
    contactEmail: clientIntake?.contactEmail || '',
    contactPhone: clientIntake?.contactPhone || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomization((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGenerateProposal = () => {
    if (!customization.eventName) {
      toast.error('Please fill in event name');
      return;
    }

    dispatch({
      type: 'SET_PROPOSAL_CUSTOMIZATION',
      payload: customization as ProposalCustomization,
    });

    dispatch({ type: 'SET_STEP', payload: 'proposal-preview' });
    setLocation('/phase1/proposal-preview');
    toast.success('Proposal customization saved');
  };

  const handleBack = () => {
    dispatch({ type: 'SET_STEP', payload: 'layout' });
    setLocation('/phase1/layout');
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-foreground mb-2">Customize Proposal</h1>
          <p className="text-lg text-muted-foreground">
            Tailor the proposal content before generating PDFs
          </p>
        </div>

        <div className="grid gap-8">
          {/* Event Details */}
          <Card className="p-8 border border-border">
            <h2 className="text-2xl font-display font-bold mb-6">Event Details</h2>
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="eventName">Event Name</Label>
                  <Input
                    id="eventName"
                    name="eventName"
                    value={customization.eventName}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="eventDate">Event Date</Label>
                  <Input
                    id="eventDate"
                    name="eventDate"
                    type="date"
                    value={customization.eventDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="venueLocation">Venue Location</Label>
                  <Input
                    id="venueLocation"
                    name="venueLocation"
                    value={customization.venueLocation}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="expectedAttendees">Expected Attendees</Label>
                  <Input
                    id="expectedAttendees"
                    name="expectedAttendees"
                    value={customization.expectedAttendees}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Audience & Industries */}
          <Card className="p-8 border border-border">
            <h2 className="text-2xl font-display font-bold mb-6">Audience & Industries</h2>
            <div className="grid gap-6">
              <div>
                <Label>Audience Segments</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {customization.audienceSegments?.map((segment) => (
                    <span key={segment} className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm">
                      {segment}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <Label>Fields of Expertise</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {customization.fieldsOfExpertise?.map((field) => (
                    <span key={field} className="bg-accent/20 text-accent-foreground px-3 py-1 rounded-full text-sm">
                      {field}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <Label>Industry Targets</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {customization.industryTargets?.map((industry) => (
                    <span key={industry} className="bg-secondary/50 text-foreground px-3 py-1 rounded-full text-sm">
                      {industry}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Booth & Sponsor Summary */}
          <Card className="p-8 border border-border">
            <h2 className="text-2xl font-display font-bold mb-6">Investment Packages</h2>
            
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Booth Packages</h3>
              <div className="space-y-3">
                {customization.boothPackages?.map((booth) => (
                  <div key={booth.id} className="p-4 bg-secondary/50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold">{booth.name}</div>
                        <div className="text-sm text-muted-foreground">{booth.dimensions}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">Rp {booth.price.toLocaleString('id-ID')}</div>
                        <div className="text-sm text-muted-foreground">Qty: {booth.quantity}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Sponsorship Tiers</h3>
              <div className="space-y-3">
                {customization.sponsorTiers?.map((tier) => (
                  <div key={tier.id} className="p-4 bg-secondary/50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold">{tier.name}</div>
                      <div className="font-bold text-primary">Rp {tier.price.toLocaleString('id-ID')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Contact Information */}
          <Card className="p-8 border border-border">
            <h2 className="text-2xl font-display font-bold mb-6">Contact Information</h2>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  value={customization.contactEmail}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  name="contactPhone"
                  value={customization.contactPhone}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-between">
            <Button variant="outline" onClick={handleBack} className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>

            <Button onClick={handleGenerateProposal} size="lg" className="gap-2">
              Generate Proposals <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
