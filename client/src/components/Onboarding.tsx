// Design: Swiss Rationalism - precise calculations, functional clarity
// Focus: Affordances, Signifiers, Feedback, Constraints, Natural Mapping

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TripDetails, UserPreferences } from '@/lib/airportLogic';

interface OnboardingProps {
  onComplete: (tripDetails: TripDetails, preferences: UserPreferences) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0); // 0 = welcome, 1 = trip, 2 = preferences
  
  // Trip details state
  const [terminal, setTerminal] = useState('T1');
  const [arrivingGate, setArrivingGate] = useState('');
  const [isDomestic, setIsDomestic] = useState(false);
  const [hasBaggage, setHasBaggage] = useState(false);
  const [hasNextFlight, setHasNextFlight] = useState(true);
  const [nextFlightTime, setNextFlightTime] = useState('');
  const [gateNumber, setGateNumber] = useState('');
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  
  // Preferences state
  const [preferencesText, setPreferencesText] = useState('');

  // Live preview state
  const [timeUntilFlight, setTimeUntilFlight] = useState<number | null>(null);
  const [estimatedSteps, setEstimatedSteps] = useState<string[]>([]);

  // Calculate live preview
  useEffect(() => {
    if (hasNextFlight && nextFlightTime) {
      const now = new Date();
      const flightTime = new Date(now.toDateString() + ' ' + nextFlightTime);
      
      // If flight time is earlier than current time, it must be tomorrow
      if (flightTime.getTime() < now.getTime()) {
        flightTime.setDate(flightTime.getDate() + 1);
      }
      
      const minutesUntil = Math.floor((flightTime.getTime() - now.getTime()) / 60000);
      setTimeUntilFlight(minutesUntil);

      // Estimate steps
      const steps: string[] = [];
      if (hasBaggage) {
        steps.push('Baggage Claim (15 min)');
      }
      if (!isDomestic) {
        steps.push('Passport Control (20 min)');
      }
      steps.push('Boarding Process (50-15 min before)');
      if (gateNumber) {
        steps.push(`Walk to Gate ${gateNumber} (10 min)`);
      }
      setEstimatedSteps(steps);
    } else {
      setTimeUntilFlight(null);
      setEstimatedSteps([]);
    }
  }, [hasNextFlight, nextFlightTime, isDomestic, hasBaggage, gateNumber]);

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    const now = new Date();
    
    let flightDateTime: Date | undefined = undefined;
    if (hasNextFlight && nextFlightTime) {
      flightDateTime = new Date(now.toDateString() + ' ' + nextFlightTime);
      // If flight time is earlier than current time, it must be tomorrow
      if (flightDateTime.getTime() < now.getTime()) {
        flightDateTime.setDate(flightDateTime.getDate() + 1);
      }
    }
    
    const tripDetails: TripDetails = {
      arrivalTime: now,
      terminal,
      arrivingGate: arrivingGate || undefined,
      isDomestic,
      hasBaggage,
      nextFlightTime: flightDateTime,
      gateNumber: gateNumber || undefined,
    };

    const preferences: UserPreferences = {
      budget: 2,
      dietary: undefined,
      mealType: 'quick-bite',
      mobility: 'normal',
      loungeAccess: false,
      customPreferences: preferencesText,
    };

    onComplete(tripDetails, preferences);
  };

  // Quick time presets
  const setQuickTime = (hours: number) => {
    const now = new Date();
    const future = new Date(now.getTime() + hours * 60 * 60 * 1000);
    setNextFlightTime(future.toTimeString().slice(0, 5));
    setSelectedTime(hours);
  };

  // Validation
  const canProceed = () => {
    if (step === 1) {
      return !hasNextFlight || nextFlightTime !== '';
    }
    return true;
  };

  // Welcome screen
  if (step === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
              <Plane className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-sans font-bold mb-3">Welcome to GateBuddy</h1>
            <p className="text-muted-foreground font-body">
              Your personal airport concierge. Never miss a flight or waste time waiting.
            </p>
          </div>

          <div className="space-y-4 my-8">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">1</div>
                <span>You land</span>
              </div>
              <div className="text-muted-foreground">→</div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">2</div>
                <span>We optimize</span>
              </div>
              <div className="text-muted-foreground">→</div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">3</div>
                <span>On time</span>
              </div>
            </div>
          </div>

          <Button size="lg" onClick={() => setStep(1)} className="w-full px-8">
            Get Started
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          <p className="text-sm text-muted-foreground font-body mt-6">
            Takes 30 seconds · Works for Nova Europa International (NEI)
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Plane className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-sans font-bold">
                  {step === 1 ? 'Trip Details' : 'Your Preferences'}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground font-body">
                  {step === 1 ? 'Tell us about your journey' : 'Customize your experience'}
                </p>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2">
                <div className={cn(
                  'h-2 flex-1 rounded-full transition-colors',
                  step >= 1 ? 'bg-primary' : 'bg-muted'
                )} />
                <span className={cn(
                  'text-xs font-medium font-body',
                  step >= 1 ? 'text-primary' : 'text-muted-foreground'
                )}>
                  Trip
                </span>
              </div>
              <div className="flex-1 flex items-center gap-2">
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
          </div>

          {/* Step 1: Trip Details */}
          {step === 1 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="terminal" className="text-sm sm:text-base font-semibold">
                  Which terminal did you arrive at?
                </Label>
                <Select value={terminal} onValueChange={setTerminal}>
                  <SelectTrigger id="terminal" className="h-10 sm:h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="T1">Terminal 1 (Gates A, B)</SelectItem>
                    <SelectItem value="T2">Terminal 2 (Gates C)</SelectItem>
                    <SelectItem value="T3">Terminal 3 (Gates D)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="arrivingGate" className="text-sm sm:text-base font-semibold">
                  Which gate did you arrive at?
                </Label>
                <Input
                  id="arrivingGate"
                  type="text"
                  placeholder="e.g., A1, B5, C10"
                  value={arrivingGate}
                  onChange={(e) => setArrivingGate(e.target.value)}
                  className="h-10 sm:h-12 text-sm sm:text-base"
                />
              </div>

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

              {hasNextFlight && (
                <>
                  <div className="space-y-3">
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
                      <Input
                        id="flightTime"
                        type="time"
                        value={nextFlightTime}
                        onChange={(e) => {
                          setNextFlightTime(e.target.value);
                          setSelectedTime(null);
                        }}
                        placeholder="Or enter exact time"
                        className="h-10 sm:h-12 text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gate" className="text-sm sm:text-base font-semibold">
                      Gate number (optional)
                    </Label>
                    <Input
                      id="gate"
                      type="text"
                      value={gateNumber}
                      onChange={(e) => setGateNumber(e.target.value.toUpperCase())}
                      placeholder="e.g., B12, C5, A10"
                      className="h-10 sm:h-12 text-sm sm:text-base"
                    />
                    <p className="text-xs text-muted-foreground font-body">
                      We'll calculate walking time to your gate
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: Preferences */}
          {step === 2 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-3">
                <Label htmlFor="preferences" className="text-sm sm:text-base font-semibold">
                  Tell us your preferences
                </Label>
                <p className="text-xs sm:text-sm text-muted-foreground font-body">
                  Describe what you're looking for (food, facilities, shopping, etc.)
                </p>
                <textarea
                  id="preferences"
                  value={preferencesText}
                  onChange={(e) => setPreferencesText(e.target.value)}
                  placeholder="e.g., I'm hungry and want a quick coffee, I need a pharmacy, I want to shop for souvenirs..."
                  className="w-full h-24 sm:h-32 p-3 sm:p-4 border border-border rounded-lg bg-background text-foreground font-body text-sm sm:text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-6 sm:mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              className="flex-1 h-10 sm:h-12 text-sm sm:text-base"
            >
              Back
            </Button>
            {step < 2 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 h-10 sm:h-12 text-sm sm:text-base"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleComplete}
                className="flex-1 h-10 sm:h-12 text-sm sm:text-base"
              >
                Create My Plan
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
