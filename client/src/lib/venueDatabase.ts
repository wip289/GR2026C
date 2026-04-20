import { Venue } from './phase1Types';

/**
 * Pre-loaded venue database
 * Starting with Wisnu's main venue (Gedung Graha I Gede Ardika)
 * More venues can be added later
 */

export const venueDatabase: Venue[] = [
  {
    id: 'venue-001',
    name: 'Gedung Graha I Gede Ardika (Dome)',
    location: 'Poltekpar NHI Bandung, Bandung, Indonesia',
    totalArea: 3500, // estimated total area in m²
    width: 70, // meters
    length: 50, // meters
    description:
      'Large dome-shaped venue at Poltekpar NHI Bandung. Perfect for large-scale job fairs with excellent infrastructure. Features AC, WiFi, and ample parking.',
    capacity: 60, // estimated booth capacity
    amenities: [
      'Air Conditioning',
      'WiFi',
      'Parking',
      'Loading Dock',
      'Stage Area',
      'Interview Rooms',
      'Power Supply (220V)',
      'Water & Utilities',
    ],
    createdAt: new Date('2026-01-01'),
  },
];

/**
 * Get venue by ID
 */
export function getVenueById(id: string): Venue | undefined {
  return venueDatabase.find((v) => v.id === id);
}

/**
 * Get all venues
 */
export function getAllVenues(): Venue[] {
  return venueDatabase;
}

/**
 * Add new venue (for future expansion)
 */
export function addVenue(venue: Omit<Venue, 'createdAt'>): Venue {
  const newVenue: Venue = {
    ...venue,
    createdAt: new Date(),
  };
  venueDatabase.push(newVenue);
  return newVenue;
}

/**
 * Calculate booth layout based on venue dimensions and booth types
 * This is a simple algorithm that arranges booths in a grid pattern
 */
export function calculateBoothLayout(
  venueWidth: number,
  venueLength: number,
  boothTypes: Array<{ name: string; width: number; length: number; quantity: number }>
) {
  const positions: Array<{
    boothTypeName: string;
    x: number;
    y: number;
    width: number;
    length: number;
    label: string;
  }> = [];

  let currentX = 2; // 2m margin from left
  let currentY = 2; // 2m margin from top
  let rowHeight = 0;
  let boothCounter: { [key: string]: number } = {};

  const maxWidth = venueWidth - 4; // leave 2m margin on each side
  const maxLength = venueLength - 4;

  for (const boothType of boothTypes) {
    boothCounter[boothType.name] = 0;

    for (let i = 0; i < boothType.quantity; i++) {
      boothCounter[boothType.name]++;

      // Check if booth fits in current row
      if (currentX + boothType.width + 1 > maxWidth) {
        // Move to next row
        currentX = 2;
        currentY += rowHeight + 1; // 1m spacing between rows
        rowHeight = 0;
      }

      // Check if booth fits in venue length
      if (currentY + boothType.length > maxLength) {
        console.warn(`Not enough space for all booths. Booth ${boothType.name} #${i + 1} may not fit.`);
        break;
      }

      positions.push({
        boothTypeName: boothType.name,
        x: currentX,
        y: currentY,
        width: boothType.width,
        length: boothType.length,
        label: `${boothType.name} ${boothCounter[boothType.name]}`,
      });

      currentX += boothType.width + 1; // 1m spacing between booths
      rowHeight = Math.max(rowHeight, boothType.length);
    }
  }

  return {
    positions,
    totalBooths: positions.length,
    utilizationRate: (positions.reduce((sum, p) => sum + p.width * p.length, 0) / (maxWidth * maxLength)) * 100,
  };
}
