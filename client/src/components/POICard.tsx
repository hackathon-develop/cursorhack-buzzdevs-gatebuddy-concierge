// POICard: Enhanced with Norman's principles
// Focus: Signifiers (time impact), Constraints (disable risky), Feedback (clear actions)

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, MapPin, Euro, Plus, Check, AlertTriangle, TrendingUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { POI } from '@/lib/airportLogic';

interface POICardProps {
  poi: POI & { travelTime?: number; totalTime?: number };
  isSelected?: boolean;
  onSelect?: () => void;
  onDeselect?: () => void;
  compact?: boolean;
  availableTime?: number; // minutes available before boarding
  wouldCauseMiss?: boolean; // would adding this make user miss flight?
}

export function POICard({ 
  poi, 
  isSelected, 
  onSelect, 
  onDeselect, 
  compact,
  availableTime,
  wouldCauseMiss = false
}: POICardProps) {
  const priceSymbols = '€'.repeat(poi.priceLevel);
  
  const categoryColors: Record<string, string> = {
    cafe: 'bg-amber-100 text-amber-900 border-amber-200',
    restaurant: 'bg-orange-100 text-orange-900 border-orange-200',
    lounge: 'bg-purple-100 text-purple-900 border-purple-200',
    shop: 'bg-blue-100 text-blue-900 border-blue-200',
    service: 'bg-green-100 text-green-900 border-green-200',
  };

  // Calculate time status
  const getTimeStatus = () => {
    if (!availableTime || !poi.totalTime) return null;
    
    const remaining = availableTime - poi.totalTime;
    if (wouldCauseMiss || remaining < 0) {
      return { 
        status: 'risky', 
        message: `Would make you ${Math.abs(remaining)} min late`,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        icon: AlertTriangle
      };
    }
    if (remaining < 15) {
      return { 
        status: 'tight', 
        message: `Only ${remaining} min buffer left`,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        icon: Clock
      };
    }
    return { 
      status: 'safe', 
      message: `${remaining} min buffer remaining`,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      icon: Check
    };
  };

  const timeStatus = getTimeStatus();

  return (
    <Card className={cn(
      'p-4 transition-all',
      isSelected && 'ring-2 ring-primary shadow-md',
      !isSelected && 'hover:shadow-md hover:border-primary/50',
      wouldCauseMiss && 'opacity-60'
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header with category and price */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge 
              variant="outline" 
              className={cn('text-xs font-medium', categoryColors[poi.category] || 'bg-gray-100')}
            >
              {poi.category}
            </Badge>
            {poi.priceLevel > 0 && (
              <span className="text-xs text-muted-foreground font-mono font-semibold">{priceSymbols}</span>
            )}
            {poi.tags.includes('quick-bite') && (
              <Badge variant="secondary" className="text-xs">
                ⚡ Quick
              </Badge>
            )}
          </div>
          
          <h3 className="font-sans font-semibold text-base mb-1 truncate">{poi.name}</h3>
          
          {!compact && (
            <p className="text-sm text-muted-foreground font-body mb-3 line-clamp-2">
              {poi.description}
            </p>
          )}
          
          {/* Location and time info with clear signifiers */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground font-body mb-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 cursor-help">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{poi.terminal} · {poi.zone.split('-').pop()?.toUpperCase()}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Location in airport</p>
              </TooltipContent>
            </Tooltip>
            
            {poi.travelTime !== undefined && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 cursor-help">
                    <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="font-mono font-semibold">{poi.travelTime}m walk</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Walking time from your location</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            {poi.avgWaitTime && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 cursor-help">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="font-mono">{poi.avgWaitTime[0]}-{poi.avgWaitTime[1]}m</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Typical wait/service time</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          
          {/* Tags */}
          {!compact && poi.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {poi.tags.slice(0, 4).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs font-body">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        {/* Right side: Time impact and action */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {poi.totalTime !== undefined && (
            <div className="text-right">
              <div className="text-xs text-muted-foreground font-body mb-0.5">Total time</div>
              <div className="text-2xl font-mono font-bold leading-none">
                {poi.totalTime}
                <span className="text-sm text-muted-foreground ml-0.5">m</span>
              </div>
            </div>
          )}
          
          {/* Time status indicator */}
          {timeStatus && !isSelected && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium',
                  timeStatus.bgColor,
                  timeStatus.color
                )}>
                  <timeStatus.icon className="w-3.5 h-3.5" />
                  <span className="font-mono">{timeStatus.status}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{timeStatus.message}</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {/* Action button with clear signifiers */}
          {(onSelect || onDeselect) && (
            <div className="w-full">
              {isSelected ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onDeselect}
                  className="w-full"
                >
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Added
                </Button>
              ) : wouldCauseMiss ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled
                        className="w-full opacity-50"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                        Too risky
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-semibold mb-1">Can't add this stop</p>
                    <p className="text-xs">Adding this would make you miss your flight. Try a quicker option or skip this stop.</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  size="sm"
                  variant="default"
                  onClick={onSelect}
                  className="w-full"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  {poi.totalTime ? `Add (+${poi.totalTime}m)` : 'Add to Plan'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Menu preview for food/beverage */}
      {!compact && poi.menu.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">Menu highlights</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {poi.menu.slice(0, 4).map((item, index) => (
              <div key={index} className="text-xs font-body text-muted-foreground truncate">
                • {item}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
