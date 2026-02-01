// Map utilities for coordinate conversion and styling
// Design: Swiss Rationalism - precise calculations, consistent visual system

// Abstract coordinate bounds (from airport.json analysis)
const ABSTRACT_MIN_X = 100;
const ABSTRACT_MAX_X = 420;
const ABSTRACT_MIN_Y = 75;
const ABSTRACT_MAX_Y = 520;

// SVG canvas dimensions
const SVG_WIDTH = 1200;
const SVG_HEIGHT = 800;

/**
 * Convert abstract airport coordinates to SVG canvas coordinates
 * Maps the abstract coordinate system (100-420 x, 75-520 y)
 * to the SVG viewBox (0-1200 x, 0-800 y)
 */
export function toSVGCoords(abstractX: number, abstractY: number): { x: number; y: number } {
  const x = ((abstractX - ABSTRACT_MIN_X) / (ABSTRACT_MAX_X - ABSTRACT_MIN_X)) * SVG_WIDTH;
  const y = ((abstractY - ABSTRACT_MIN_Y) / (ABSTRACT_MAX_Y - ABSTRACT_MIN_Y)) * SVG_HEIGHT;
  return { x, y };
}

/**
 * Convert SVG coordinates back to abstract airport coordinates
 * (useful for click handling and inverse transforms)
 */
export function fromSVGCoords(svgX: number, svgY: number): { x: number; y: number } {
  const abstractX = (svgX / SVG_WIDTH) * (ABSTRACT_MAX_X - ABSTRACT_MIN_X) + ABSTRACT_MIN_X;
  const abstractY = (svgY / SVG_HEIGHT) * (ABSTRACT_MAX_Y - ABSTRACT_MIN_Y) + ABSTRACT_MIN_Y;
  return { x: abstractX, y: abstractY };
}

/**
 * Get color for POI category
 * Traffic-light system: green=safe/lounge, amber=cafe, red=restaurant, etc.
 */
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    cafe: '#f59e0b',         // Amber - quick options
    restaurant: '#ef4444',   // Red - sit-down, takes time
    bar: '#8b5cf6',          // Purple - alcoholic beverages
    shop: '#06b6d4',         // Cyan - retail
    lounge: '#10b981',       // Green - premium amenity
    service: '#6366f1',      // Indigo - restrooms, info
  };
  return colors[category] || '#64748b'; // Default slate if unknown
}

/**
 * Get status color based on timeline status
 * Matches traffic light system used in UI
 */
export function getStatusColor(status: 'safe' | 'tight' | 'risky'): string {
  const colors = {
    safe: '#10b981',    // Green
    tight: '#f59e0b',   // Amber/Yellow
    risky: '#ef4444',   // Red
  };
  return colors[status];
}

/**
 * Get icon name for category (for rendering lucide icons)
 * Maps category to appropriate icon identifier
 */
export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    cafe: 'coffee',
    restaurant: 'utensils',
    bar: 'wine',
    shop: 'shopping-cart',
    lounge: 'armchair',
    service: 'info',
  };
  return icons[category] || 'map-pin';
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: string): string {
  const names: Record<string, string> = {
    cafe: 'Café',
    restaurant: 'Restaurant',
    bar: 'Bar',
    shop: 'Shop',
    lounge: 'Lounge',
    service: 'Service',
  };
  return names[category] || 'POI';
}

/**
 * Get terminal bounds in SVG coordinates
 * Useful for terminal backgrounds and labels
 */
export function getTerminalBounds(terminal: string, zones: Array<{ terminal: string; x: number; y: number }>): { minX: number; minY: number; maxX: number; maxY: number; centerX: number; centerY: number; width: number; height: number } {
  const terminalZones = zones.filter(z => z.terminal === terminal);

  if (terminalZones.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, centerX: 0, centerY: 0, width: 0, height: 0 };
  }

  // Find bounds in abstract coordinates
  const abstractMinX = Math.min(...terminalZones.map(z => z.x)) - 30;
  const abstractMaxX = Math.max(...terminalZones.map(z => z.x)) + 30;
  const abstractMinY = Math.min(...terminalZones.map(z => z.y)) - 30;
  const abstractMaxY = Math.max(...terminalZones.map(z => z.y)) + 30;

  // Convert to SVG coordinates
  const { x: minX, y: minY } = toSVGCoords(abstractMinX, abstractMinY);
  const { x: maxX, y: maxY } = toSVGCoords(abstractMaxX, abstractMaxY);

  return {
    minX,
    minY,
    maxX,
    maxY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    width: maxX - minX,
    height: maxY - minY,
  };
}
