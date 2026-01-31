// Onboarding: Redesigned with Don Norman's "Design of Everyday Things" principles
// Focus: Affordances, Signifiers, Feedback, Constraints, Natural Mapping

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, Plane, Clock, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TripDetails, UserPreferences } from '@/lib/airportLogic';

interface OnboardingProps {
  onComplete: (tripDetails: TripDetails, preferences: UserPreferences) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0); // 0 = welcome, 1 = trip, 2 = preferences
  
  // Trip details state
  const [terminal, setTerminal] = useState('T1');
  const [isDomestic, setIsDomestic] = useState(false);
  const [hasBaggage, setHasBaggage] = useState(false);
  const [hasNextFlight, setHasNextFlight] = useState(true);
  const [nextFlightTime, setNextFlightTime] = useState('');
  const [gateNumber, setGateNumber] = useState('');
  
  // Preferences state
  const [budget, setBudget] = useState<1 | 2 | 3>(2);
  const [dietary, setDietary] = useState<string[]>([]);
  const [mealType, setMealType] = useState<'quick-bite' | 'sit-down'>('quick-bite');
  const [mobility, setMobility] = useState<'normal' | 'reduced'>('normal');
  const [loungeAccess, setLoungeAccess] = useState(false);

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
        steps.push('Security (15 min)');
      }
      // Domestic flights don't need security or passport control
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
    } else {
      handleComplete();
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
      isDomestic,
      hasBaggage,
      nextFlightTime: flightDateTime,
      gateNumber: gateNumber || undefined,
    };

    const preferences: UserPreferences = {
      budget,
      dietary: dietary.length > 0 ? dietary : undefined,
      mealType,
      mobility,
      loungeAccess,
    };

    onComplete(tripDetails, preferences);
  };

  const toggleDietary = (value: string) => {
    setDietary(prev => 
      prev.includes(value) 
        ? prev.filter(d => d !== value)
        : [...prev, value]
    );
  };

  // Quick time presets
  const setQuickTime = (hours: number) => {
    const now = new Date();
    const future = new Date(now.getTime() + hours * 60 * 60 * 1000);
    setNextFlightTime(future.toTimeString().slice(0, 5));
  };

  // Validation
  const canProceed = () => {
    if (step === 1) {
      return !hasNextFlight || nextFlightTime !== '';
    }
    return true;
  };

  const getTimeStatus = () => {
    if (!timeUntilFlight) return null;
    const estimatedTotal = estimatedSteps.length * 15; // rough estimate
    const buffer = timeUntilFlight - estimatedTotal - 30; // 30 min for boarding
    
    if (buffer > 60) return { status: 'safe', message: 'Plenty of time', icon: CheckCircle2, color: 'text-green-600' };
    if (buffer > 30) return { status: 'tight', message: 'Moderate pace needed', icon: Clock, color: 'text-yellow-600' };
    return { status: 'risky', message: 'Very tight connection!', icon: AlertCircle, color: 'text-red-600' };
  };

  const timeStatus = getTimeStatus();

  // Welcome Screen
  if (step === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary flex items-center justify-center">
            <Plane className="w-10 h-10 text-primary-foreground" />
          </div>
          
          <h1 className="text-4xl font-sans font-bold mb-4">Welcome to GateBuddy</h1>
          <p className="text-xl text-muted-foreground font-body mb-8 max-w-2xl mx-auto">
            Your personal airport concierge. Never miss a flight or waste time waiting.
          </p>

          {/* Visual Journey Preview */}
          <div className="flex items-center justify-center gap-4 mb-12 max-w-2xl mx-auto">
            <div className="flex-1 text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <p className="font-sans font-semibold mb-1">Arrival</p>
              <p className="text-sm text-muted-foreground font-body">You land</p>
            </div>
            
            <ArrowRight className="w-6 h-6 text-muted-foreground flex-shrink-0" />
            
            <div className="flex-1 text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <p className="font-sans font-semibold mb-1">Smart Plan</p>
              <p className="text-sm text-muted-foreground font-body">We optimize</p>
            </div>
            
            <ArrowRight className="w-6 h-6 text-muted-foreground flex-shrink-0" />
            
            <div className="flex-1 text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                <Plane className="w-8 h-8 text-primary" />
              </div>
              <p className="font-sans font-semibold mb-1">Departure</p>
              <p className="text-sm text-muted-foreground font-body">On time</p>
            </div>
          </div>

          <Button size="lg" onClick={() => setStep(1)} className="px-8">
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
      <div className="w-full max-w-6xl flex gap-6">
        {/* Main Form */}
        <Card className="flex-1 p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <Plane className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-sans font-bold">
                  {step === 1 ? 'Trip Details' : 'Your Preferences'}
                </h2>
                <p className="text-sm text-muted-foreground font-body">
                  {step === 1 ? 'Tell us about your journey' : 'Customize your experience'}
                </p>
              </div>
            </div>

            {/* Progress indicator with labels */}
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
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="terminal" className="text-base font-semibold">
                  Which terminal did you arrive at?
                </Label>
                <Select value={terminal} onValueChange={setTerminal}>
                  <SelectTrigger id="terminal" className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="T1">Terminal 1 (Gates A, B)</SelectItem>
                    <SelectItem value="T2">Terminal 2 (Gates C)</SelectItem>
                    <SelectItem value="T3">Terminal 3 (Gates D)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                <Checkbox 
                  id="domestic" 
                  checked={isDomestic}
                  onCheckedChange={(checked) => setIsDomestic(checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="domestic" className="font-semibold cursor-pointer">
                    Domestic arrival
                  </Label>
                  <p className="text-sm text-muted-foreground font-body">
                    Skip passport control and security (saves ~35 minutes)
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                <Checkbox 
                  id="baggage" 
                  checked={hasBaggage}
                  onCheckedChange={(checked) => setHasBaggage(checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="baggage" className="font-semibold cursor-pointer">
                    I need to collect checked baggage
                  </Label>
                  <p className="text-sm text-muted-foreground font-body">
                    Adds ~15 minutes for baggage claim
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                <Checkbox 
                  id="nextFlight" 
                  checked={hasNextFlight}
                  onCheckedChange={(checked) => setHasNextFlight(checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="nextFlight" className="font-semibold cursor-pointer">
                    I have a connecting flight
                  </Label>
                  <p className="text-sm text-muted-foreground font-body">
                    We'll make sure you don't miss it
                  </p>
                </div>
              </div>

              {hasNextFlight && (
                <>
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">
                      When is your next flight?
                    </Label>
                    
                    {/* Quick time buttons */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuickTime(1)}
                        className="flex-1"
                      >
                        In 1 hour
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuickTime(2)}
                        className="flex-1"
                      >
                        In 2 hours
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuickTime(4)}
                        className="flex-1"
                      >
                        In 4 hours
                      </Button>
                    </div>

                    <div className="relative">
                      <Input
                        id="flightTime"
                        type="time"
                        value={nextFlightTime}
                        onChange={(e) => setNextFlightTime(e.target.value)}
                        className="h-12 font-mono text-lg"
                        placeholder="Or enter exact time"
                      />
                      {timeUntilFlight !== null && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Badge variant="secondary" className="font-mono">
                            {Math.floor(timeUntilFlight / 60)}h {timeUntilFlight % 60}m
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gate" className="text-base font-semibold">
                      Gate number (optional)
                    </Label>
                    <Input
                      id="gate"
                      placeholder="e.g., B12, C5, A10"
                      value={gateNumber}
                      onChange={(e) => setGateNumber(e.target.value.toUpperCase())}
                      className="h-12 font-mono text-lg"
                    />
                    <p className="text-sm text-muted-foreground font-body">
                      We'll calculate walking time to your gate
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: Preferences */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Budget level</Label>
                <p className="text-sm text-muted-foreground font-body">
                  We'll only recommend places within your budget
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((level) => (
                    <Button
                      key={level}
                      variant={budget === level ? 'default' : 'outline'}
                      onClick={() => setBudget(level as 1 | 2 | 3)}
                      className="h-16 flex flex-col items-center justify-center"
                    >
                      <span className="text-xl mb-1">{'€'.repeat(level)}</span>
                      <span className="text-xs">
                        {level === 1 ? 'Budget' : level === 2 ? 'Moderate' : 'Premium'}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Dietary preferences</Label>
                <p className="text-sm text-muted-foreground font-body">
                  Select all that apply
                </p>
                <div className="flex flex-wrap gap-2">
                  {['vegan', 'halal', 'vegetarian'].map((diet) => (
                    <Button
                      key={diet}
                      variant={dietary.includes(diet) ? 'default' : 'outline'}
                      onClick={() => toggleDietary(diet)}
                      size="sm"
                      className="capitalize"
                    >
                      {dietary.includes(diet) && <CheckCircle2 className="w-4 h-4 mr-2" />}
                      {diet}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Meal preference</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={mealType === 'quick-bite' ? 'default' : 'outline'}
                    onClick={() => setMealType('quick-bite')}
                    className="h-20 flex flex-col items-center justify-center"
                  >
                    <span className="font-semibold mb-1">Quick Bite</span>
                    <span className="text-xs opacity-80">5-10 minutes</span>
                  </Button>
                  <Button
                    variant={mealType === 'sit-down' ? 'default' : 'outline'}
                    onClick={() => setMealType('sit-down')}
                    className="h-20 flex flex-col items-center justify-center"
                  >
                    <span className="font-semibold mb-1">Sit-Down</span>
                    <span className="text-xs opacity-80">20-30 minutes</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Mobility</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={mobility === 'normal' ? 'default' : 'outline'}
                    onClick={() => setMobility('normal')}
                    className="h-16"
                  >
                    Normal pace
                  </Button>
                  <Button
                    variant={mobility === 'reduced' ? 'default' : 'outline'}
                    onClick={() => setMobility('reduced')}
                    className="h-16"
                  >
                    Slower pace
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                <Checkbox 
                  id="lounge" 
                  checked={loungeAccess}
                  onCheckedChange={(checked) => setLoungeAccess(checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="lounge" className="font-semibold cursor-pointer">
                    I have lounge access
                  </Label>
                  <p className="text-sm text-muted-foreground font-body">
                    We'll recommend airport lounges
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <Button 
              onClick={handleNext}
              disabled={!canProceed()}
              size="lg"
            >
              {step === 2 ? 'Create My Plan' : 'Continue'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>

        {/* Live Preview Sidebar */}
        {step > 0 && (
          <Card className="w-80 p-6 flex-shrink-0">
            <h3 className="font-sans font-bold text-lg mb-4">Live Preview</h3>
            
            {timeUntilFlight !== null && timeStatus && (
              <div className={cn('mb-6 p-4 rounded-lg border-2', 
                timeStatus.status === 'safe' && 'bg-green-50 border-green-200',
                timeStatus.status === 'tight' && 'bg-yellow-50 border-yellow-200',
                timeStatus.status === 'risky' && 'bg-red-50 border-red-200'
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <timeStatus.icon className={cn('w-5 h-5', timeStatus.color)} />
                  <span className={cn('font-semibold', timeStatus.color)}>
                    {timeStatus.message}
                  </span>
                </div>
                <p className="text-sm font-body">
                  {timeUntilFlight} minutes until departure
                </p>
              </div>
            )}

            {estimatedSteps.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 text-sm text-muted-foreground">
                  Your Journey
                </h4>
                <div className="space-y-2">
                  {estimatedSteps.map((stepText, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-mono font-semibold text-primary">
                          {index + 1}
                        </span>
                      </div>
                      <span className="font-body">{stepText}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold mb-3 text-sm text-muted-foreground">
                  Your Preferences
                </h4>
                <div className="space-y-2 text-sm font-body">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Budget:</span>
                    <span className="font-mono">{'€'.repeat(budget)}</span>
                  </div>
                  {dietary.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Diet:</span>
                      <span className="capitalize">{dietary.join(', ')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Meal:</span>
                    <span className="capitalize">{mealType.replace('-', ' ')}</span>
                  </div>
                </div>
              </div>
            )}

            {!hasNextFlight && step === 1 && (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground font-body">
                  No rush! We'll help you explore the airport at your own pace.
                </p>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
