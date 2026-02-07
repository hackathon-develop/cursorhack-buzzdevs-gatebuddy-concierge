***** Archibved *****

this belongs to the hackathon result of https://github.com/hackathon-develop/cursorhack-buzzdevs




# GateBuddy Concierge

**An intelligent airport concierge web application that guides travelers through the airport with real-time recommendations, itinerary planning, and time-sensitive navigation.**

![GateBuddy Concierge](https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&h=400&fit=crop)

---

## 🎯 Overview

GateBuddy Concierge is a single-page web application designed to help travelers navigate through airports efficiently. Built for **Nova Europa International (NEI)**, a fictional airport with three terminals, the app provides:

- **Chat-based concierge** for natural language queries
- **Automated itinerary planning** with time calculations
- **Smart POI recommendations** based on preferences and available time
- **Real-time status tracking** with traffic-light urgency indicators
- **Comprehensive airport dataset** with 24+ points of interest

---

## 🏗️ Architecture

### Design Philosophy: Swiss Rationalism meets Digital Wayfinding

The application follows a design system inspired by airport signage:

- **Absolute clarity**: Ruthless information hierarchy prioritizing critical data
- **Systematic grid**: Modular layout with strict alignment
- **Functional color**: Traffic-light system (green/amber/red) for urgency
- **Kinetic feedback**: Purposeful micro-animations for state changes

### Technology Stack

- **Frontend Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4 with custom design tokens
- **UI Components**: shadcn/ui component library
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: React Context API
- **Testing**: Vitest with 22 automated tests
- **Build Tool**: Vite

### Typography System

- **Display**: DM Sans (bold, 600-700) for headings
- **Body**: Inter (regular, 400-500) for content
- **Data**: JetBrains Mono (medium, 500) for times, gates, distances

---

## 📁 Project Structure

```
gatebuddy-concierge/
├── client/
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── TimelineView.tsx
│   │   │   ├── POICard.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── TimeDisplay.tsx
│   │   │   └── Onboarding.tsx
│   │   ├── contexts/        # React contexts
│   │   │   └── AppContext.tsx
│   │   ├── data/            # Airport dataset
│   │   │   └── airport.json
│   │   ├── lib/             # Core logic
│   │   │   ├── airportLogic.ts
│   │   │   └── airportLogic.test.ts
│   │   ├── pages/           # Page components
│   │   │   ├── Home.tsx
│   │   │   └── NotFound.tsx
│   │   ├── App.tsx          # Root component
│   │   ├── main.tsx         # Entry point
│   │   └── index.css        # Global styles
│   └── index.html
├── ideas.md                 # Design exploration document
├── README.md                # This file
└── package.json
```

---

## 🗺️ Airport Dataset

### Nova Europa International (NEI)

The fictional airport includes:

- **3 Terminals**: T1, T2, T3
- **19 Zones**: Arrivals, Baggage Claim, Passport Control, Departures, Security, Gate areas
- **24+ POIs** across categories:
  - **Cafés**: Café Europa, Brew & Bean, Juice Bar
  - **Restaurants**: Gate Grill, Sushi Express, Pasta Pronto, Mediterranean Bistro, Noodle Station
  - **Lounges**: The Lounge Club, Sky Lounge
  - **Shops**: Duty Free Plaza, Tech Hub, Bookstore & News
  - **Services**: Pharmacy, SIM cards, Help Desks, Baggage Services, Currency Exchange
- **20 Gates**: A1-A15, B1-B20, C1-C25, D1-D18

Each POI includes:
- Name, category, terminal, zone
- Coordinates (x, y) for distance calculation
- Opening hours
- Average wait time range
- Price level (€, €€, €€€)
- Tags (vegan, halal, quick-bite, etc.)
- Menu items (for food/beverage)
- Description

---

## 🧮 Core Logic Functions

### `compute_travel_time(from, to, mobilityMode)`

Calculates walking time between two locations.

- **Parameters**:
  - `from`: Starting coordinates `{x, y, terminal}`
  - `to`: Destination coordinates `{x, y, terminal}`
  - `mobilityMode`: `'normal'` (1.3 m/s) or `'reduced'` (0.8 m/s)
