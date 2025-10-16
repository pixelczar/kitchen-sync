# KitchenSync - Product Requirements Document

## Overview

**Product:** Family dashboard for kitchen tablet  
**Users:** 4 people (2 adults, 2 kids)  
**Core Functions:** Calendar, chores, todos, photos  
**Platform:** Web-first PWA, Capacitor wrapper later

### Vision

**Why KitchenSync exists:**  
KitchenSync helps families stay connected and on top of shared routines in one calm visual space. It replaces the chaos of paper calendars, text threads, and nagging with a delightful shared surface that everyone actually wants to use.

**Product Vibe:**  
Cozy, clever, lightweight magic. Playful but refined. Not corporate, not chaos.

---

## Why This Matters

### The Problem

Modern families are overwhelmed:
- **5+ calendars** across different apps (school, sports, work, personal)
- **Constant nagging** about chores ("Did you do your homework?")
- **Lost opportunities** for recognition (kids do great things, parents forget to acknowledge)
- **Scattered photos** (thousands on phones, never seen)
- **Mental load imbalance** (usually falls on one parent)

### Competitive Landscape

#### Skylight Calendar ($500-800)
- ✅ Clean hardware, nice display
- ✅ Simple calendar sync
- ❌ Closed ecosystem (proprietary app, limited features)
- ❌ Expensive subscription for basic features
- ❌ No personality or celebration
- ❌ Minimal chore/task management

#### Hearth Display ($500-600)
- ✅ Nice design, good calendar
- ❌ Even more locked down than Skylight
- ❌ Limited customization
- ❌ No gamification or recognition
- ❌ High cost for limited functionality

#### Cozyla Calendar ($800-1200)
- ✅ Full Android OS (flexible)
- ✅ Can install any app
- ✅ Larger screen options
- ❌ Unfocused experience (too many options, overwhelming)
- ❌ Generic Android interface (not family-optimized)
- ❌ No built-in recognition/celebration system
- ❌ Very expensive

### Our Differentiation

What makes KitchenSync special:
- ✅ **Vibrant personality** (not sterile like competitors)
- ✅ **Recognition-first** (Kudos system, celebrations)
- ✅ **Built for families** (person-based layout, kid-friendly)
- ✅ **Smart features** (email-to-calendar, AI photo curation)
- ✅ **Affordable** (runs on any tablet, no special hardware)
- ✅ **Open** (can add features, not locked down)
- ✅ **Performant** (optimized for low-end tablets)
- ✅ **Cool transitions** (smooth animations everywhere)
- ✅ **Mobile companion** (manage from anywhere)

---

## Core Features

### 🗓️ Stay Organized

#### Person-Based Chore Cards
Each family member gets their own colored card with:
- Name in bold lowercase
- Task list with checkboxes
- Streak indicators (🔥 3+ days)
- Completion animations
- Visual progress

**User Value:** Everyone sees their responsibilities at a glance. No nagging needed.

#### Shared Todo System
Simple task management for the whole family:
- One-off tasks for anyone
- Optional assignment to person
- Due dates and categories
- Quick add from mobile
- Shown on main dashboard

**User Value:** Household tasks don't get lost. Anyone can add, anyone can complete.

#### Calendar Integration
Never miss an event:
- Google Calendar OAuth sync (all 4 calendars)
- Color-coded by person
- Month/week/day views
- Smart clustering ("school mornings", "soccer nights")
- Touch-optimized event creation
- Works with existing calendar apps (no migration needed)

**User Value:** All family schedules in one place. No app switching.

### 🎉 Celebrate Effort

#### Kudos System
Recognition that sticks:
- Give kudos TO someone FOR something
- Long-press person → kudos picker slides up
- Categories: 💪 Great Effort, ❤️ Kind Act, 🧠 Smart Thinking, 🤝 Helpful, 😂 Made Me Laugh
- Kudos badge appears on person's card
- History in profile view
- No points/shop complexity (just genuine recognition)

**User Value:** Positive reinforcement becomes effortless. Kids feel seen. Parents remember to acknowledge.

#### Streak Tracking
Build consistency:
- Automatic tracking of consecutive chore completions
- 3 days → "Heating up! 🔥"
- 5 days → "On a roll! ⚡"
- 7 days → "Unstoppable! 🌟"
- 10 days → "Champion! 👑"
- Auto-kudos earned at milestones

**User Value:** Builds habits. Makes boring tasks rewarding.

#### Celebration Animations
Make wins feel epic:
- Background blurs + scales during celebration
- Modal slides in with spring animation
- Physics-based effects (ripple, morph, bloom)
- 2-3 second duration
- Satisfying sounds

