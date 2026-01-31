// Onboarding: Multi-step form for trip configuration
// Design: Swiss Rationalism - systematic data collection, clear progression

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, ArrowLeft, Plane } from 'lucide-react';
import type { TripDetails, UserPreferences } from '@/lib/airportLogic';

interface OnboardingProps {
  onComplete: (tripDetails: TripDetails, preferences: UserPreferences) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  
  // Trip details state
  const [terminal, setTerminal] = useState('T1');
  const [isDomestic, setIsDomestic] = useState(false);
  const [hasNextFlight, setHasNextFlight] = useState(true);
  const [nextFlightTime, setNextFlightTime] = useState('');
  const [gateNumber, setGateNumber] = useState('');
  
  // Preferences state
  const [budget, setBudget] = useState<1 | 2 | 3>(2);
  const [dietary, setDietary] = useState<string[]>([]);
  const [mealType, setMealType] = useState<'quick-bite' | 'sit-down'>('quick-bite');
  const [mobility, setMobility] = useState<'normal' | 'reduced'>('normal');
  const [loungeAccess, setLoungeAccess] = useState(false);

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    const now = new Date();
    
    const tripDetails: TripDetails = {
      arrivalTime: now,
      terminal,
      isDomestic,
      nextFlightTime: hasNextFlight && nextFlightTime 
        ? new Date(now.toDateString() + ' ' + nextFlightTime)
        : undefined,
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary flex items-center justify-center">
            <Plane className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-sans font-bold mb-2">Welcome to GateBuddy</h1>
          <p className="text-muted-foreground font-body">
            Let's get you through the airport efficiently
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`h-2 w-24 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`h-2 w-24 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        </div>

        {/* Step 1: Trip Details */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-sans font-semibold mb-4">Trip Details</h2>
            
            <div className="space-y-2">
              <Label htmlFor="terminal">Which terminal did you arrive at?</Label>
              <Select value={terminal} onValueChange={setTerminal}>
                <SelectTrigger id="terminal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="T1">Terminal 1</SelectItem>
                  <SelectItem value="T2">Terminal 2</SelectItem>
                  <SelectItem value="T3">Terminal 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="domestic" 
                checked={isDomestic}
                onCheckedChange={(checked) => setIsDomestic(checked as boolean)}
              />
              <Label htmlFor="domestic" className="font-body">
                This is a domestic arrival (no passport control)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="nextFlight" 
                checked={hasNextFlight}
                onCheckedChange={(checked) => setHasNextFlight(checked as boolean)}
              />
              <Label htmlFor="nextFlight" className="font-body">
                I have a connecting flight
              </Label>
            </div>

            {hasNextFlight && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="flightTime">Next flight departure time</Label>
                  <Input
                    id="flightTime"
                    type="time"
                    value={nextFlightTime}
                    onChange={(e) => setNextFlightTime(e.target.value)}
                    className="font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gate">Gate number (if known)</Label>
                  <Input
                    id="gate"
                    placeholder="e.g., B12"
                    value={gateNumber}
                    onChange={(e) => setGateNumber(e.target.value.toUpperCase())}
                    className="font-mono"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 2: Preferences */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-sans font-semibold mb-4">Your Preferences</h2>
            
            <div className="space-y-2">
              <Label>Budget level</Label>
              <div className="flex gap-2">
                {[1, 2, 3].map((level) => (
                  <Button
                    key={level}
                    variant={budget === level ? 'default' : 'outline'}
                    onClick={() => setBudget(level as 1 | 2 | 3)}
                    className="flex-1"
                  >
                    {'€'.repeat(level)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dietary preferences</Label>
              <div className="flex flex-wrap gap-2">
                {['vegan', 'halal', 'vegetarian'].map((diet) => (
                  <Button
                    key={diet}
                    variant={dietary.includes(diet) ? 'default' : 'outline'}
                    onClick={() => toggleDietary(diet)}
                    size="sm"
                  >
                    {diet}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Meal preference</Label>
              <div className="flex gap-2">
                <Button
                  variant={mealType === 'quick-bite' ? 'default' : 'outline'}
                  onClick={() => setMealType('quick-bite')}
                  className="flex-1"
                >
                  Quick bite
                </Button>
                <Button
                  variant={mealType === 'sit-down' ? 'default' : 'outline'}
                  onClick={() => setMealType('sit-down')}
                  className="flex-1"
                >
                  Sit-down meal
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mobility</Label>
              <div className="flex gap-2">
                <Button
                  variant={mobility === 'normal' ? 'default' : 'outline'}
                  onClick={() => setMobility('normal')}
                  className="flex-1"
                >
                  Normal
                </Button>
                <Button
                  variant={mobility === 'reduced' ? 'default' : 'outline'}
                  onClick={() => setMobility('reduced')}
                  className="flex-1"
                >
                  Reduced mobility
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="lounge" 
                checked={loungeAccess}
                onCheckedChange={(checked) => setLoungeAccess(checked as boolean)}
              />
              <Label htmlFor="lounge" className="font-body">
                I have lounge access
              </Label>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <Button onClick={handleNext}>
            {step === 2 ? 'Complete' : 'Next'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
