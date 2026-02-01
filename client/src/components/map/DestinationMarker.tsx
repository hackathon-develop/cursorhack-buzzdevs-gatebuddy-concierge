// Destination Marker: Shows the target gate/location with flag icon
// Design: Swiss Rationalism - distinct visual marker for end destination

import { toSVGCoords } from '@/lib/mapUtils';

interface Location {
  x: number;
  y: number;
  terminal: string;
}

interface DestinationMarkerProps {
  location: Location;
  label: string;
}

export function DestinationMarker({ location, label }: DestinationMarkerProps) {
  const { x, y } = toSVGCoords(location.x, location.y);

  return (
    <g id="destination-marker" transform={`translate(${x}, ${y})`}>
      {/* Flag shape - destination icon */}
      <path
        d="M 0,-12 L 22,-6 L 22,6 L 0,2 Z"
        fill="#ef4444"
        stroke="white"
        strokeWidth="2"
        className="drop-shadow-lg"
        pointerEvents="none"
      />

      {/* Flagpole */}
      <line
        x1="0"
        y1="-12"
        x2="0"
        y2="24"
        stroke="#991b1b"
        strokeWidth="2.5"
        pointerEvents="none"
      />

      {/* Label below marker */}
      <text
        y="40"
        textAnchor="middle"
        className="text-sm font-bold"
        fontSize="14"
        fontWeight="700"
        fill="#7f1d1d"
        pointerEvents="none"
      >
        {label}
      </text>
    </g>
  );
}
