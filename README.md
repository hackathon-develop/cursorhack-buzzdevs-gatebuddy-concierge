# GateBuddy Concierge

AI-powered airport concierge that guides travelers through their layover with personalized itineraries, real-time recommendations, and voice assistance.

## Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS 4
- **UI Components**: shadcn/ui, Radix UI
- **Routing**: Wouter
- **State Management**: React Context API
- **AI/Voice**: ElevenLabs Conversational AI
- **Testing**: Vitest
- **Hosting**: Vercel/Netlify

## How to Run

### Prerequisites
- Node.js 22.x or higher
- pnpm package manager

### Installation & Development

```bash
# Clone the repo
git clone <repo-url>
cd gatebuddy/gatebuddy-concierge

# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Server will start at http://localhost:3000

### Environment Variables (Optional)
- `VITE_ANALYTICS_ENDPOINT` - Analytics endpoint
- `VITE_ANALYTICS_WEBSITE_ID` - Analytics website ID

## Details

### Key Features
- 🎙️ Voice-enabled AI concierge powered by ElevenLabs
- 🗺️ Smart itinerary planning based on available time and preferences
- 📍 POI recommendations (cafes, restaurants, lounges, shops)
- ⏰ Real-time status tracking with traffic-light urgency system
- 🎯 Personalized recommendations based on budget, dietary needs, mobility


### Notable Implementation
- Custom ElevenLabs widget integration with customer tailored experience
- support for multiple languages
- Trip details mapped from app state to AI conversation context
- Comprehensive airport dataset (24+ POIs across 3 terminals)
- notification

### Challenges
- integration between voice feature and as inputs to UI
- working with a new team in a short time


### Future Plans
- Real-time flight data integration
- Map navigation
- Real airport data (expand beyond fictional NEI airport)

## Commands

```bash
# Development
pnpm dev           # Start dev server

# Testing
pnpm vitest run    # Run tests
pnpm check        # Type checking

# Building
pnpm build        # Build for production
pnpm preview      # Preview production build
```
