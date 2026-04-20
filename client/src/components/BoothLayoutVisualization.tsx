import { BoothPosition } from '@/lib/phase1Types';

interface BoothLayoutVisualizationProps {
  boothPositions: BoothPosition[];
  venueWidth: number;
  venueLength: number;
  scale?: number; // pixels per meter
}

export function BoothLayoutVisualization({
  boothPositions,
  venueWidth,
  venueLength,
  scale = 30,
}: BoothLayoutVisualizationProps) {
  const svgWidth = venueWidth * scale;
  const svgHeight = venueLength * scale;

  // Group booths by type for color coding
  const boothTypeColors: { [key: string]: string } = {
    'Main Booth (5×5m)': '#2D5A5A', // teal
    'Standard Booth (3×3m)': '#D4A574', // gold
    'Interview Room': '#8B7355', // brown
    'Special Booth': '#6B9B9b', // light teal
  };

  return (
    <div className="w-full overflow-auto bg-background border border-border rounded-lg p-4">
      <svg width={svgWidth} height={svgHeight} className="border border-border bg-white">
        {/* Venue background */}
        <rect width={svgWidth} height={svgHeight} fill="#fafaf8" stroke="#d4a574" strokeWidth="2" />

        {/* Grid lines for reference */}
        {Array.from({ length: Math.ceil(venueWidth) + 1 }).map((_, i) => (
          <line
            key={`v-${i}`}
            x1={i * scale}
            y1="0"
            x2={i * scale}
            y2={svgHeight}
            stroke="#e5e5e0"
            strokeWidth="1"
            strokeDasharray="5,5"
          />
        ))}
        {Array.from({ length: Math.ceil(venueLength) + 1 }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1="0"
            y1={i * scale}
            x2={svgWidth}
            y2={i * scale}
            stroke="#e5e5e0"
            strokeWidth="1"
            strokeDasharray="5,5"
          />
        ))}

        {/* Booths */}
        {boothPositions.map((booth, idx) => {
          const x = booth.x * scale;
          const y = booth.y * scale;
          const width = booth.width * scale;
          const height = booth.length * scale;
          const color = boothTypeColors[booth.boothTypeName] || '#999';

          return (
            <g key={booth.id}>
              {/* Booth rectangle */}
              <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={color}
                fillOpacity="0.7"
                stroke={color}
                strokeWidth="2"
              />

              {/* Booth label */}
              <text
                x={x + width / 2}
                y={y + height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12"
                fontWeight="bold"
                fill="white"
                pointerEvents="none"
              >
                {booth.label}
              </text>

              {/* Booth number */}
              <text
                x={x + 5}
                y={y + 15}
                fontSize="10"
                fill="white"
                pointerEvents="none"
              >
                {booth.width}×{booth.length}m
              </text>
            </g>
          );
        })}

        {/* Venue dimensions labels */}
        <text x={svgWidth / 2} y={svgHeight + 20} textAnchor="middle" fontSize="12" fill="#666">
          {venueWidth}m
        </text>
        <text x={-20} y={svgHeight / 2} textAnchor="middle" fontSize="12" fill="#666" transform={`rotate(-90 -20 ${svgHeight / 2})`}>
          {venueLength}m
        </text>
      </svg>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(boothTypeColors).map(([type, color]) => {
          const count = boothPositions.filter((b) => b.boothTypeName === type).length;
          if (count === 0) return null;

          return (
            <div key={type} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: color, opacity: 0.7 }}
              />
              <span className="text-sm">
                {type} ({count})
              </span>
            </div>
          );
        })}
      </div>

      {/* Statistics */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-secondary/50 p-3 rounded">
          <div className="font-semibold">Total Booths</div>
          <div className="text-lg text-primary">{boothPositions.length}</div>
        </div>
        <div className="bg-secondary/50 p-3 rounded">
          <div className="font-semibold">Venue Size</div>
          <div className="text-lg text-primary">{venueWidth}×{venueLength}m</div>
        </div>
        <div className="bg-secondary/50 p-3 rounded">
          <div className="font-semibold">Total Area</div>
          <div className="text-lg text-primary">{venueWidth * venueLength}m²</div>
        </div>
        <div className="bg-secondary/50 p-3 rounded">
          <div className="font-semibold">Booth Area</div>
          <div className="text-lg text-primary">
            {(boothPositions.reduce((sum, b) => sum + b.width * b.length, 0) / (venueWidth * venueLength) * 100).toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}
