// Test suite for GateBuddy Concierge core logic
// Tests: time calculations, routing, recommendations, timeline building

import { describe, it, expect } from 'vitest';
import {
  calculateDistance,
  compute_travel_time,
  estimate_queue_times,
  isPOIOpen,
  recommend_pois,
  build_timeline,
  getTimeUntilBoarding,
  formatDuration,
  type POI,
  type UserPreferences,
  type TripDetails,
} from './airportLogic';

describe('Distance and Travel Time Calculations', () => {
  it('should calculate Euclidean distance correctly', () => {
    const distance = calculateDistance(0, 0, 3, 4);
    expect(distance).toBe(5); // 3-4-5 triangle
  });

  it('should compute travel time for same terminal', () => {
    const from = { x: 100, y: 100, terminal: 'T1' };
    const to = { x: 200, y: 100, terminal: 'T1' };
    const time = compute_travel_time(from, to, 'normal');
    
    // Distance = 100, scaled to 200m, at 1.3 m/s = ~154 seconds = 3 minutes
    expect(time).toBeGreaterThan(0);
    expect(time).toBeLessThan(10); // Should be reasonable
  });

  it('should add terminal change penalty', () => {
    const from = { x: 100, y: 100, terminal: 'T1' };
    const to = { x: 100, y: 100, terminal: 'T2' };
    const time = compute_travel_time(from, to, 'normal');
    
    // Should include 10-minute terminal change penalty
    expect(time).toBeGreaterThanOrEqual(10);
  });

  it('should adjust for reduced mobility', () => {
    const from = { x: 100, y: 100, terminal: 'T1' };
    const to = { x: 300, y: 100, terminal: 'T1' };
    
    const normalTime = compute_travel_time(from, to, 'normal');
    const reducedTime = compute_travel_time(from, to, 'reduced');
    
    // Reduced mobility should take longer
    expect(reducedTime).toBeGreaterThan(normalTime);
  });
});

describe('Queue Time Estimation', () => {
  it('should estimate higher queue times during peak hours', () => {
    const peakTime = new Date('2026-01-31T07:00:00'); // 7 AM - peak
    const offPeakTime = new Date('2026-01-31T14:00:00'); // 2 PM - off-peak
    
    const peakQueue = estimate_queue_times(peakTime, 'T1', 'security', false);
    const offPeakQueue = estimate_queue_times(offPeakTime, 'T1', 'security', false);
    
    expect(peakQueue).toBeGreaterThan(offPeakQueue);
  });

  it('should return zero passport time for domestic arrivals', () => {
    const time = new Date();
    const domesticQueue = estimate_queue_times(time, 'T1', 'passport', true);
    
    expect(domesticQueue).toBe(0);
  });

  it('should estimate passport queue for international arrivals', () => {
    const time = new Date();
    const intlQueue = estimate_queue_times(time, 'T1', 'passport', false);
    
    expect(intlQueue).toBeGreaterThan(0);
  });
});

describe('POI Opening Hours', () => {
  it('should correctly identify 24/7 POIs as always open', () => {
    const poi: POI = {
      id: 'test-1',
      name: 'Test POI',
      category: 'service',
      terminal: 'T1',
      zone: 't1-departures',
      x: 100,
      y: 100,
      openingHours: '24/7',
      avgWaitTime: [0, 5],
      priceLevel: 0,
      tags: [],
      menu: [],
      description: 'Test',
    };
    
    const anytime = new Date('2026-01-31T03:00:00'); // 3 AM
    expect(isPOIOpen(poi, anytime)).toBe(true);
  });

  it('should correctly check if POI is open during operating hours', () => {
    const poi: POI = {
      id: 'test-2',
      name: 'Test Cafe',
      category: 'cafe',
      terminal: 'T1',
      zone: 't1-departures',
      x: 100,
      y: 100,
      openingHours: '06:00-22:00',
      avgWaitTime: [3, 8],
      priceLevel: 2,
      tags: ['coffee'],
      menu: [],
      description: 'Test',
    };
    
    const duringHours = new Date('2026-01-31T10:00:00'); // 10 AM
    const beforeHours = new Date('2026-01-31T05:00:00'); // 5 AM
    const afterHours = new Date('2026-01-31T23:00:00'); // 11 PM
    
    expect(isPOIOpen(poi, duringHours)).toBe(true);
    expect(isPOIOpen(poi, beforeHours)).toBe(false);
    expect(isPOIOpen(poi, afterHours)).toBe(false);
  });
});

