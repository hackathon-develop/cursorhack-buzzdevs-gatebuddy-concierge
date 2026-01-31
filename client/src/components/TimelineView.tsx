// TimelineView: Vertical timeline with progress indicators
// Design: Swiss Rationalism - sequential flow, time markers, status visualization

import { Card } from '@/components/ui/card';
import { StatusBadge } from './StatusBadge';
import { TimeDisplay } from './TimeDisplay';
import { Plane, Shield, Luggage, MapPin, Coffee, ShoppingBag, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimelineStep } from '@/lib/airportLogic';

interface TimelineViewProps {
  timeline: TimelineStep[];
  className?: string;
}

export function TimelineView({ timeline, className }: TimelineViewProps) {
  if (timeline.length === 0) {
    return (
      <Card className={cn('p-8 text-center', className)}>
        <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground font-body">
          No itinerary yet. Complete the onboarding to generate your action plan.
        </p>
      </Card>
    );
  }

  const getStepIcon = (step: TimelineStep) => {
    switch (step.type) {
      case 'gate':
        return <Plane className="w-5 h-5" />;
      case 'checkpoint':
        if (step.id === 'security') return <Shield className="w-5 h-5" />;
        if (step.id === 'baggage') return <Luggage className="w-5 h-5" />;
        if (step.id === 'passport') return <MapPin className="w-5 h-5" />;
        return <MapPin className="w-5 h-5" />;
      case 'poi':
        return <Coffee className="w-5 h-5" />;
      default:
        return <MapPin className="w-5 h-5" />;
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-sans font-bold">Your Action Plan</h2>
        <StatusBadge status={timeline[timeline.length - 1]?.status || 'safe'}>
          Overall Status
        </StatusBadge>
      </div>

      <div className="relative">
        {timeline.map((step, index) => {
          const isLast = index === timeline.length - 1;
          
          return (
            <div key={step.id} className="relative pb-8">
              {/* Connecting line */}
              {!isLast && (
                <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-border" />
              )}
              
              <Card className="p-4">
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className={cn(
                    'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
                    step.status === 'safe' && 'bg-safe/10 text-safe',
                    step.status === 'tight' && 'bg-tight/10 text-tight',
                    step.status === 'risky' && 'bg-risky/10 text-risky'
                  )}>
                    {getStepIcon(step)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-sans font-semibold text-base">{step.name}</h3>
                        <p className="text-sm text-muted-foreground font-body">{step.location}</p>
                      </div>
                      <StatusBadge status={step.status} className="flex-shrink-0">
                        {step.status}
                      </StatusBadge>
                    </div>
                    
                    <p className="text-sm text-foreground font-body mb-3">
                      {step.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground font-body">
                      <div>
                        <span className="text-muted-foreground">Start: </span>
                        <TimeDisplay time={step.startTime} format="time" size="sm" />
                      </div>
                      
                      {step.travelTime > 0 && (
                        <div>
                          <span className="text-muted-foreground">Walk: </span>
                          <TimeDisplay time={step.travelTime} format="duration" size="sm" />
                        </div>
                      )}
                      
                      {step.duration > 0 && (
                        <div>
                          <span className="text-muted-foreground">Duration: </span>
                          <TimeDisplay time={step.duration} format="duration" size="sm" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
