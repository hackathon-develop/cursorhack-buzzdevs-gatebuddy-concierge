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
    // Passenger information
    name: 'Sofia',
    origin_city: 'Stockholm',
    current_airport: 'Hamburg',
    destination: 'Denmark',

    // Flight information
    airport_name: 'Hamburg Airport',
    flight_number: tripDetails?.gateNumber ? `HAM${tripDetails.gateNumber.replace(/[A-Z]/g, '')}` : 'TBD',
    departure_gate: tripDetails?.gateNumber || 'TBD',

    // Timing
    arrival_time: '10:00',
    departure_time: '14:00',

    // Baggage and other details
    has_baggage: false,
    terminal: tripDetails?.terminal || 'T1',
    is_domestic: false,
  };
}
