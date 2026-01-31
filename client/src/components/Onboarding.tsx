// Focus: Context awareness, immediate feedback, confirmation dialogs, natural mapping

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { TripDetails, UserPreferences } from '@/lib/airportLogic';

interface OnboardingProps {
  onComplete: (trip: TripDetails, preferences: UserPreferences) => void;
}

// Gate options by terminal
const gateOptions: Record<string, string[]> = {
  'T1': ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4'],
};

// Fun airport names
const airportNames = [
  'Nova Europa International',
  'Skyward Horizons',
  'Cloud Nine Terminal',
  'Wanderlust Wings',
  'Jetstream Junction',
  'Paradise Gateway',
  'Velocity Valley',
  'Compass Rose International',
  'Stellar Skies',
  'Voyage Vortex',
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [airportName, setAirportName] = useState('');
  const [arrivingGate, setArrivingGate] = useState('');
  const TERMINAL = 'T1'; // Single terminal only
  const [departureGate, setDepartureGate] = useState('');
  const [isDomestic, setIsDomestic] = useState(false);
  const [hasBaggage, setHasBaggage] = useState(false);
  const [hasNextFlight, setHasNextFlight] = useState(true);
  const [nextFlightTime, setNextFlightTime] = useState('');
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [preferences, setPreferences] = useState('');
  const [showError, setShowError] = useState('');

  const setQuickTime = (hours: number) => {
    const now = new Date();
    const future = new Date(now.getTime() + hours * 60 * 60 * 1000);
    const timeStr = `${String(future.getHours()).padStart(2, '0')}:${String(future.getMinutes()).padStart(2, '0')}`;
    setNextFlightTime(timeStr);
    setSelectedTime(hours);
  };

  const handleComplete = () => {
    if (!airportName.trim()) {
      setShowError('Please select an airport');
      return;
    }
    if (!departureGate.trim()) {
      setShowError('Please select your departure gate');
      return;
    }

    const now = new Date();
    let flightDate = new Date(now);
    
    if (nextFlightTime) {
      const [hours, minutes] = nextFlightTime.split(':').map(Number);
      flightDate.setHours(hours, minutes, 0, 0);
      
      if (flightDate < now) {
        flightDate.setDate(flightDate.getDate() + 1);
      }
    }

    const trip: TripDetails = {
      terminal: TERMINAL,
      arrivingGate: arrivingGate || 'Unknown',
      gateNumber: departureGate.toUpperCase(),
      isDomestic,
      hasBaggage,
      hasNextFlight,
      nextFlightTime: flightDate,
    };

    const userPrefs: UserPreferences = {
      customPreferences: preferences,
    };

    onComplete(trip, userPrefs);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Dialog open={true}>
          <DialogContent className="max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl font-display">
                {step === 1 ? 'Trip Details' : 'Your Preferences'}
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                {step === 1 ? 'Tell us about your journey' : 'Customize your experience'}
              </DialogDescription>
            </DialogHeader>

            {/* Progress indicator */}
            <div className="flex items-center gap-2 mt-4">
              <div className="flex items-center gap-2 flex-1">
                <span className={cn(
                  'text-xs font-medium font-body',
                  step >= 1 ? 'text-primary' : 'text-muted-foreground'
                )}>
                  Trip
                </span>
                <div className={cn(
                  'h-2 flex-1 rounded-full transition-colors',
                  step >= 1 ? 'bg-primary' : 'bg-muted'
                )} />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <div className={cn(
                  'h-2 flex-1 rounded-full transition-colors',
                  step >= 2 ? 'bg-primary' : 'bg-muted'
                )} />
                <span className={cn(
                  'text-xs font-medium font-body',
                  step >= 2 ? 'text-primary' : 'text-muted-foreground'
                )}>
                  Preferences
                </span>
              </div>
            </div>

            {/* Step 1: Trip Details */}
            {step === 1 && (
              <div className="space-y-4 sm:space-y-6 mt-6">
                {/* Airport Name */}
                <div className="space-y-2">
                  <Label htmlFor="airportName" className="text-sm sm:text-base font-semibold">
                    Airport <span className="text-red-500">*</span>
                  </Label>
                  <Select value={airportName} onValueChange={setAirportName}>
                    <SelectTrigger id="airportName" className="h-10 sm:h-12">
                      <SelectValue placeholder="Select an airport" />
                    </SelectTrigger>
                    <SelectContent>
                      {airportNames.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Arrival Gate */}
                <div className="space-y-2">
                  <Label htmlFor="arrivingGate" className="text-sm sm:text-base font-semibold">
                    Arrival gate
                  </Label>
                  <Select value={arrivingGate} onValueChange={setArrivingGate}>
                    <SelectTrigger id="arrivingGate" className="h-10 sm:h-12">
                      <SelectValue placeholder="Select a gate" />
                    </SelectTrigger>
                    <SelectContent>
                      {gateOptions[TERMINAL]?.map((gate) => (
                        <SelectItem key={gate} value={gate}>
                          {gate}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Departure Gate */}
                <div className="space-y-2">
                  <Label htmlFor="departureGate" className="text-sm sm:text-base font-semibold">
                    Departure gate <span className="text-red-500">*</span>
                  </Label>
                  <Select value={departureGate} onValueChange={setDepartureGate}>
                    <SelectTrigger id="departureGate" className="h-10 sm:h-12">
                      <SelectValue placeholder="Select a gate" />
                    </SelectTrigger>
                    <SelectContent>
                      {gateOptions[TERMINAL]?.map((gate) => (
                        <SelectItem key={gate} value={gate}>
                          {gate}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground font-body">
                    We'll calculate walking time to your gate
                  </p>
                </div>

                {/* Flight Time Section */}
                <div className="space-y-3 pt-2">
                  <Label className="text-sm sm:text-base font-semibold">
                    When is your next flight?
                  </Label>
                  
                  {/* Quick time buttons */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={selectedTime === 1 ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setQuickTime(1)}
                      className="flex-1 text-xs sm:text-sm"
                    >
                      In 1 hour
                    </Button>
                    <Button
                      type="button"
                      variant={selectedTime === 2 ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setQuickTime(2)}
                      className="flex-1 text-xs sm:text-sm"
                    >
                      In 2 hours
                    </Button>
                    <Button
                      type="button"
                      variant={selectedTime === 4 ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setQuickTime(4)}
                      className="flex-1 text-xs sm:text-sm"
                    >
                      In 4 hours
                    </Button>
                  </div>

                  {/* Time input */}
                  <div className="relative">
                    <input
                      id="flightTime"
                      type="time"
                      value={nextFlightTime}
                      onChange={(e) => {
                        setNextFlightTime(e.target.value);
                        setSelectedTime(null);
                      }}
                      placeholder="Or enter exact time"
                      className="w-full h-10 sm:h-12 px-3 rounded-md border border-input bg-background text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* Checkboxes at the end */}
                <div className="pt-4 space-y-3">
                  <div className="flex items-center space-x-3 p-3 sm:p-4 bg-muted/50 rounded-lg">
                    <Checkbox 
                      id="domestic" 
                      checked={isDomestic}
                      onCheckedChange={(checked) => setIsDomestic(checked as boolean)}
                    />
                    <div className="flex-1">
                      <Label htmlFor="domestic" className="text-sm sm:text-base font-semibold cursor-pointer">
                        Domestic arrival
                      </Label>
                      <p className="text-xs sm:text-sm text-muted-foreground font-body">
                        Skip passport control and security (saves ~35 minutes)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 sm:p-4 bg-muted/50 rounded-lg">
                    <Checkbox 
                      id="baggage" 
                      checked={hasBaggage}
                      onCheckedChange={(checked) => setHasBaggage(checked as boolean)}
                    />
                    <div className="flex-1">
                      <Label htmlFor="baggage" className="text-sm sm:text-base font-semibold cursor-pointer">
                        I need to collect checked baggage
                      </Label>
                      <p className="text-xs sm:text-sm text-muted-foreground font-body">
                        Adds ~15 minutes for baggage claim
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 sm:p-4 bg-muted/50 rounded-lg">
                    <Checkbox 
                      id="nextFlight" 
                      checked={hasNextFlight}
                      onCheckedChange={(checked) => setHasNextFlight(checked as boolean)}
                    />
                    <div className="flex-1">
                      <Label htmlFor="nextFlight" className="text-sm sm:text-base font-semibold cursor-pointer">
                        I have a connecting flight
                      </Label>
                      <p className="text-xs sm:text-sm text-muted-foreground font-body">
                        We'll make sure you don't miss it
                      </p>
                    </div>
                  </div>
                </div>

                {showError && (
                  <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                    {showError}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>
                    Back
                  </Button>
                  <Button className="flex-1" onClick={() => setStep(2)}>
                    Continue <span className="ml-2">→</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Preferences */}
            {step === 2 && (
              <div className="space-y-4 sm:space-y-6 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="preferences" className="text-sm sm:text-base font-semibold">
                    Tell us your preferences
                  </Label>
                  <p className="text-xs sm:text-sm text-muted-foreground font-body">
                    Describe what you're looking for (food, facilities, shopping, etc.)
                  </p>
                  <textarea
                    id="preferences"
                    value={preferences}
                    onChange={(e) => setPreferences(e.target.value)}
                    placeholder="e.g., I'm hungry and want a quick coffee, I need a pharmacy, I want to shop for souvenirs..."
                    className="w-full min-h-32 sm:min-h-40 p-3 sm:p-4 rounded-md border border-input bg-background text-sm sm:text-base resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button className="flex-1" onClick={handleComplete}>
                    Create My Plan
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
