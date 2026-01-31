// POICard: Point of Interest card component
// Design: Swiss Rationalism - systematic grid, clear hierarchy, functional badges

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Euro, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { POI } from '@/lib/airportLogic';

interface POICardProps {
  poi: POI & { travelTime?: number; totalTime?: number };
  isSelected?: boolean;
  onSelect?: () => void;
  onDeselect?: () => void;
  compact?: boolean;
}

export function POICard({ poi, isSelected, onSelect, onDeselect, compact }: POICardProps) {
  const priceSymbols = '€'.repeat(poi.priceLevel);
  
  const categoryColors: Record<string, string> = {
    cafe: 'bg-amber-100 text-amber-900 border-amber-200',
    restaurant: 'bg-orange-100 text-orange-900 border-orange-200',
    lounge: 'bg-purple-100 text-purple-900 border-purple-200',
    shop: 'bg-blue-100 text-blue-900 border-blue-200',
    service: 'bg-green-100 text-green-900 border-green-200',
  };

  return (
    <Card className={cn(
      'p-4 transition-all hover:shadow-md',
      isSelected && 'ring-2 ring-primary'
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-2">
            <Badge 
              variant="outline" 
              className={cn('text-xs font-medium', categoryColors[poi.category] || 'bg-gray-100')}
            >
              {poi.category}
            </Badge>
            {poi.priceLevel > 0 && (
              <span className="text-xs text-muted-foreground font-mono">{priceSymbols}</span>
            )}
          </div>
          
          <h3 className="font-sans font-semibold text-base mb-1 truncate">{poi.name}</h3>
          
          {!compact && (
            <p className="text-sm text-muted-foreground font-body mb-3 line-clamp-2">
              {poi.description}
            </p>
          )}
          
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground font-body">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{poi.terminal} · {poi.zone.split('-').pop()}</span>
            </div>
            
            {poi.travelTime !== undefined && (
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-mono">{poi.travelTime}m walk</span>
              </div>
            )}
            
            {poi.avgWaitTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-mono">{poi.avgWaitTime[0]}-{poi.avgWaitTime[1]}m wait</span>
              </div>
            )}
          </div>
          
          {!compact && poi.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {poi.tags.slice(0, 4).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs font-body">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-2">
          {poi.totalTime !== undefined && (
            <div className="text-right">
              <div className="text-xs text-muted-foreground font-body">Total</div>
              <div className="text-lg font-mono font-semibold">{poi.totalTime}m</div>
            </div>
          )}
          
          {(onSelect || onDeselect) && (
            <Button
              size="sm"
              variant={isSelected ? 'secondary' : 'default'}
              onClick={isSelected ? onDeselect : onSelect}
              className="min-w-[80px]"
            >
              {isSelected ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Added
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
