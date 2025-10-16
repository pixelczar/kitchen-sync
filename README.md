# KitchenSync

Family dashboard for kitchen tablet. Stay organized, celebrate effort, see memories—all in one vibrant, person-based interface.

## Overview

**KitchenSync** helps families coordinate and connect through a shared tablet in the kitchen. It combines:
- **Person-based chore cards** with streak tracking
- **Shared todo system** for household tasks
- **Google Calendar integration** for all family schedules
- **Kudos system** for recognition and celebration
- **Photo screensaver** pulling from Google Photos

**Vibe:** Cozy, clever, lightweight magic. Playful but refined.

---

## Why KitchenSync?

Modern families juggle 5+ calendars, constant nagging about chores, and thousands of unseen photos on their phones. KitchenSync replaces that chaos with one delightful shared surface everyone wants to use.

**What makes it special:**
- 🎨 **Vibrant personality** (not sterile like competitors)
- 🎉 **Recognition-first** (Kudos system, celebrations)
- 🔥 **Streak tracking** (builds consistency without nagging)
- 📱 **Mobile companion** (manage from anywhere)
- 🚀 **Performance-obsessed** (60fps on budget tablets)
- 💰 **Affordable** (runs on $220 tablet, not $800 hardware)

---

## Tech Stack

### Frontend
- **React 18** + **TypeScript** (strict mode)
- **Vite** (fast dev, optimized builds)
- **Tailwind CSS** (utility-first styling)
- **Framer Motion** (physics-based animations)
- **Zustand** (lightweight UI state)
- **React Query** (server state, polling)

### Backend
- **Firebase** (Firestore, Auth, Storage, Functions)
- **Google Calendar API** (multi-calendar sync)
- **Google Photos API** (screensaver photos)
- **OpenAI GPT-4** (email-to-calendar parsing)

### Deployment
- **PWA** (Phase 1: web-first, installable)
- **Capacitor** (Phase 2: Android wrapper for haptics, kiosk mode)

---

## Key Architectural Patterns

### Two-Layer State Management

**The Problem:** Real-time Firestore listeners cause frame drops during animations on low-end tablets.

**The Solution:**
1. **Zustand (UI State)** - Immediate, optimistic updates for smooth UX
2. **React Query (Server State)** - Polling (10s) instead of real-time
3. **Firestore (Source of Truth)** - Batched writes (500ms buffer)

**Why it matters:** This architecture ensures 60fps animations while maintaining data consistency.

See [`docs/architecture.md`](docs/architecture.md) for details.

### Batched Firestore Writes

User interactions update Zustand immediately (< 100ms response), then queue Firestore writes that execute in batches every 500ms. This keeps the UI buttery smooth while reducing database costs.

### Performance Budget

- **First render:** < 1s
- **Page transitions:** < 300ms at 60fps
- **Checkbox response:** < 100ms
- **Celebrations:** 60fps (2-3s duration)
- **Firestore writes:** < 50/min

**Target device:** Samsung Galaxy Tab A9+ (11") - $220 budget Android tablet

---

## Project Structure

```
kitchen-sync/
├── docs/                      # Documentation
│   ├── prd.md                # Product requirements
│   ├── design.md             # Design system & animations
│   ├── technical.md          # Data models & APIs
│   ├── architecture.md       # State management & architecture
│   ├── status.md             # Current progress
│   ├── decisions.md          # Architectural decision records
│   ├── hardware.md           # Target device & performance
│   ├── testing.md            # Testing strategy
│   └── components.md         # Component library (builds over time)
├── tasks/
│   └── tasks.md              # Implementation task list
├── fixes/                    # Complex bug fix documentation
├── src/                      # Application code (to be created)
│   ├── components/           # Presentational components
│   ├── features/             # Feature modules (tasks, kudos, calendar)
│   ├── stores/               # Zustand stores
│   ├── hooks/                # Shared React hooks
│   ├── lib/                  # Firebase, API clients, utilities
│   └── App.tsx               # Root component
├── .env.example              # Environment variable template
└── README.md                 # This file
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Firebase account** (free tier works for development)
- **Google Calendar API** credentials
- **Google Photos API** credentials
- **OpenAI API key** (for Phase 2 smart features)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/kitchen-sync.git
cd kitchen-sync

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Add your Firebase config and API keys to .env.local

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Development Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run test         # Run tests (when implemented)
```

---

## Documentation

- **[Product Requirements](docs/prd.md)** - What we're building and why
- **[Design System](docs/design.md)** - Colors, typography, animations
- **[Technical Specs](docs/technical.md)** - Data models, APIs, performance
- **[Architecture](docs/architecture.md)** - State management, data flow
- **[Tasks](tasks/tasks.md)** - Week-by-week implementation plan
- **[Status](docs/status.md)** - Current progress (updated weekly)

---

## Performance Philosophy

**Performance is a feature.** Competitors (Skylight, Hearth, Cozyla) work because they're smooth. We must match or exceed their responsiveness.

**Critical practices:**
1. **Test on target hardware early** - Desktop Chrome is 10x faster than budget tablet
2. **Zustand for UI, Firestore for truth** - Keeps animations at 60fps
3. **Framer Motion sparingly** - Test every animation on tablet
4. **Batched writes** - Avoid real-time sync jank during animations
5. **Always have minimal fallback** - If celebration effects drop frames, use simple version

See [`docs/technical.md`](docs/technical.md) for performance budget and monitoring.

---

## Target Hardware

**Primary Device:**
- Samsung Galaxy Tab A9+ (11") - $220
- Android 13
- Wall-mounted in kitchen

**Why this matters:**
- All performance testing happens on this device
- Animations must be 60fps on this specific tablet
- Desktop performance is **not** representative

**Order Week 1** - Can't build a tablet app without testing on a tablet.

---

## Development Workflow

1. **Check documentation** before starting any task ([`.cursorrules`](.cursorrules))
2. **Update [`docs/status.md`](docs/status.md)** when starting/completing tasks
3. **Document decisions** in [`docs/decisions.md`](docs/decisions.md) when making architectural choices
4. **Test on tablet** after implementing any animation or interaction
5. **Update component docs** in [`docs/components.md`](docs/components.md) as patterns emerge

---

## Current Status

**Phase:** Documentation scaffolding complete, ready for Week 1 implementation  
**Next Up:** Project setup (Vite + React + TypeScript + Firebase)

See [`docs/status.md`](docs/status.md) for detailed progress.

---

## Contributing

This is a personal project, but the architecture and patterns may be useful to others building family coordination apps.

**Key principles:**
- Simplicity over complexity
- Performance is a feature
- Iterate on working code
- Test on real hardware

See [`.cursorrules`](.cursorrules) for detailed development guidelines.

---

## License

[MIT License](LICENSE) (to be added)

---

## Contact

**Will** - Project Owner

Questions? Check the docs first, then open an issue.

---

**Let's get cooking! 🍳**

