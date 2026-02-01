// Home: Enhanced with Norman's principles
// Focus: Context awareness, immediate feedback, confirmation dialogs, natural mapping

import { useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Onboarding } from '@/components/Onboarding';
import { ChatInterface } from '@/components/ChatInterface';
import { TimelineView } from '@/components/TimelineView';
import AirportMap from '@/components/AirportMap';
import { POICard } from '@/components/POICard';
import { TimeDisplay } from '@/components/TimeDisplay';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, MapPin, RefreshCw, Sparkles, Coffee, Utensils, ShoppingBag, HelpCircle, AlertCircle, CheckCircle2, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import airportData from '@/data/airport.json';
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
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

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

  // Update quick replies based on context
  useEffect(() => {
    if (!state.isOnboarding && state.tripDetails) {
      const contextReplies: string[] = [];
      
      if (timeUntilBoarding && timeUntilBoarding < 60) {
        contextReplies.push("Can I still grab coffee?");
      } else {
        contextReplies.push("Where's the nearest coffee?");
      }
      
      if (state.preferences?.dietary?.includes('vegan')) {
        contextReplies.push("Show me vegan options");
      }
      
      contextReplies.push("How much time do I have?");
      contextReplies.push("I need a restroom");
      
      setQuickReplies(contextReplies);
    }
  }, [state.isOnboarding, state.tripDetails, state.preferences, timeUntilBoarding]);

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
    
    // Welcome message with context
    const timeInfo = tripDetails.nextFlightTime 
      ? `You have ${Math.floor((tripDetails.nextFlightTime.getTime() - new Date().getTime()) / 60000)} minutes until boarding.`
      : 'Take your time exploring!';
    
    addMessage('assistant', `Welcome to Nova Europa International! I've created your personalized action plan. ${timeInfo} Ask me anything about food, shops, or facilities.`);
    
    // Show success toast
    toast.success('Your plan is ready!', {
      description: 'I\'ve mapped out your journey. Add stops or ask questions anytime.',
      duration: 5000,
    });
  };

  const handleSendMessage = (message: string) => {
    addMessage('user', message);
    
    // Simple rule-based responses with better context
    setTimeout(() => {
      const lowerMessage = message.toLowerCase();
      let response = '';
      
      if (lowerMessage.includes('coffee') || lowerMessage.includes('café') || lowerMessage.includes('cafe')) {
        const cafes = state.nearbyPOIs.filter(poi => poi.category === 'cafe');
        if (cafes.length > 0) {
          const nearest = cafes[0];
          const timeImpact = (nearest as any).totalTime || 10;
          response = `☕ **${nearest.name}** is your closest option:\n\n• ${(nearest as any).travelTime || 5} min walk\n• ${nearest.avgWaitTime[0]}-${nearest.avgWaitTime[1]} min service\n• Total: ${timeImpact} minutes\n\nThey serve ${nearest.menu.slice(0, 2).join(', ')}. Want me to add it to your plan?`;
        } else {
          response = "I couldn't find any cafés in your immediate area. Would you like me to check other terminals?";
        }
      } else if (lowerMessage.includes('vegan')) {
        const vegan = state.nearbyPOIs.filter(poi => poi.tags.includes('vegan'));
        if (vegan.length > 0) {
          response = `🌱 Found ${vegan.length} vegan-friendly options:\n\n${vegan.slice(0, 3).map((p, i) => `${i + 1}. **${p.name}** (${(p as any).totalTime}m total)`).join('\n')}\n\nCheck the "Nearby Options" tab to see details and add them to your plan.`;
        } else {
          response = "I don't see any vegan options nearby. Let me search other terminals... Try asking about specific cuisines like Mediterranean or Asian.";
        }
      } else if (lowerMessage.includes('time') || lowerMessage.includes('how long') || lowerMessage.includes('how much')) {
        if (state.tripDetails?.nextFlightTime && timeUntilBoarding !== null) {
          const status = timeUntilBoarding > 60 ? 'safe' : timeUntilBoarding > 30 ? 'tight' : 'risky';
          const statusEmoji = status === 'safe' ? '✅' : status === 'tight' ? '⚠️' : '🚨';
          const advice = status === 'safe' 
            ? 'You have plenty of time to explore!' 
            : status === 'tight' 
            ? 'You should start heading to your gate soon.' 
            : '⚠️ You need to head to your gate NOW!';
          
          response = `${statusEmoji} **Time Check:**\n\n• ${timeUntilBoarding} minutes until boarding\n• Status: ${status.toUpperCase()}\n\n${advice}`;
        } else {
          response = "You don't have a connecting flight, so no rush! Take your time and enjoy the airport.";
        }
      } else if (lowerMessage.includes('restroom') || lowerMessage.includes('toilet') || lowerMessage.includes('bathroom')) {
        const restrooms = state.nearbyPOIs.filter(poi => poi.tags.includes('restroom'));
        if (restrooms.length > 0) {
          const nearest = restrooms[0];
          response = `🚻 Nearest restroom:\n\n• Location: ${nearest.zone.split('-').pop()?.toUpperCase()}\n• Walk time: ${(nearest as any).travelTime || 2} minutes\n• Accessible facilities available\n\nHead towards ${nearest.terminal} and follow the signs.`;
        } else {
          response = "🚻 Restrooms are available throughout the terminal. Look for the blue restroom signs, or check the airport map near information desks.";
        }
      } else if (lowerMessage.includes('lounge')) {
        const lounges = state.nearbyPOIs.filter(poi => poi.category === 'lounge');
        if (lounges.length > 0 && state.preferences?.loungeAccess) {
          const nearest = lounges[0];
          response = `✨ **${nearest.name}**:\n\n• ${(nearest as any).travelTime || 8} min walk\n• Amenities: ${nearest.tags.join(', ')}\n• Includes: ${nearest.menu.slice(0, 3).join(', ')}\n\nWould you like me to add it to your plan?`;
        } else if (lounges.length > 0) {
          response = "There are lounges available, but you indicated you don't have lounge access. Some lounges offer day passes (€30-50) if you're interested!";
        } else {
          response = "No lounges found in your current terminal. Would you like me to check other terminals?";
        }
      } else if (lowerMessage.includes('food') || lowerMessage.includes('eat') || lowerMessage.includes('hungry')) {
        const restaurants = state.nearbyPOIs.filter(poi => poi.category === 'restaurant' || poi.category === 'cafe');
        response = `🍽️ **Food options nearby:**\n\n${restaurants.slice(0, 3).map((p, i) => `${i + 1}. **${p.name}** - ${p.tags.slice(0, 2).join(', ')} (${(p as any).totalTime}m)`).join('\n')}\n\nUse the category buttons below or check "Nearby Options" to see all choices!`;
      } else if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
        response = "👋 **I'm here to help!**\n\n**I can:**\n• Find food, drinks, shops, and services\n• Calculate walking times and wait times\n• Check if you have enough time\n• Build and optimize your itinerary\n• Answer questions about the airport\n\n**Try asking:**\n• \"Where's the nearest coffee?\"\n• \"Show me vegan options\"\n• \"How much time do I have?\"\n• \"I need a restroom\"";
      } else {
        response = "I'm here to help! Try asking about:\n\n• 🍔 Food options\n• ⏰ Time to your gate\n• 🚻 Restrooms or facilities\n• 🛍️ Shops and lounges\n\nOr use the category buttons below for quick access!";
      }
      
      addMessage('assistant', response);
    }, 600);
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
    
    // Show success toast with undo
    toast.success(`Added ${poi.name}`, {
      description: `Your timeline has been updated (+${(poi as any).totalTime || 10}m)`,
      action: {
        label: 'Undo',
        onClick: () => handleRemovePOI(poi.id),
      },
      duration: 5000,
    });
    
    addMessage('assistant', `✅ Added **${poi.name}** to your plan. Your timeline has been updated with this ${(poi as any).totalTime || 10}-minute stop.`);
  };

  const handleRemovePOI = (poiId: string) => {
    const poi = state.selectedPOIs.find(p => p.id === poiId);
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
    
    if (poi) {
      toast.info(`Removed ${poi.name}`, {
        description: 'Your timeline has been updated',
      });
    }
  };

  const handleOptimizePlan = () => {
    if (state.tripDetails && state.preferences) {
      const removedCount = state.selectedPOIs.length;
      
      // Clear all selected POIs
      state.selectedPOIs.forEach(poi => removeSelectedPOI(poi.id));
      
      // Regenerate timeline
      const newTimeline = build_timeline(state.tripDetails, state.preferences, []);
      setTimeline(newTimeline);
      
      toast.success('Plan optimized!', {
        description: `Removed ${removedCount} optional stops to minimize risk`,
      });
      
      addMessage('assistant', `⚡ I've optimized your plan by removing ${removedCount} optional stops. You now have the fastest route to your gate!`);
    }
  };

  const handleResetConfirm = () => {
    resetApp();
    setShowResetDialog(false);
    toast.info('Starting fresh', {
      description: 'Your previous plan has been cleared',
    });
  };

  const handleCategoryFilter = (category: string) => {
    setCategoryFilter(category === categoryFilter ? null : category);
    
    // Send contextual message
    const categoryMessages: Record<string, string> = {
      food: "🍽️ Showing all food and drink options",
      facilities: "🚻 Showing restrooms and services",
      shopping: "🛍️ Showing shops and duty-free",
      help: "ℹ️ How can I help you?"
    };
    
    if (category !== categoryFilter) {
      handleSendMessage(categoryMessages[category] || "Show me options");
    }
  };

  // Filter POIs by category
  const filteredPOIs = categoryFilter
    ? state.nearbyPOIs.filter(poi => {
        if (categoryFilter === 'food') return poi.category === 'restaurant' || poi.category === 'cafe';
        if (categoryFilter === 'facilities') return poi.category === 'service' && poi.tags.includes('restroom');
        if (categoryFilter === 'shopping') return poi.category === 'shop';
        return true;
      })
    : state.nearbyPOIs;

  // Get destination location from timeline
  const getDestinationLocation = () => {
    if (!state.tripDetails?.gateNumber) return null;
    // Find gate zone in airport data
    const gateZone = (airportData.zones as any[]).find(
      z => z.terminal === state.tripDetails?.terminal && z.id.includes('gates')
    );
    if (!gateZone) return null;
    return { x: gateZone.x, y: gateZone.y, terminal: gateZone.terminal };
  };

  const destinationLocation = getDestinationLocation();
  const destinationLabel = state.tripDetails?.gateNumber
    ? `Gate ${state.tripDetails.gateNumber}`
    : 'Gate';

  // Calculate if adding POI would cause flight miss
  const calculateWouldCauseMiss = (poi: POI & { totalTime?: number }) => {
    if (!timeUntilBoarding || !poi.totalTime) return false;
    
    // Calculate current timeline duration
    const currentDuration = state.timeline.reduce((sum, step) => sum + step.travelTime + step.duration, 0);
    const newDuration = currentDuration + poi.totalTime;
    
    return newDuration > timeUntilBoarding;
  };

  if (state.isOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Get overall status
  const overallStatus = timeUntilBoarding 
    ? (timeUntilBoarding > 60 ? 'safe' : timeUntilBoarding > 30 ? 'tight' : 'risky')
    : 'safe';

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Enhanced Top Bar with context awareness */}
      <header className="border-b bg-card px-6 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-sans font-bold">GateBuddy</h1>
            
            {state.tripDetails && (
              <div className="flex items-center gap-4 text-sm">
                {/* Current location */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-mono font-semibold">{state.tripDetails.terminal}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">Arrivals</span>
                </div>
                
                {/* Countdown with status color */}
                {state.tripDetails.nextFlightTime && timeUntilBoarding !== null && (
                  <div className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold',
                    overallStatus === 'safe' && 'bg-green-50 text-green-700',
                    overallStatus === 'tight' && 'bg-yellow-50 text-yellow-700',
                    overallStatus === 'risky' && 'bg-red-50 text-red-700'
                  )}>
                    <Clock className="w-4 h-4" />
                    <TimeDisplay time={timeUntilBoarding} format="countdown" size="sm" />
                    <span className="text-xs">to boarding</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {state.tripDetails?.nextFlightTime && state.selectedPOIs.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleOptimizePlan}>
                <Sparkles className="w-4 h-4 mr-2" />
                Optimize Plan
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowResetDialog(true)}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Start Over
            </Button>
          </div>
        </div>

        {/* Next action prompt - clear signifier */}
        {state.timeline.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Navigation className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Next:</span>
            <span className="font-semibold">{state.timeline[0]?.name}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{state.timeline[0]?.travelTime}m walk</span>
          </div>
        )}
      </header>

      {/* Main Content - Split Pane */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat (40%) */}
        <div className="w-2/5 border-r flex flex-col">
          {/* Category quick access - clear affordances */}
          <div className="p-4 border-b bg-muted/30">
            <div className="flex gap-2">
              <Button
                variant={categoryFilter === 'food' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCategoryFilter('food')}
                className="flex-1"
              >
                <Utensils className="w-4 h-4 mr-2" />
                Food
              </Button>
              <Button
                variant={categoryFilter === 'facilities' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCategoryFilter('facilities')}
                className="flex-1"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Facilities
              </Button>
              <Button
                variant={categoryFilter === 'shopping' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCategoryFilter('shopping')}
                className="flex-1"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Shopping
              </Button>
              <Button
                variant={categoryFilter === 'help' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCategoryFilter('help')}
                className="flex-1"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Help
              </Button>
            </div>
          </div>
          
          <ChatInterface
            messages={state.messages}
            onSendMessage={handleSendMessage}
            quickReplies={quickReplies}
            placeholder="Ask about food, time, facilities..."
            className="flex-1 border-0 rounded-none"
          />
        </div>

        {/* Right: Data Panels (60%) */}
        <div className="flex-1 overflow-auto">
          <Tabs defaultValue="map" className="h-full flex flex-col">
            <div className="border-b px-6 py-3 bg-muted/30">
              <TabsList>
                <TabsTrigger value="map">
                  Your Journey
                </TabsTrigger>
                <TabsTrigger value="plan">
                  Your Plan ({state.timeline.length})
                </TabsTrigger>
                <TabsTrigger value="nearby">
                  Nearby Options ({filteredPOIs.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <TabsContent value="map" className="mt-0 h-full flex flex-col">
                <AirportMap
                  currentLocation={state.currentLocation}
                  destination={destinationLocation}
                  destinationLabel={destinationLabel}
                  pois={state.nearbyPOIs}
                  zones={airportData.zones as any[]}
                  timeline={state.timeline}
                  onPOIClick={handleAddPOI}
                />
              </TabsContent>

              <TabsContent value="plan" className="mt-0">
                <TimelineView timeline={state.timeline} />
              </TabsContent>

              <TabsContent value="nearby" className="mt-0 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-sans font-bold">Nearby Options</h2>
                    {categoryFilter && (
                      <p className="text-sm text-muted-foreground font-body mt-1">
                        Filtered by: {categoryFilter}
                      </p>
                    )}
                  </div>
                  {filteredPOIs.length > 0 && (
                    <p className="text-sm text-muted-foreground font-body">
                      {filteredPOIs.length} places found
                    </p>
                  )}
                </div>

                {filteredPOIs.length === 0 ? (
                  <Card className="p-8 text-center">
                    <MapPin className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground font-body mb-4">
                      {categoryFilter 
                        ? `No ${categoryFilter} options found nearby.`
                        : 'No nearby options found.'}
                    </p>
                    {categoryFilter && (
                      <Button variant="outline" onClick={() => setCategoryFilter(null)}>
                        Clear filter
                      </Button>
                    )}
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {filteredPOIs.map(poi => (
                      <POICard
                        key={poi.id}
                        poi={poi}
                        isSelected={state.selectedPOIs.some(p => p.id === poi.id)}
                        onSelect={() => handleAddPOI(poi)}
                        onDeselect={() => handleRemovePOI(poi.id)}
                        availableTime={timeUntilBoarding || undefined}
                        wouldCauseMiss={calculateWouldCauseMiss(poi)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Reset Confirmation Dialog - prevent errors */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Over?</DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              This will clear your current plan and preferences:
            </DialogDescription>
            <div className="space-y-3">
              <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="font-semibold">You will lose:</span>
                </div>
                <ul className="ml-6 space-y-1 text-muted-foreground">
                  <li>• Your {state.timeline.length}-step itinerary</li>
                  <li>• {state.selectedPOIs.length} selected stops</li>
                  <li>• All chat history</li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">You'll return to the welcome screen to set up a new trip.</p>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleResetConfirm}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Start Over
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
