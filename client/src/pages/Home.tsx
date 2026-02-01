// Focus: Context awareness, immediate feedback, confirmation dialogs, natural mapping

import { useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import Onboarding from '@/components/Onboarding';
import { ChatInterface } from '@/components/ChatInterface';
import { TimelineView } from '@/components/TimelineView';
import { POICard } from '@/components/POICard';
import { TimeDisplay } from '@/components/TimeDisplay';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, MapPin, RefreshCw, Sparkles, Coffee, Utensils, ShoppingBag, HelpCircle, AlertCircle, CheckCircle2, Navigation, MessageCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  build_timeline,
  recommend_pois,
  getZoneCoordinates,
  getTimeUntilBoarding,
  type TripDetails,
  type UserPreferences,
  type POI,
} from '@/lib/airportLogic';

// Map airport names to their map files
function getAirportMapPath(airportName: string): string {
  const mapName = airportName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  
  // Map specific airports to their custom maps
  if (mapName === 'nova-europa-international') {
    return `/maps/airports/nova-international.png`;
  }
  if (mapName === 'skyward-horizons') {
    return `/maps/airports/skyward-horizons.svg`;
  }
  return '/maps/airports/generic.svg';
}

export default function Home() {
  const { state, setTripDetails, setPreferences, setTimeline, setNearbyPOIs, addMessage, completeOnboarding, resetApp, addSelectedPOI, removeSelectedPOI, setCurrentLocation } = useApp();
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [timeUntilBoarding, setTimeUntilBoarding] = useState<number | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

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
      const replies = [
        'Where\'s the nearest coffee?',
        'How much time do I have?',
        'I need a restroom',
      ];
      setQuickReplies(replies);
    }
  }, [state.isOnboarding, state.tripDetails]);

  const handleSendMessage = (message: string) => {
    addMessage('user', message);

    // Simulate concierge response
    setTimeout(() => {
      let response = 'I can help with that! ';
      if (message.toLowerCase().includes('coffee')) {
        response += 'Try "Brew Haven" in Terminal 1, Zone A. It\'s 5 minutes away and has excellent espresso.';
      } else if (message.toLowerCase().includes('time')) {
        response += `You have ${timeUntilBoarding} minutes until boarding. That's plenty of time to explore!`;
      } else if (message.toLowerCase().includes('restroom')) {
        response += 'There are restrooms in every zone. The nearest one is 2 minutes away in Zone B.';
      } else {
        response += 'I\'m here to help! Ask me about food, facilities, shopping, or anything else at the airport.';
      }

      addMessage('assistant', response);
    }, 500);
  };

  const handleCategoryFilter = (category: string) => {
    setCategoryFilter(categoryFilter === category ? null : category);
  };

  const handleOnboardingComplete = (tripDetails: TripDetails, preferences: UserPreferences) => {
    setTripDetails(tripDetails);
    setPreferences(preferences);

    // Get recommended POIs based on preferences
    const nearbyPOIs = recommend_pois(
      { x: 0, y: 0, terminal: tripDetails.terminal },
      preferences,
      new Date()
    );
    setNearbyPOIs(nearbyPOIs);

    // Include top recommended POIs in the timeline (up to 2 POIs based on available time)
    // Only add POIs if user provided preferences
    const timeUntilBoarding = tripDetails.nextFlightTime 
      ? Math.floor((tripDetails.nextFlightTime.getTime() - new Date().getTime()) / 60000)
      : 120;
    
    // Select POIs that fit in the available time - only if preferences are provided
    const selectedPOIs = preferences.customPreferences && preferences.customPreferences.trim() !== ''
      ? nearbyPOIs
          .filter(poi => {
            const poiWithTime = poi as any;
            return ((poiWithTime.travelTime || 0) + (poiWithTime.totalTime || 0)) < (timeUntilBoarding - 60);
          })
          .slice(0, 2)
      : []; // Empty array if no preferences provided
    
    const timeline = build_timeline(
      { ...tripDetails, arrivalTime: new Date() },
      preferences,
      selectedPOIs
    );
    setTimeline(timeline);

    completeOnboarding();

    const minutesUntilFlight = tripDetails.nextFlightTime 
      ? Math.floor((tripDetails.nextFlightTime.getTime() - new Date().getTime()) / 60000)
      : 0;
    addMessage('assistant', `Welcome to Nova Europa International! I've created your personalized action plan. You have ${minutesUntilFlight} minutes until boarding. Ask me anything about food, shops, or facilities.`);
  };

  const handleResetApp = () => {
    resetApp();
    setShowResetDialog(false);
    setCategoryFilter(null);
    setChatOpen(false);
  };

  if (state.isOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const filteredPOIs = categoryFilter
    ? state.nearbyPOIs.filter(poi => poi.category.toLowerCase().includes(categoryFilter.toLowerCase()))
    : state.nearbyPOIs;

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="border-b bg-muted/30 px-6 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-sans font-bold">GateBuddy</h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-body">
                {state.tripDetails?.terminal} · {state.tripDetails?.arrivingGate && `Arr: ${state.tripDetails.arrivingGate}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TimeDisplay time={new Date()} />
            <StatusBadge status={timeUntilBoarding && timeUntilBoarding > 60 ? 'safe' : timeUntilBoarding && timeUntilBoarding > 30 ? 'tight' : 'risky'} />
            <Button variant="outline" size="sm" onClick={() => setShowResetDialog(true)}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Start Over
            </Button>
          </div>
        </div>

        {/* Next action prompt - clear signifier */}
        {state.timeline.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Navigation className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Next:</span>
            <span className="font-semibold">{state.timeline[0]?.name}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{state.timeline[0]?.travelTime}m walk</span>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Right: Data Panels (Full width or 100% when chat closed) */}
        <div className={cn(
          "flex-1 overflow-auto transition-all duration-300",
          chatOpen ? "w-0 hidden" : "w-full"
        )}>
          <Tabs defaultValue="timeline" className="h-full flex flex-col">
            <div className="border-b px-6 py-3 bg-muted/30">
              <TabsList>
                <TabsTrigger value="timeline">
                  Your Plan ({state.timeline.length})
                </TabsTrigger>
                <TabsTrigger value="nearby">
                  Nearby Options ({filteredPOIs.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-6">
              <TabsContent value="timeline" className="mt-0 space-y-6">
                {/* Airport Map */}
                {state.tripDetails && (
                  <div className="bg-white rounded-lg border border-border overflow-hidden">
                    <div className="h-96 w-full bg-muted flex items-center justify-center">
                      <img
                        src={getAirportMapPath(state.tripDetails.terminal)}
                        alt="Airport Map"
                        className="w-full h-full object-contain p-4"
                      />
                    </div>
                  </div>
                )}
                
                {/* Timeline */}
                <div>
                  <h2 className="text-xl font-sans font-bold mb-4">Your Action Plan</h2>
                  <TimelineView timeline={state.timeline} />
                </div>
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

                {/* Category filters */}
                <div className="flex gap-2 mb-4 flex-wrap">
                  <Button
                    variant={categoryFilter === 'food' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleCategoryFilter('food')}
                  >
                    <Utensils className="w-4 h-4 mr-2" />
                    Food
                  </Button>
                  <Button
                    variant={categoryFilter === 'facilities' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleCategoryFilter('facilities')}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Facilities
                  </Button>
                  <Button
                    variant={categoryFilter === 'shopping' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleCategoryFilter('shopping')}
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Shopping
                  </Button>
                  <Button
                    variant={categoryFilter === 'help' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleCategoryFilter('help')}
                  >
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Help
                  </Button>
                </div>

                {filteredPOIs.length > 0 ? (
                  <div className="space-y-4">
                    {filteredPOIs.map((poi) => (
                      <POICard
                        key={poi.id}
                        poi={poi}
                        isSelected={state.selectedPOIs.some(p => p.id === poi.id)}
                        onSelect={() => addSelectedPOI(poi)}
                        onDeselect={() => removeSelectedPOI(poi.id)}
                        availableTime={timeUntilBoarding || undefined}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No options found for this category</p>
                  </Card>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Chat Panel - Expandable from right side */}
        <div className={cn(
          "transition-all duration-300 flex flex-col bg-background border-l",
          chatOpen ? "w-full sm:w-96" : "w-0"
        )}>
          {chatOpen && (
            <>
              <div className="border-b px-4 py-3 flex items-center justify-between bg-muted/30">
                <h2 className="font-semibold">Chat with Concierge</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setChatOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <ChatInterface
                messages={state.messages}
                onSendMessage={handleSendMessage}
                quickReplies={quickReplies}
                placeholder="Ask about food, time, facilities..."
                className="flex-1 border-0 rounded-none"
              />
            </>
          )}
        </div>
      </div>

      {/* Circular Chat Button - Fixed position */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className={cn(
            "fixed bottom-6 right-6 w-16 h-16 rounded-full bg-primary hover:bg-primary/90",
            "flex items-center justify-center text-primary-foreground shadow-lg",
            "transition-all duration-200 hover:scale-110 z-40"
          )}
          aria-label="Open chat"
        >
          <MessageCircle className="w-7 h-7" />
        </button>
      )}

      {/* Reset Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Over?</DialogTitle>
            <DialogDescription>
              This will clear your current plan and preferences. You'll need to set up your trip again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleResetApp}>
              Start Over
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
