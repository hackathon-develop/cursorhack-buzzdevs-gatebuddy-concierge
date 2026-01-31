// Core logic functions for GateBuddy Concierge
// Design: Swiss Rationalism - precise calculations, functional clarity

import airportData from '@/data/airport.json';

export interface POI {
  id: string;
  name: string;
  category: string;
  terminal: string;
  zone: string;
  x: number;
  y: number;
  openingHours: string;
  avgWaitTime: [number, number];
  priceLevel: number;
  tags: string[];
  menu: string[];
  description: string;
}

export interface Zone {
  id: string;
  terminal: string;
  name: string;
  x: number;
  y: number;
}

export interface Gate {
  id: string;
  terminal: string;
  zone: string;
  x: number;
  y: number;
}

export interface UserPreferences {
  budget: 1 | 2 | 3; // €, €€, €€€
  foodType?: string;
  dietary?: string[];
  mealType?: 'quick-bite' | 'sit-down';
  mobility: 'normal' | 'reduced';
  loungeAccess: boolean;
}

export interface TripDetails {
  arrivalTime: Date;
  terminal: string;
  nextFlightTime?: Date;
  gateNumber?: string;
  isDomestic: boolean;
  currentZone?: string;
}

export interface TimelineStep {
  id: string;
  type: 'checkpoint' | 'poi' | 'gate';
  name: string;
  location: string;
  startTime: Date;
  duration: number; // minutes
  travelTime: number; // minutes
  status: 'safe' | 'tight' | 'risky';
  description: string;
}

/**
 * Calculate Euclidean distance between two points
 */
export function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Compute travel time from one location to another
 * @param from - Starting coordinates {x, y, terminal}
 * @param to - Destination coordinates {x, y, terminal}
 * @param mobilityMode - 'normal' or 'reduced'
 * @returns Travel time in minutes
 */
export function compute_travel_time(
  from: { x: number; y: number; terminal: string },
  to: { x: number; y: number; terminal: string },
  mobilityMode: 'normal' | 'reduced' = 'normal'
): number {
  const distance = calculateDistance(from.x, from.y, to.x, to.y);
  
  // Walking speed: 1.3 m/s for normal, 0.8 m/s for reduced mobility
  const walkingSpeed = mobilityMode === 'normal' ? 1.3 : 0.8;
  
  // Convert abstract distance to meters (scale factor)
  const distanceInMeters = distance * 2;
  
  // Calculate base walking time in seconds
  let travelTimeSeconds = distanceInMeters / walkingSpeed;
  
  // Add terminal change penalty (10 minutes if different terminals)
  if (from.terminal !== to.terminal) {
    travelTimeSeconds += 600; // 10 minutes in seconds
  }
  
  // Convert to minutes and round up
  return Math.ceil(travelTimeSeconds / 60);
}

/**
 * Estimate queue times based on time of day and checkpoint type
 */
export function estimate_queue_times(
  time: Date,
  terminal: string,
  checkpointType: 'security' | 'passport' | 'baggage',
  isDomestic: boolean
): number {
  const hour = time.getHours();
  
  // Peak hours: 6-9 AM and 4-7 PM
  const isPeakHour = (hour >= 6 && hour <= 9) || (hour >= 16 && hour <= 19);
  
  let baseTime = 0;
  
  switch (checkpointType) {
    case 'security':
      baseTime = isPeakHour ? 20 : 10;
      break;
    case 'passport':
      baseTime = isDomestic ? 0 : (isPeakHour ? 25 : 15);
      break;
    case 'baggage':
      baseTime = isPeakHour ? 20 : 15;
      break;
  }
  
  return baseTime;
}

/**
 * Check if a POI is currently open
 */
export function isPOIOpen(poi: POI, currentTime: Date): boolean {
  if (poi.openingHours === '24/7') return true;
  
  const [openStr, closeStr] = poi.openingHours.split('-');
  const [openHour, openMin] = openStr.split(':').map(Number);
  const [closeHour, closeMin] = closeStr.split(':').map(Number);
  
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;
  
  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
}

/**
 * Recommend POIs based on user constraints
 */