**User Value:** Dopamine hit for completing tasks. Fun for kids, satisfying for adults.

### 📸 See Memories

#### Photo Screensaver
Your family's moments, always visible:
- After 5min idle → fullscreen slideshow
- Google Photos sync (selected albums)
- 10sec crossfades with Ken Burns effect
- AI-curated (only quality photos with faces)
- Touch anywhere to wake
- No manual photo management needed

**User Value:** Thousands of photos become visible. Kitchen tablet becomes ambient family photo frame.

---

## Smart Features (Phase 2)

### Email-to-Calendar (Highest Priority)
- Forward emails to: family@kitchensync.app
- GPT-4 parses: events, dates, times, recurrence
- Creates draft events
- One-tap confirm

**User Value:** No more manual entry of school newsletters, sports schedules, etc.

### "Busy Week" Alert
- Analyze schedule density
- Alert: "Next 3 days are packed 📅"
- Gentle banner, not alarming

**User Value:** Proactive awareness. Mental preparation for hectic periods.

### Smart Photo Curation
- AI filters Google Photos
- Only: faces, good quality, positive moments
- Exclude: screenshots, receipts, random food

**User Value:** Screensaver shows only meaningful moments, not clutter.

### Photo-to-Calendar (Later)
- Take photo of paper schedule
- OCR + AI extracts events
- One-tap add to calendar

**User Value:** Bridge paper world (school handouts) to digital calendar.

---

## What We're NOT Doing

**Out of Scope (v1):**
- ❌ Separate ephemeral sticker system
- ❌ Points/rewards shop
- ❌ Meal planner (maybe v2)
- ❌ Grocery list (maybe v2)
- ❌ Voice commands (phase 2)
- ❌ Weather widget (not core to family coordination)
- ❌ Multiple household management (architecture supports, UI doesn't)

**Why:** Focus on core coordination and recognition. Do those exceptionally well before expanding.

---

## Success Metrics

**Engagement:**
- Daily active users (all 4 family members)
- Tasks completed per week
- Kudos given per week
- Calendar events added/viewed

**Retention:**
- 30-day retention
- Weekly usage consistency

**Satisfaction:**
- Family reports reduced nagging
- Kids check chores without prompting
- Parents feel mental load is shared
- Photo screensaver brings joy

**Performance:**
- < 1s first render
- 60fps animations on target tablet
- < 100ms checkbox response

---

## Target Hardware

**Primary Device:**
- Samsung Galaxy Tab A9+ (11") - $220
- Tablet wall mount - $20
- Total: ~$240

**Future:**
- 15-17" Android tablet option
- Capacitor launcher mode for kiosk experience

**Note:** Must order tablet Week 1 for real-world performance testing.

---

## User Personas

### Sarah (Mom, 42)
- Carries the mental load
- Uses Google Calendar heavily
- Frustrated by nagging kids about chores
- Wants to recognize kids' efforts more
- Tech-savvy but values simplicity

**Needs:**
- See everyone's schedule in one place
- Chore system that works without nagging
- Easy way to give praise

### Mike (Dad, 44)
- Uses phone calendar sporadically
- Forgets to check family events
- Wants to be more involved in household coordination
- Values visual cues over notifications

**Needs:**
- Passive visibility into family schedule
- Simple task system
- Quick interactions

### Emma (Daughter, 12)
- Responsible but forgetful
- Responds well to positive reinforcement
- Likes seeing progress
- Enjoys playful interfaces

**Needs:**
- Clear view of what's expected
- Recognition when she does well
- Fun interactions

### Jake (Son, 9)
- Needs reminders
- Motivated by achievements
- Visual learner
- Enjoys celebrations

**Needs:**
- Visual task checklist
- Immediate feedback
- Celebration for streaks

---

## Release Strategy

### Phase 1: MVP (Weeks 1-4)
- Person-based chore system
- Shared todos
- Google Calendar integration
- Kudos system
- Streaks and celebrations
- Photo screensaver
- Settings panel
- Mobile companion

**Goal:** Core family coordination + recognition. Deploy to tablet.

### Phase 2: Smart Features (Week 5+)
- Email-to-calendar
- Smart photo curation
- Busy week alerts
- Performance optimization pass
- Capacitor wrapper

**Goal:** Reduce friction, add magic.

### Phase 3: Polish & Expansion (TBD)
- Meal planner
- Grocery list
- Multi-household support
- Public beta
- App Store release

---

**Document Version:** 1.0  
**Last Updated:** October 15, 2025  
**Owner:** Will

