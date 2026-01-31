// Home: Main application page with split-pane layout
// Design: Swiss Rationalism - asymmetric split (40/60), chat + data panels

import { useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Onboarding } from '@/components/Onboarding';
import { ChatInterface } from '@/components/ChatInterface';
import { TimelineView } from '@/components/TimelineView';
import { POICard } from '@/components/POICard';
import { TimeDisplay } from '@/components/TimeDisplay';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, MapPin, RefreshCw, Sparkles } from 'lucide-react';
import {
  build_timeline,
  recommend_pois,
  getZoneCoordinates,
  getTimeUntilBoarding,
  type TripDetails,
  type UserPreferences,
  type POI,
} from '@/lib/airportLogic';

export default function Home() {
  const { state, setTripDetails, setPreferences, setTimeline, setNearbyPOIs, addMessage, completeOnboarding, resetApp, addSelectedPOI, removeSelectedPOI, setCurrentLocation } = useApp();
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [timeUntilBoarding, setTimeUntilBoarding] = useState<number | null>(null);

  // Update time until boarding every minute
  useEffect(() => {
    if (state.tripDetails?.nextFlightTime) {
      const updateTime = () => {
        setTimeUntilBoarding(getTimeUntilBoarding(state.tripDetails!.nextFlightTime!));
      };
      updateTime();
      const interval = setInterval(updateTime, 60000);
      return () => clearInterval(interval);
    }
  }, [state.tripDetails?.nextFlightTime]);

  const handleOnboardingComplete = (tripDetails: TripDetails, preferences: UserPreferences) => {
    setTripDetails(tripDetails);
    setPreferences(preferences);
    
    // Set initial location
    const startZoneId = tripDetails.isDomestic 
      ? `${tripDetails.terminal.toLowerCase()}-arrivals`
      : `${tripDetails.terminal.toLowerCase()}-arrivals`;
    const location = getZoneCoordinates(startZoneId);
    if (location) {
      setCurrentLocation(location);
    }
    
    // Generate initial timeline
    const timeline = build_timeline(tripDetails, preferences, []);
    setTimeline(timeline);
    
    // Get nearby POIs
    if (location) {
      const availableTime = tripDetails.nextFlightTime 
        ? (tripDetails.nextFlightTime.getTime() - new Date().getTime()) / 60000
        : undefined;
      const nearby = recommend_pois(location, preferences, new Date(), availableTime);
      setNearbyPOIs(nearby);
    }
    
    completeOnboarding();
    
    // Welcome message
    addMessage('assistant', `Welcome to Nova Europa International! I've created your action plan. ${tripDetails.nextFlightTime ? `You have ${Math.floor((tripDetails.nextFlightTime.getTime() - new Date().getTime()) / 60000)} minutes until boarding.` : 'Let me know if you need any recommendations!'}`);
    
    // Set quick replies
    setQuickReplies([
      "Where's the nearest coffee?",
      "Can I make it to my gate if I eat?",
      "Show me vegan options",
      "I need a restroom"
    ]);
  };

  const handleSendMessage = (message: string) => {
    addMessage('user', message);
    
    // Simple rule-based responses
    setTimeout(() => {
      const lowerMessage = message.toLowerCase();
      let response = '';
      
      if (lowerMessage.includes('coffee') || lowerMessage.includes('café') || lowerMessage.includes('cafe')) {
        const cafes = state.nearbyPOIs.filter(poi => poi.category === 'cafe');
        if (cafes.length > 0) {
          const nearest = cafes[0];
          response = `The nearest café is ${nearest.name} in ${nearest.terminal}. It's about ${(nearest as any).travelTime || 5} minutes walk from your location. They serve ${nearest.menu.slice(0, 2).join(', ')}.`;
        } else {
          response = "I couldn't find any cafés nearby. Let me search other terminals for you.";
        }
      } else if (lowerMessage.includes('vegan')) {
        const vegan = state.nearbyPOIs.filter(poi => poi.tags.includes('vegan'));
        if (vegan.length > 0) {
          response = `I found ${vegan.length} vegan-friendly options: ${vegan.slice(0, 3).map(p => p.name).join(', ')}. Would you like details on any of these?`;
        } else {
          response = "I don't see any vegan options in your immediate area. Would you like me to check other terminals?";
        }
      } else if (lowerMessage.includes('make it') || lowerMessage.includes('time') || lowerMessage.includes('gate')) {
        if (state.tripDetails?.nextFlightTime && timeUntilBoarding !== null) {
          const status = timeUntilBoarding > 60 ? 'safe' : timeUntilBoarding > 30 ? 'tight' : 'risky';
          response = `You have ${timeUntilBoarding} minutes until boarding. Status: ${status}. ${status === 'safe' ? 'You have plenty of time!' : status === 'tight' ? 'You should move soon.' : 'You need to head to your gate now!'}`;
        } else {
          response = "You don't have a connecting flight, so take your time!";
        }
      } else if (lowerMessage.includes('restroom') || lowerMessage.includes('toilet') || lowerMessage.includes('bathroom')) {
        const restrooms = state.nearbyPOIs.filter(poi => poi.tags.includes('restroom'));
        if (restrooms.length > 0) {
          const nearest = restrooms[0];
          response = `The nearest restroom is in ${nearest.zone}. It's about ${(nearest as any).travelTime || 2} minutes walk.`;
        } else {
          response = "Restrooms are available throughout the terminal. Check the airport map for the nearest one.";
        }
      } else if (lowerMessage.includes('lounge')) {
        const lounges = state.nearbyPOIs.filter(poi => poi.category === 'lounge');
        if (lounges.length > 0 && state.preferences?.loungeAccess) {
          const nearest = lounges[0];
          response = `${nearest.name} is ${(nearest as any).travelTime || 8} minutes away. They offer ${nearest.menu.join(', ')}. Would you like to add it to your plan?`;
        } else if (lounges.length > 0) {
          response = "There are lounges available, but you indicated you don't have lounge access. Some lounges offer day passes if you're interested.";
        } else {
          response = "No lounges found in your current terminal.";
        }
      } else if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
        response = "I can help you with:\n• Finding food, drinks, and shops\n• Calculating walking times\n• Checking if you have enough time\n• Building your airport itinerary\n\nJust ask me anything!";
      } else {
        response = "I'm here to help! Try asking about food options, time to your gate, or specific amenities like restrooms or lounges.";
      }
      
      addMessage('assistant', response);
    }, 500);
  };

  const handleAddPOI = (poi: POI) => {
    addSelectedPOI(poi);
    
    // Regenerate timeline with new POI
    if (state.tripDetails && state.preferences) {
      const newTimeline = build_timeline(
        state.tripDetails,
        state.preferences,
        [...state.selectedPOIs, poi]
      );
      setTimeline(newTimeline);
    }
    
    addMessage('assistant', `Added ${poi.name} to your plan. Your timeline has been updated.`);
  };

  const handleRemovePOI = (poiId: string) => {
    removeSelectedPOI(poiId);
    
    // Regenerate timeline without this POI
    if (state.tripDetails && state.preferences) {
      const updatedPOIs = state.selectedPOIs.filter(p => p.id !== poiId);
      const newTimeline = build_timeline(
        state.tripDetails,
        state.preferences,
        updatedPOIs
      );
      setTimeline(newTimeline);
    }
  };

  const handleOptimizePlan = () => {
    if (state.tripDetails && state.preferences) {
      // Remove all optional POIs and regenerate
      const newTimeline = build_timeline(state.tripDetails, state.preferences, []);
      setTimeline(newTimeline);
      addMessage('assistant', 'I\'ve optimized your plan to minimize risk. All optional stops have been removed.');
    }
  };

  if (state.isOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-sans font-bold">GateBuddy Concierge</h1>
            {state.tripDetails && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono">{state.tripDetails.terminal}</span>
                </div>
                {state.tripDetails.nextFlightTime && timeUntilBoarding !== null && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <TimeDisplay time={timeUntilBoarding} format="countdown" size="sm" />
                    <span className="text-muted-foreground font-body">until boarding</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {state.tripDetails?.nextFlightTime && (
              <Button variant="outline" size="sm" onClick={handleOptimizePlan}>
                <Sparkles className="w-4 h-4 mr-2" />
                Optimize Plan
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={resetApp}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Start Over
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Split Pane */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat (40%) */}
        <div className="w-2/5 border-r flex flex-col">
          <ChatInterface
            messages={state.messages}
            onSendMessage={handleSendMessage}
            quickReplies={quickReplies}
            className="flex-1 border-0 rounded-none"
          />
        </div>

        {/* Right: Data Panels (60%) */}
        <div className="flex-1 overflow-auto">
          <Tabs defaultValue="timeline" className="h-full flex flex-col">
            <div className="border-b px-6 py-3">
              <TabsList>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="nearby">Nearby Options</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <TabsContent value="timeline" className="mt-0">
                <TimelineView timeline={state.timeline} />
              </TabsContent>

              <TabsContent value="nearby" className="mt-0 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-sans font-bold">Nearby Options</h2>
                  {state.nearbyPOIs.length > 0 && (
                    <p className="text-sm text-muted-foreground font-body">
                      {state.nearbyPOIs.length} places found
                    </p>
                  )}
                </div>

                {state.nearbyPOIs.length === 0 ? (
                  <Card className="p-8 text-center">
                    <MapPin className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground font-body">
                      No nearby options found. Try adjusting your preferences.
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {state.nearbyPOIs.map(poi => (
                      <POICard
                        key={poi.id}
                        poi={poi}
                        isSelected={state.selectedPOIs.some(p => p.id === poi.id)}
                        onSelect={() => handleAddPOI(poi)}
                        onDeselect={() => handleRemovePOI(poi.id)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