- **Returns**: Travel time in minutes
- **Logic**:
  - Euclidean distance calculation
  - Scale factor: abstract units → meters
  - Terminal change penalty: +10 minutes

### `estimate_queue_times(time, terminal, checkpointType, isDomestic)`

Estimates queue times for checkpoints based on time of day.

- **Parameters**:
  - `time`: Current time
  - `terminal`: Terminal ID
  - `checkpointType`: `'security'` | `'passport'` | `'baggage'`
  - `isDomestic`: Boolean
- **Returns**: Estimated wait time in minutes
- **Logic**:
  - Peak hours (6-9 AM, 4-7 PM): +50-100% wait time
  - Passport control: 0 minutes for domestic
  - Security: 10-20 minutes
  - Baggage: 15-20 minutes

### `recommend_pois(userLocation, preferences, currentTime, availableTime?)`

Recommends POIs based on user constraints.

- **Parameters**:
  - `userLocation`: Current coordinates
  - `preferences`: Budget, dietary, meal type, mobility, lounge access
  - `currentTime`: Current time
  - `availableTime`: Optional time constraint in minutes
- **Returns**: Array of POIs sorted by total time (travel + service)
- **Logic**:
  - Filter by budget (price level ≤ user budget)
  - Filter by dietary restrictions (vegan, halal, etc.)
  - Filter by meal type (quick-bite vs sit-down)
  - Filter by opening hours
  - Filter by available time
  - Sort by total time ascending

### `build_timeline(tripDetails, preferences, selectedPOIs)`

Generates a sequential action plan timeline.

- **Parameters**:
  - `tripDetails`: Arrival time, terminal, next flight, gate, domestic/international
  - `preferences`: User preferences
  - `selectedPOIs`: Array of POIs to include
- **Returns**: Array of `TimelineStep` objects
- **Logic**:
  1. Start at arrivals hall
  2. Baggage claim (if needed)
  3. Passport control (if international)
  4. Selected POIs in order
  5. Security checkpoint (if connecting flight)
  6. Gate
  7. Calculate status (safe/tight/risky) based on remaining time

### `getTimeUntilBoarding(nextFlightTime)`

Calculates minutes remaining until boarding (departure - 30 min).

### `formatDuration(minutes)`

Formats duration as human-readable string (e.g., "2h 5m").

---

## 🧪 Testing

The application includes **22 automated tests** covering:

### Distance and Travel Time Calculations (4 tests)
- Euclidean distance calculation
- Same-terminal travel time
- Terminal change penalty
- Reduced mobility adjustment

### Queue Time Estimation (3 tests)
- Peak vs off-peak hours
- Domestic vs international passport control
- Security checkpoint wait times

### POI Opening Hours (2 tests)
- 24/7 POI availability
- Time-based opening hours

### POI Recommendation System (5 tests)
- Budget filtering
- Dietary restriction filtering
- Total time sorting
- Available time filtering
- Lounge access inclusion

### Timeline Building (4 tests)
- Baggage claim for international arrivals
- Passport control inclusion
- Security checkpoint for connecting flights
- Risk status calculation

### Utility Functions (4 tests)
- Time until boarding calculation
- Duration formatting (minutes, hours, exact hours)

**Run tests**:
```bash
pnpm vitest run
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 22.x or higher
- pnpm package manager

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd gatebuddy-concierge

# Install dependencies
pnpm install
```

### Development

```bash
# Start development server
pnpm dev

# Open browser to http://localhost:3000
```

### Build for Production

```bash
# Build the application
pnpm build

# Preview production build
pnpm preview
```

### Run Tests

```bash
# Run all tests
pnpm vitest run

# Run tests in watch mode
pnpm vitest

# Run type checking
pnpm check
```

---

## 🎨 User Experience

### Onboarding Flow

1. **Trip Details**:
   - Select arrival terminal (T1, T2, T3)
   - Domestic vs international arrival
   - Connecting flight details (time, gate)

2. **Preferences**:
   - Budget level (€, €€, €€€)
   - Dietary restrictions (vegan, halal, vegetarian)
   - Meal type (quick-bite vs sit-down)
   - Mobility (normal vs reduced)
   - Lounge access

### Main Interface

**Split-pane layout (40/60)**:

- **Left Panel (40%)**: Chat interface
  - Conversational AI concierge
  - Quick-reply buttons
  - Natural language queries
  - Example: "Where's the nearest coffee?"