export function recommend_pois(
  userLocation: { x: number; y: number; terminal: string },
  preferences: UserPreferences,
  currentTime: Date,
  availableTime?: number // minutes available
): POI[] {
  const pois = airportData.pois as POI[];
  
  let filtered = pois.filter(poi => {
    // Filter by budget
    if (poi.priceLevel > preferences.budget) return false;
    
    // Filter by dietary restrictions (only if specified)
    // Show all options but prioritize matching ones in sorting
    
    // Filter by meal type (only if specified)
    // Show all options but prioritize matching ones in sorting
    
    // Filter by lounge access
    if (preferences.loungeAccess && poi.category === 'lounge') {
      return true;
    }
    
    // Check if open
    if (!isPOIOpen(poi, currentTime)) return false;
    
    return true;
  });
  
  // Calculate travel time and total time for each POI
  const poisWithTime = filtered.map(poi => {
    const travelTime = compute_travel_time(
      userLocation,
      { x: poi.x, y: poi.y, terminal: poi.terminal },
      preferences.mobility
    );
    
    const avgServiceTime = (poi.avgWaitTime[0] + poi.avgWaitTime[1]) / 2;
    const totalTime = travelTime + avgServiceTime;
    
    return {
      ...poi,
      travelTime,
      totalTime
    };
  });
  
  // Filter by available time if specified
  let recommended = poisWithTime;
  if (availableTime) {
    recommended = poisWithTime.filter(poi => poi.totalTime <= availableTime);
  }
  
  // Sort by relevance: dietary match, meal type match, then total time
  recommended.sort((a, b) => {
    // Calculate match scores
    let scoreA = 0;
    let scoreB = 0;
    
    // Dietary preference match (higher priority)
    if (preferences.dietary && preferences.dietary.length > 0) {
      const hasMatchA = preferences.dietary.some(diet => a.tags.includes(diet.toLowerCase()));
      const hasMatchB = preferences.dietary.some(diet => b.tags.includes(diet.toLowerCase()));
      if (hasMatchA) scoreA += 1000;
      if (hasMatchB) scoreB += 1000;
    }
    
    // Meal type match
    if (preferences.mealType) {
      if (a.tags.includes(preferences.mealType)) scoreA += 500;
      if (b.tags.includes(preferences.mealType)) scoreB += 500;
    }
    
    // Subtract time to prioritize faster options
    scoreA -= a.totalTime;
    scoreB -= b.totalTime;
    
    return scoreB - scoreA; // Higher score first
  });
  
  return recommended.slice(0, 20); // Return top 20
}

/**
 * Get zone coordinates by zone ID
 */
export function getZoneCoordinates(zoneId: string): { x: number; y: number; terminal: string } | null {
  const zone = (airportData.zones as Zone[]).find(z => z.id === zoneId);
  if (!zone) return null;
  return { x: zone.x, y: zone.y, terminal: zone.terminal };
}

/**
 * Get gate coordinates by gate ID
 * Gates are located in gate zones, so we estimate based on gate number
 */
export function getGateCoordinates(gateId: string): { x: number; y: number; terminal: string } | null {
  // Extract terminal and gate number from gate ID (e.g., "A12", "B5", "C20")
  const match = gateId.match(/^([A-Z])(\d+)$/);
  if (!match) return null;
  
  const pier = match[1];
  const gateNum = parseInt(match[2]);
  
  // Map piers to terminals and zones
  const pierMap: Record<string, { terminal: string; zoneId: string }> = {
    'A': { terminal: 'T1', zoneId: 't1-gates-a' },
    'B': { terminal: 'T1', zoneId: 't1-gates-b' },
    'C': { terminal: 'T2', zoneId: 't2-gates-c' },
    'D': { terminal: 'T3', zoneId: 't3-gates-d' },
  };
  
  const pierInfo = pierMap[pier];
  if (!pierInfo) return null;
  
  const zone = getZoneCoordinates(pierInfo.zoneId);
  if (!zone) return null;
  
  // Add small offset based on gate number for variety
  return {
    x: zone.x + (gateNum % 5) * 5,
    y: zone.y + Math.floor(gateNum / 5) * 3,
    terminal: pierInfo.terminal
  };
}

/**
 * Build timeline based on trip details and plan steps
 */