describe('POI Recommendation System', () => {
  const userLocation = { x: 250, y: 100, terminal: 'T1' };
  const currentTime = new Date('2026-01-31T10:00:00');

  it('should filter POIs by budget', () => {
    const lowBudgetPrefs: UserPreferences = {
      budget: 1,
      mobility: 'normal',
      loungeAccess: false,
    };
    
    const recommendations = recommend_pois(userLocation, lowBudgetPrefs, currentTime);
    
    // Should only include POIs with priceLevel <= 1
    recommendations.forEach(poi => {
      expect(poi.priceLevel).toBeLessThanOrEqual(1);
    });
  });

  it('should filter by dietary restrictions', () => {
    const veganPrefs: UserPreferences = {
      budget: 3,
      dietary: ['vegan'],
      mobility: 'normal',
      loungeAccess: false,
    };
    
    const recommendations = recommend_pois(userLocation, veganPrefs, currentTime);
    
    // Food POIs should have vegan tag
    recommendations.forEach(poi => {
      if (poi.category === 'restaurant' || poi.category === 'cafe') {
        expect(poi.tags).toContain('vegan');
      }
    });
  });

  it('should sort by total time (travel + service)', () => {
    const prefs: UserPreferences = {
      budget: 3,
      mobility: 'normal',
      loungeAccess: false,
    };
    
    const recommendations = recommend_pois(userLocation, prefs, currentTime);
    
    // Should be sorted by totalTime ascending
    for (let i = 1; i < recommendations.length; i++) {
      const prev = (recommendations[i - 1] as any).totalTime;
      const curr = (recommendations[i] as any).totalTime;
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });

  it('should filter by available time', () => {
    const prefs: UserPreferences = {
      budget: 3,
      mobility: 'normal',
      loungeAccess: false,
    };
    
    const availableTime = 15; // Only 15 minutes available
    const recommendations = recommend_pois(userLocation, prefs, currentTime, availableTime);
    
    // All recommendations should fit within available time
    recommendations.forEach(poi => {
      expect((poi as any).totalTime).toBeLessThanOrEqual(availableTime);
    });
  });

  it('should include lounges when user has lounge access', () => {
    const loungePrefs: UserPreferences = {
      budget: 3,
      mobility: 'normal',
      loungeAccess: true,
    };
    
    const recommendations = recommend_pois(userLocation, loungePrefs, currentTime);
    
    // Should include at least one lounge
    const hasLounge = recommendations.some(poi => poi.category === 'lounge');
    expect(hasLounge).toBe(true);
  });
});

describe('Timeline Building', () => {
  it('should create timeline with baggage claim for international arrivals', () => {
    const tripDetails: TripDetails = {
      arrivalTime: new Date('2026-01-31T10:00:00'),
      terminal: 'T1',
      isDomestic: false,
      nextFlightTime: new Date('2026-01-31T14:00:00'),
      gateNumber: 'B10',
    };
    
    const preferences: UserPreferences = {
      budget: 2,
      mobility: 'normal',
      loungeAccess: false,
    };
    
    const timeline = build_timeline(tripDetails, preferences, []);
    
    // Should include baggage claim
    const hasBaggage = timeline.some(step => step.id === 'baggage');
    expect(hasBaggage).toBe(true);
  });

  it('should include passport control for international arrivals', () => {
    const tripDetails: TripDetails = {
      arrivalTime: new Date('2026-01-31T10:00:00'),
      terminal: 'T1',
      isDomestic: false,
      nextFlightTime: new Date('2026-01-31T14:00:00'),
    };
    
    const preferences: UserPreferences = {
      budget: 2,
      mobility: 'normal',
      loungeAccess: false,
    };
    
    const timeline = build_timeline(tripDetails, preferences, []);
    
    // Should include passport control
    const hasPassport = timeline.some(step => step.id === 'passport');
    expect(hasPassport).toBe(true);
  });

  it('should include security checkpoint when next flight exists', () => {
    const tripDetails: TripDetails = {
      arrivalTime: new Date('2026-01-31T10:00:00'),
      terminal: 'T1',
      isDomestic: true,
      nextFlightTime: new Date('2026-01-31T14:00:00'),
    };
    
    const preferences: UserPreferences = {
      budget: 2,
      mobility: 'normal',
      loungeAccess: false,
    };
    
    const timeline = build_timeline(tripDetails, preferences, []);
    
    // Should include security
    const hasSecurity = timeline.some(step => step.id === 'security');
    expect(hasSecurity).toBe(true);
  });

  it('should mark steps as risky when time is tight', () => {
    const tripDetails: TripDetails = {
      arrivalTime: new Date('2026-01-31T13:30:00'),
      terminal: 'T1',
      isDomestic: true,
      nextFlightTime: new Date('2026-01-31T14:00:00'), // Only 30 minutes
      gateNumber: 'B10',
    };
    
    const preferences: UserPreferences = {
      budget: 2,
      mobility: 'normal',
      loungeAccess: false,
    };
    
    const timeline = build_timeline(tripDetails, preferences, []);
    
    // Some steps should be marked as risky or tight
    const hasRiskySteps = timeline.some(step => step.status === 'risky' || step.status === 'tight');
    expect(hasRiskySteps).toBe(true);
  });
});

describe('Utility Functions', () => {
  it('should calculate time until boarding correctly', () => {
    const now = new Date();
    const futureTime = new Date(now.getTime() + 90 * 60000); // 90 minutes from now
    
    const timeUntil = getTimeUntilBoarding(futureTime);
    
    // Should be 60 minutes (90 - 30 for boarding)
    expect(timeUntil).toBe(60);
  });

  it('should format duration correctly for minutes only', () => {
    expect(formatDuration(45)).toBe('45m');
  });

  it('should format duration correctly for hours and minutes', () => {
    expect(formatDuration(125)).toBe('2h 5m');
  });

  it('should format duration correctly for exact hours', () => {
    expect(formatDuration(120)).toBe('2h');
  });
});