- **Right Panel (60%)**: Data panels
  - **Timeline Tab**: Sequential action plan with status indicators
  - **Nearby Options Tab**: Filtered POI recommendations

**Top Bar**:
- Current terminal and zone
- Real-time clock
- Countdown to boarding
- "Optimize Plan" button (removes optional stops)
- "Start Over" button

### Chat Concierge Features

The concierge responds to:
- **Food queries**: "Where's the nearest coffee?", "Show me vegan options"
- **Time checks**: "Can I make it to my gate if I eat?"
- **Amenities**: "I need a restroom", "Where's the lounge?"
- **General help**: "What can you do?"

### Status System

**Traffic-light indicators**:
- 🟢 **Safe**: Plenty of time remaining
- 🟡 **Tight**: Should move soon
- 🔴 **Risky**: Need to go now

---

## 🎯 Sample Scenarios

The app supports pre-configured demo scenarios:

1. **45-minute layover, hungry, gate unknown**
   - Shows fastest food options
   - Calculates risk of missing flight
   - Recommends quick-bite over sit-down

2. **2 hours free, lounge access**
   - Recommends nearby lounges
   - Includes time for shopping/browsing
   - Ensures timely gate arrival

3. **Arriving international, need SIM + coffee**
   - Plans passport control wait
   - Routes to SIM kiosk
   - Finds nearest café en route to gate

---

## 🔧 Admin/Debug Features

The codebase is structured to support future admin features:

- **Dataset editor**: Modify POIs, zones, gates via JSON
- **Debug mode**: View raw timeline calculations
- **Simulation**: Test different scenarios programmatically

To edit the airport dataset, modify:
```
client/src/data/airport.json
```

---

## 🚦 Design Decisions

### Why rule-based chat instead of LLM?

The current implementation uses rule-based responses for:
- **Deterministic behavior**: Predictable, testable responses
- **Low latency**: Instant replies without API calls
- **Offline capability**: Works without internet
- **Cost efficiency**: No per-query costs

The architecture supports future LLM integration via the chat interface abstraction.

### Why Euclidean distance?

Abstract x/y coordinates with Euclidean distance provide:
- **Simplicity**: Easy to understand and test
- **Flexibility**: Can adjust scale factor without changing dataset
- **Sufficient accuracy**: For wayfinding guidance, exact paths aren't critical

### Why traffic-light status colors?

Green/amber/red is:
- **Universal**: Recognized globally
- **Instant comprehension**: No explanation needed
- **Accessible**: Works for colorblind users with text labels

---

## 📊 Performance Considerations

- **Lightweight dataset**: JSON file < 50 KB
- **Client-side computation**: No server calls for recommendations
- **Optimized rendering**: React memoization for expensive calculations
- **Lazy loading**: Components loaded on demand

---

## 🔮 Future Enhancements

### Phase 2 Features
- **Real-time flight data**: Integrate with flight APIs
- **Push notifications**: Boarding alerts, gate changes
- **Multi-language support**: i18n for international travelers
- **Accessibility improvements**: Screen reader optimization, high-contrast mode
- **Offline mode**: Service worker for PWA functionality

### Phase 3 Features
- **LLM integration**: Natural language understanding with GPT-4
- **AR wayfinding**: Augmented reality navigation
- **Social features**: Share itineraries, meet-up coordination
- **Loyalty integration**: Airport lounge access verification
- **Real airport data**: Expand to actual airports (JFK, LHR, etc.)

---

## 🤝 Contributing

This is a demonstration project. For production use:

1. Replace fictional airport data with real airport APIs
2. Integrate flight status APIs (FlightAware, FlightStats)
3. Add user authentication and profile persistence
4. Implement analytics for usage tracking
5. Add error boundaries and fallback UI

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- **Design inspiration**: Swiss International Air Lines signage system
- **Airport data structure**: Based on IATA airport terminal standards
- **Typography**: Google Fonts (DM Sans, Inter, JetBrains Mono)
- **UI Components**: shadcn/ui component library

---

## 📞 Support

For questions or issues:
- Open an issue on GitHub
- Contact: support@gatebuddy.example.com

---

**Built with ❤️ for travelers who value their time.**
