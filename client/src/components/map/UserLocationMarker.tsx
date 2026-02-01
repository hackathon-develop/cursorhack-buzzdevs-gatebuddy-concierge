// User Location Marker: Shows current user position with pulsing animation
// Design: Swiss Rationalism - clear visual hierarchy, animated indicator

import { toSVGCoords } from '@/lib/mapUtils';

interface Location {
  x: number;
  y: number;
  terminal: string;
}

interface UserLocationMarkerProps {
  location: Location;
}

export function UserLocationMarker({ location }: UserLocationMarkerProps) {
  const { x, y } = toSVGCoords(location.x, location.y);

  return (
    <g id="user-location" transform={`translate(${x}, ${y})`}>
      {/* Outer pulsing ring */}
      <circle
        r="30"
        fill="#3b82f6"
        opacity="0.2"
        className="animate-pulse"
        pointerEvents="none"
      />

      {/* Mid-range indicator */}
      <circle
        r="20"
        fill="#3b82f6"
        opacity="0.4"
        pointerEvents="none"
      />

      {/* Inner circle - actual position */}
      <circle
        r="12"
        fill="#2563eb"
        stroke="white"
        strokeWidth="3"
        className="drop-shadow-lg"
        pointerEvents="none"
      />

      {/* Label below marker */}
      <text
        y="45"
        textAnchor="middle"
        className="text-xs font-semibold"
        fontSize="12"
        fontWeight="600"
        fill="#1e40af"
        pointerEvents="none"
      >
        You are here
      </text>
    </g>
  );
}
