import type { TripDetails } from './airportLogic';

export function buildDynamicVariables(
  tripDetails: TripDetails | null
): Record<string, string | number | boolean> {
  // Helper to format time as "HH:MM"
  const formatTime = (date: Date | undefined): string => {
    if (!date) return '--:--';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return {
    // Placeholder values for missing data
    name: 'Guest',
    airport_name: 'Nova Europa International',
    flight_number: tripDetails?.gateNumber ? `NEI${tripDetails.gateNumber.replace(/[A-Z]/g, '')}` : '',
    origin_city: tripDetails?.isDomestic ? 'Domestic' : 'International',

    // Real data from app state
    arrival_time: formatTime(tripDetails?.arrivalTime),
    departure_time: formatTime(tripDetails?.nextFlightTime),
    departure_gate: tripDetails?.gateNumber || 'TBD',

    // Additional useful context
    terminal: tripDetails?.terminal || 'T1',
    is_domestic: tripDetails?.isDomestic ?? false,
    has_baggage: tripDetails?.hasBaggage ?? false,
  };
}
