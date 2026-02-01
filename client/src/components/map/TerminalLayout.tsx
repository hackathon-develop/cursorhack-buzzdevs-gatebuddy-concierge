// Terminal Layout: Organic airport terminal map with gates around perimeter
// Design: Real airport wayfinding inspired - elliptical terminal, icon-based markers

import { useMemo } from 'react';
import type { Zone } from '@/lib/airportLogic';

interface TerminalLayoutProps {
  zones: Zone[];
  terminalId?: string; // 'T1', 'T2', or 'T3'
}

export function TerminalLayout({ zones, terminalId = 'T1' }: TerminalLayoutProps) {
  // Filter zones for this terminal
  const terminalZones = useMemo(
    () => zones.filter(z => z.terminal === terminalId),
    [zones, terminalId]
  );

  // Find gate zones
  const gateZones = useMemo(
    () => terminalZones.filter(z => z.id.includes('gates')),
    [terminalZones]
  );

  // Center coordinates for terminal
  const centerX = 600;
  const centerY = 400;
  const ellipseRx = 350;
  const ellipseRy = 250;

  return (
    <g id={`terminal-${terminalId}`}>
      {/* Central terminal building - organic ellipse */}
      <ellipse
        cx={centerX}
        cy={centerY}
        rx={ellipseRx}
        ry={ellipseRy}
        fill="#e5e7eb"
        stroke="#9ca3af"
        strokeWidth="2"
        opacity="0.85"
        pointerEvents="none"
      />

      {/* Airport title */}
      <text
        x={centerX}
        y="30"
        fontSize="22"
        fontWeight="700"
        fill="#1f2937"
        textAnchor="middle"
        pointerEvents="none"
      >
        Terminal {terminalId.replace('T', '')}
      </text>

      {/* Gate labels positioned around perimeter */}
      {gateZones.map((gate, idx) => {
        // Split gates: A gates on left, B gates on right
        const gatesPerSide = Math.ceil(gateZones.length / 2);
        const isLeftSide = idx < gatesPerSide;

        // Position gates around the ellipse perimeter
        const gateX = isLeftSide ? 160 : 1040;
        const baseY = 200;
        const spacing = 80;
        const localIdx = isLeftSide ? idx : idx - gatesPerSide;
        const gateY = baseY + (localIdx * spacing);

        // Extract gate label (e.g., "Gates A1-A15" -> "A1")
        const parts = gate.name.split(' ');
        const gateRange = parts[1] || '';
        const gateLabel = gateRange.split('-')[0] || 'A1';

        return (
          <g key={gate.id}>
            {/* Gate label rectangle with yellow background */}
            <rect
              x={gateX - 32}
              y={gateY - 22}
              width="64"
              height="44"
              fill="#fbbf24"
              stroke="#d97706"
              strokeWidth="2.5"
              rx="8"
              pointerEvents="none"
            />
            <text
              x={gateX}
              y={gateY + 8}
              fontSize="16"
              fontWeight="700"
              fill="#1f2937"
              textAnchor="middle"
              pointerEvents="none"
            >
              {gateLabel}
            </text>

            {/* Optional: Dashed walkway line from gate to terminal */}
            <line
              x1={gateX}
              y1={gateY}
              x2={isLeftSide ? centerX - 320 : centerX + 320}
              y2={centerY}
              stroke="#cbd5e1"
              strokeWidth="1.5"
              strokeDasharray="6 3"
              opacity="0.4"
              pointerEvents="none"
            />
          </g>
        );
      })}
    </g>
  );
}