export function build_timeline(
  tripDetails: TripDetails,
  preferences: UserPreferences,
  selectedPOIs: POI[] = []
): TimelineStep[] {
  const timeline: TimelineStep[] = [];
  let currentTime = new Date(tripDetails.arrivalTime);
  
  // Determine starting location
  const startZoneId = tripDetails.isDomestic 
    ? `${tripDetails.terminal.toLowerCase()}-arrivals`
    : `${tripDetails.terminal.toLowerCase()}-arrivals`;
  
  let currentLocation = getZoneCoordinates(startZoneId);
  if (!currentLocation) {
    currentLocation = { x: 100, y: 100, terminal: tripDetails.terminal };
  }
  
  // Step 1: Baggage claim (if needed)
  if (!tripDetails.isDomestic || tripDetails.currentZone === 'arrivals') {
    const baggageZoneId = `${tripDetails.terminal.toLowerCase()}-baggage`;
    const baggageLocation = getZoneCoordinates(baggageZoneId);
    
    if (baggageLocation) {
      const travelTime = compute_travel_time(currentLocation, baggageLocation, preferences.mobility);
      const queueTime = estimate_queue_times(currentTime, tripDetails.terminal, 'baggage', tripDetails.isDomestic);
      
      timeline.push({
        id: 'baggage',
        type: 'checkpoint',
        name: 'Baggage Claim',
        location: baggageZoneId,
        startTime: new Date(currentTime),
        duration: queueTime,
        travelTime,
        status: 'safe',
        description: `Collect your luggage. Estimated wait: ${queueTime} min`
      });
      
      currentTime = new Date(currentTime.getTime() + (travelTime + queueTime) * 60000);
      currentLocation = baggageLocation;
    }
  }
  
  // Step 2: Passport control (if international)
  if (!tripDetails.isDomestic) {
    const passportZoneId = `${tripDetails.terminal.toLowerCase()}-passport`;
    const passportLocation = getZoneCoordinates(passportZoneId);
    
    if (passportLocation) {
      const travelTime = compute_travel_time(currentLocation, passportLocation, preferences.mobility);
      const queueTime = estimate_queue_times(currentTime, tripDetails.terminal, 'passport', tripDetails.isDomestic);
      
      timeline.push({
        id: 'passport',
        type: 'checkpoint',
        name: 'Passport Control',
        location: passportZoneId,
        startTime: new Date(currentTime),
        duration: queueTime,
        travelTime,
        status: 'safe',
        description: `Immigration checkpoint. Estimated wait: ${queueTime} min`
      });
      
      currentTime = new Date(currentTime.getTime() + (travelTime + queueTime) * 60000);
      currentLocation = passportLocation;
    }
  }
  
  // Step 3: Add selected POIs
  selectedPOIs.forEach((poi, index) => {
    if (!currentLocation) return;
    const poiLocation = { x: poi.x, y: poi.y, terminal: poi.terminal };
    const travelTime = compute_travel_time(currentLocation, poiLocation, preferences.mobility);
    const serviceTime = (poi.avgWaitTime[0] + poi.avgWaitTime[1]) / 2;
    
    timeline.push({
      id: `poi-${index}`,
      type: 'poi',
      name: poi.name,
      location: poi.zone,
      startTime: new Date(currentTime),
      duration: serviceTime,
      travelTime,
      status: 'safe',
      description: poi.description
    });
    
    currentTime = new Date(currentTime.getTime() + (travelTime + serviceTime) * 60000);
    currentLocation = poiLocation;
  });
  
  // Step 4: Security (if next flight exists)
  if (tripDetails.nextFlightTime) {
    const securityZoneId = `${tripDetails.terminal.toLowerCase()}-security`;
    const securityLocation = getZoneCoordinates(securityZoneId);
    
    if (securityLocation && currentLocation) {
      const travelTime = compute_travel_time(currentLocation, securityLocation, preferences.mobility);
      const queueTime = estimate_queue_times(currentTime, tripDetails.terminal, 'security', tripDetails.isDomestic);
      
      timeline.push({
        id: 'security',
        type: 'checkpoint',
        name: 'Security Checkpoint',
        location: securityZoneId,
        startTime: new Date(currentTime),
        duration: queueTime,
        travelTime,
        status: 'safe',
        description: `Security screening. Estimated wait: ${queueTime} min`
      });
      
      currentTime = new Date(currentTime.getTime() + (travelTime + queueTime) * 60000);
      currentLocation = securityLocation;
    }
  }
  
  // Step 5: Gate (if specified)
  if (tripDetails.gateNumber && tripDetails.nextFlightTime) {
    const gateLocation = getGateCoordinates(tripDetails.gateNumber);
    
    if (gateLocation && currentLocation) {
      const travelTime = compute_travel_time(currentLocation, gateLocation, preferences.mobility);
      
      // Boarding time is 30 minutes before departure
      const boardingTime = new Date(tripDetails.nextFlightTime.getTime() - 30 * 60000);
      
      timeline.push({
        id: 'gate',
        type: 'gate',
        name: `Gate ${tripDetails.gateNumber}`,
        location: tripDetails.gateNumber,
        startTime: new Date(currentTime),
        duration: 0,
        travelTime,
        status: 'safe',
        description: `Arrive at gate. Boarding starts at ${boardingTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      });
      
      currentTime = new Date(currentTime.getTime() + travelTime * 60000);
    }
  }
  
  // Calculate status for each step based on remaining time
  if (tripDetails.nextFlightTime) {
    const boardingTime = new Date(tripDetails.nextFlightTime.getTime() - 30 * 60000);
    
    timeline.forEach((step, index) => {
      const stepEndTime = new Date(step.startTime.getTime() + (step.travelTime + step.duration) * 60000);
      const timeUntilBoarding = (boardingTime.getTime() - stepEndTime.getTime()) / 60000;
      
      // Calculate remaining steps time
      const remainingSteps = timeline.slice(index + 1);
      const remainingTime = remainingSteps.reduce((sum, s) => sum + s.travelTime + s.duration, 0);
      
      if (timeUntilBoarding < remainingTime) {
        step.status = 'risky';
      } else if (timeUntilBoarding < remainingTime + 15) {
        step.status = 'tight';
      } else {
        step.status = 'safe';
      }
    });
  }
  
  return timeline;
}

/**
 * Calculate total time remaining until boarding
 */
export function getTimeUntilBoarding(nextFlightTime: Date): number {
  const boardingTime = new Date(nextFlightTime.getTime() - 30 * 60000);
  const now = new Date();
  return Math.max(0, Math.floor((boardingTime.getTime() - now.getTime()) / 60000));
}

/**
 * Format duration in minutes to readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
