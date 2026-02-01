// POI Markers: Icon-based markers in diamond containers
// Design: Real airport wayfinding - clean icons, minimal visual footprint

import { useMemo } from 'react';
import { toSVGCoords } from '@/lib/mapUtils';
import type { POI } from '@/lib/airportLogic';

interface POIMarkersProps {
  pois: POI[];
  onClick: (poi: POI) => void;
  selectedId?: string;
}

/**
 * Render larger, clearer SVG icons for each category
 */
function getCategoryIconLarge(category: string) {
  const color = 'currentColor';
  const strokeW = 1.8;

  switch (category) {
    case 'cafe':
      // Coffee cup icon
      return (
        <g>
          {/* Cup */}
          <path
            d="M -7 -4 L -7 4 Q -7 6 -5 6 L 5 6 Q 7 6 7 4 L 7 -4"
            fill="none"
            stroke={color}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Handle */}
          <path
            d="M 7 0 Q 11 0 11 4 Q 11 8 7 8"
            fill="none"
            stroke={color}
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
        </g>
      );
    case 'restaurant':
      // Fork and spoon icon
      return (
        <g>
          {/* Fork - left side */}
          <line x1="-6" y1="-6" x2="-6" y2="6" stroke={color} strokeWidth={strokeW} strokeLinecap="round" />
          <line x1="-8" y1="-6" x2="-8" y2="2" stroke={color} strokeWidth={strokeW} strokeLinecap="round" />
          <line x1="-4" y1="-6" x2="-4" y2="2" stroke={color} strokeWidth={strokeW} strokeLinecap="round" />
          {/* Spoon - right side */}
          <ellipse cx="6" cy="-4" rx="3" ry="4" fill="none" stroke={color} strokeWidth={strokeW} />
          <line x1="6" y1="0" x2="6" y2="6" stroke={color} strokeWidth={strokeW} strokeLinecap="round" />
        </g>
      );
    case 'bar':
      // Wine glass icon
      return (
        <g>
          <path
            d="M -5 -5 L -5 -2 Q -5 3 0 5 Q 5 3 5 -2 L 5 -5 M -3 -5 L 3 -5"
            fill="none"
            stroke={color}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      );
    case 'shop':
      // Shopping cart icon
      return (
        <g>
          {/* Cart */}
          <rect x="-6" y="-3" width="10" height="7" fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round" />
          {/* Wheels */}
          <circle cx="-3" cy="6" r="2" fill="none" stroke={color} strokeWidth={strokeW} />
          <circle cx="3" cy="6" r="2" fill="none" stroke={color} strokeWidth={strokeW} />
        </g>
      );
    case 'lounge':
      // Armchair icon
      return (
        <g>
          {/* Left armrest */}
          <rect x="-7" y="-2" width="2" height="7" fill="none" stroke={color} strokeWidth={strokeW} rx="1" />
          {/* Right armrest */}
          <rect x="5" y="-2" width="2" height="7" fill="none" stroke={color} strokeWidth={strokeW} rx="1" />
          {/* Seat back */}
          <path d="M -5 -4 L -5 3" stroke={color} strokeWidth={strokeW} strokeLinecap="round" />
          {/* Seat */}
          <path d="M -5 3 L 5 3" stroke={color} strokeWidth={strokeW} strokeLinecap="round" />
          <path d="M 5 -4 L 5 3" stroke={color} strokeWidth={strokeW} strokeLinecap="round" />
        </g>
      );
    case 'service':
      // Info/person icon
      return (
        <g>
          {/* Head */}
          <circle cx="0" cy="-4" r="2.5" fill="none" stroke={color} strokeWidth={strokeW} />
          {/* Body */}
          <path d="M -3 -1 L 0 2 L 3 -1" fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round" />
          {/* Legs */}
          <line x1="0" y1="2" x2="0" y2="7" stroke={color} strokeWidth={strokeW} strokeLinecap="round" />
        </g>
      );
    default:
      return (
        <g>
          <circle cx="0" cy="0" r="4" fill="none" stroke={color} strokeWidth={strokeW} />
        </g>
      );
  }
}

export function POIMarkers({ pois, onClick, selectedId }: POIMarkersProps) {
  // Memoize converted coordinates
  const poisSVG = useMemo(
    () =>
      pois.map(poi => ({
        ...poi,
        svg: toSVGCoords(poi.x, poi.y),
      })),
    [pois]
  );

  return (
    <g id="poi-markers">
      {poisSVG.map(poi => {
        const isSelected = selectedId === poi.id;
        const strokeWidth = isSelected ? 3 : 2;

        return (
          <g
            key={poi.id}
            transform={`translate(${poi.svg.x}, ${poi.svg.y})`}
            onClick={() => onClick(poi)}
            className="cursor-pointer transition-all duration-200"
          >
            {/* Selection glow effect */}
            {isSelected && (
              <circle
                r="18"
                fill="#3b82f6"
                opacity="0.1"
                pointerEvents="none"
              />
            )}

            {/* Diamond container (rotated square) */}
            <rect
              x="-13"
              y="-13"
              width="26"
              height="26"
              fill="white"
              stroke="#1f2937"
              strokeWidth={strokeWidth}
              rx="3"
              transform="rotate(45)"
              className="drop-shadow-md transition-all duration-200"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}
            />

            {/* Icon content */}
            <g color="#1f2937" transform="scale(1)">
              {getCategoryIconLarge(poi.category)}
            </g>

            {/* Tooltip */}
            <title>{poi.name}</title>
          </g>
        );
      })}
    </g>
  );
}
