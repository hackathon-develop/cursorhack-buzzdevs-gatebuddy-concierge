// AirportMap: Main SVG-based interactive airport terminal map
// Design: Swiss Rationalism - precise spatial visualization, clear information hierarchy

import { useState, useMemo } from 'react';
import { TerminalLayout } from '@/components/map/TerminalLayout';
import { POIMarkers } from '@/components/map/POIMarkers';
import { UserLocationMarker } from '@/components/map/UserLocationMarker';
import { DestinationMarker } from '@/components/map/DestinationMarker';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import type { POI, Zone, TimelineStep } from '@/lib/airportLogic';

interface Location {
  x: number;
  y: number;
  terminal: string;
}

interface AirportMapProps {
  currentLocation: Location | null;
  destination: Location | null;
  destinationLabel?: string;
  pois: POI[];
  zones: Zone[];
  timeline: TimelineStep[];
  onPOIClick: (poi: POI) => void;
}

const INITIAL_VIEWBOX = '0 0 1200 800';
const MIN_SCALE = 1;
const MAX_SCALE = 3;

export default function AirportMap({
  currentLocation,
  destination,
  destinationLabel = 'Gate',
  pois,
  zones,
  onPOIClick,
}: AirportMapProps) {
  const [scale, setScale] = useState(1);
  const [selectedPOI, setSelectedPOI] = useState<string | undefined>();

  // Get terminal ID from current location
  const terminalId = useMemo(() => {
    return currentLocation?.terminal || 'T1';
  }, [currentLocation]);

  // Memoize viewBox calculation
  const viewBox = useMemo(() => {
    if (scale === 1) return INITIAL_VIEWBOX;

    // Calculate offset to center zoom
    const centerX = 600; // Center of 1200 width
    const centerY = 400; // Center of 800 height
    const zoomedWidth = 1200 / scale;
    const zoomedHeight = 800 / scale;

    const x = centerX - zoomedWidth / 2;
    const y = centerY - zoomedHeight / 2;

    return `${x} ${y} ${zoomedWidth} ${zoomedHeight}`;
  }, [scale]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, MAX_SCALE));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.5, MIN_SCALE));
  };

  const handleReset = () => {
    setScale(1);
  };

  const handlePOIClick = (poi: POI) => {
    setSelectedPOI(poi.id);
    onPOIClick(poi);
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg overflow-hidden border border-slate-200">
      {/* SVG Map Canvas */}
      <svg
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
        style={{ background: 'white' }}
      >
        {/* Terminal backgrounds and labels */}
        <TerminalLayout zones={zones} terminalId={terminalId} />

        {/* POI markers - all categories */}
        <POIMarkers pois={pois} onClick={handlePOIClick} selectedId={selectedPOI} />

        {/* User location indicator */}
        {currentLocation && <UserLocationMarker location={currentLocation} />}

        {/* Destination marker */}
        {destination && <DestinationMarker location={destination} label={destinationLabel} />}
      </svg>

      {/* Map Controls - bottom right */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomIn}
          disabled={scale >= MAX_SCALE}
          className="bg-white shadow-lg hover:bg-slate-50"
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomOut}
          disabled={scale <= MIN_SCALE}
          className="bg-white shadow-lg hover:bg-slate-50"
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleReset}
          disabled={scale === MIN_SCALE}
          className="bg-white shadow-lg hover:bg-slate-50"
          title="Reset zoom"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Legend - top left */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-4 max-w-xs">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Map Legend</h3>

        {/* Location indicators */}
        <div className="mb-3 pb-3 border-b border-slate-200">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600" />
              <span className="text-slate-700">Your Location</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-600" />
              <span className="text-slate-700">Destination</span>
            </div>
          </div>
        </div>

        {/* POI categories */}
        <div className="text-xs">
          <p className="font-medium text-slate-700 mb-2">Services & Amenities</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center border border-slate-400 rounded text-xs">
                ☕
              </div>
              <span className="text-slate-700">Cafés</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center border border-slate-400 rounded text-xs">
                🍴
              </div>
              <span className="text-slate-700">Restaurants</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center border border-slate-400 rounded text-xs">
                🍷
              </div>
              <span className="text-slate-700">Bars</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center border border-slate-400 rounded text-xs">
                🛋️
              </div>
              <span className="text-slate-700">Lounges</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center border border-slate-400 rounded text-xs">
                🛍️
              </div>
              <span className="text-slate-700">Shops</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center border border-slate-400 rounded text-xs">
                ℹ️
              </div>
              <span className="text-slate-700">Services</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 mt-3">Click markers for details</p>
      </div>

      {/* Zoom level indicator - top right */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md px-3 py-2 text-xs font-medium text-slate-600">
        {Math.round(scale * 100)}%
      </div>
    </div>
  );
}
