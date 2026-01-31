// AppContext: Global state management for GateBuddy Concierge
// Design: Swiss Rationalism - clear data structures, predictable state

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { POI, UserPreferences, TripDetails, TimelineStep } from '@/lib/airportLogic';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AppState {
  // Trip configuration
  tripDetails: TripDetails | null;
  preferences: UserPreferences | null;
  
  // Current state
  currentLocation: { x: number; y: number; terminal: string } | null;
  timeline: TimelineStep[];
  selectedPOIs: POI[];
  nearbyPOIs: POI[];
  
  // Chat
  messages: Message[];
  
  // UI state
  isOnboarding: boolean;
  showMap: boolean;
}

interface AppContextType {
  state: AppState;
  setTripDetails: (details: TripDetails) => void;
  setPreferences: (prefs: UserPreferences) => void;
  setCurrentLocation: (location: { x: number; y: number; terminal: string }) => void;
  setTimeline: (timeline: TimelineStep[]) => void;
  addSelectedPOI: (poi: POI) => void;
  removeSelectedPOI: (poiId: string) => void;
  setNearbyPOIs: (pois: POI[]) => void;
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  completeOnboarding: () => void;
  resetApp: () => void;
  toggleMap: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialState: AppState = {
  tripDetails: null,
  preferences: null,
  currentLocation: null,
  timeline: [],
  selectedPOIs: [],
  nearbyPOIs: [],
  messages: [],
  isOnboarding: true,
  showMap: false,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  const setTripDetails = (details: TripDetails) => {
    setState(prev => ({ ...prev, tripDetails: details }));
  };

  const setPreferences = (prefs: UserPreferences) => {
    setState(prev => ({ ...prev, preferences: prefs }));
  };

  const setCurrentLocation = (location: { x: number; y: number; terminal: string }) => {
    setState(prev => ({ ...prev, currentLocation: location }));
  };

  const setTimeline = (timeline: TimelineStep[]) => {
    setState(prev => ({ ...prev, timeline }));
  };

  const addSelectedPOI = (poi: POI) => {
    setState(prev => ({
      ...prev,
      selectedPOIs: [...prev.selectedPOIs, poi]
    }));
  };

  const removeSelectedPOI = (poiId: string) => {
    setState(prev => ({
      ...prev,
      selectedPOIs: prev.selectedPOIs.filter(p => p.id !== poiId)
    }));
  };

  const setNearbyPOIs = (pois: POI[]) => {
    setState(prev => ({ ...prev, nearbyPOIs: pois }));
  };

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    const message: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      role,
      content,
      timestamp: new Date()
    };
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message]
    }));
  };

  const completeOnboarding = () => {
    setState(prev => ({ ...prev, isOnboarding: false }));
  };

  const resetApp = () => {
    setState(initialState);
  };

  const toggleMap = () => {
    setState(prev => ({ ...prev, showMap: !prev.showMap }));
  };

  const value: AppContextType = {
    state,
    setTripDetails,
    setPreferences,
    setCurrentLocation,
    setTimeline,
    addSelectedPOI,
    removeSelectedPOI,
    setNearbyPOIs,
    addMessage,
    completeOnboarding,
    resetApp,
    toggleMap,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
