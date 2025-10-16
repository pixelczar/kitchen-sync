# KitchenSync - Hardware Testing Guide

## Target Device

### Samsung Galaxy Tab A9+ (11")

**Why this device:**
- Affordable ($220) - Representative of consumer budget tablets
- 11" screen - Perfect kitchen dashboard size
- Android 13 - Modern OS with good PWA support
- Mid-range specs - If it runs smoothly here, it'll run anywhere

**Specs:**
- **Display:** 11" (1920 x 1200), LCD, 60Hz
- **Processor:** Qualcomm Snapdragon 695 5G (octa-core)
- **RAM:** 4GB or 8GB (test on 4GB model - worst case)
- **Storage:** 64GB or 128GB
- **GPU:** Adreno 619
- **OS:** Android 13, One UI 5.1
- **Browser:** Chrome (keep updated to latest)

**Purchase:**
- **Retailer:** Amazon, Best Buy, or Samsung.com
- **Price:** ~$220 (frequently on sale)
- **Delivery:** 2-5 days
- **Accessories:** Tablet wall mount (~$20)

**Order Week 1** - Can't test animations properly on desktop. Desktop Chrome is 10x faster than this tablet.

---

## Setup Instructions

### Initial Setup

1. **Unbox and charge** to 100%
2. **Complete Android setup**
   - Skip Google account (add later)
   - Disable bloatware apps
   - Enable Developer Options (tap Build Number 7 times)
3. **Install Chrome** (if not pre-installed)
4. **Enable USB debugging** (Settings > Developer Options)
5. **Connect to WiFi** (same network as dev machine)

### Developer Settings

**Enable in Settings > Developer Options:**
- ✅ USB debugging
- ✅ Stay awake (when charging)
- ✅ Show layout bounds (helpful for debugging)
- ✅ Force GPU rendering
- ❌ Don't keep activities (leave off - we want realistic behavior)
- ❌ Limit background processes (leave at standard)

**Display settings:**
- Brightness: 75%
- Auto-rotate: Off (landscape only)
- Screen timeout: 30 minutes (for testing)
- Font size: Default

---

## Performance Benchmarking

### Baseline Metrics

**First Time Setup (to be measured):**

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| First render (cold start) | < 1s | _TBD_ | ⏳ |
| First render (warm start) | < 500ms | _TBD_ | ⏳ |
| Dashboard → Calendar transition | < 300ms @ 60fps | _TBD_ | ⏳ |
| Calendar → Dashboard transition | < 300ms @ 60fps | _TBD_ | ⏳ |
| Checkbox toggle response | < 100ms | _TBD_ | ⏳ |
| Kudos picker slide-up | < 250ms @ 60fps | _TBD_ | ⏳ |
| Settings panel slide-in | < 300ms @ 60fps | _TBD_ | ⏳ |
| Celebration animation | 2-3s @ 60fps | _TBD_ | ⏳ |
| Screensaver transition | 10s crossfade @ 60fps | _TBD_ | ⏳ |

**Legend:**
- ✅ Meeting target
- ⚠️ Close to target (within 10%)
- ❌ Missing target
- ⏳ Not yet measured

### How to Measure

**Frame rate (FPS):**
1. Open Chrome DevTools on desktop
2. Connect tablet via USB (`chrome://inspect`)
3. Enable "Rendering" tab
4. Check "Frame Rendering Stats"
5. Perform interaction, observe FPS counter

**Interaction latency:**
1. Use Chrome DevTools Performance tab
2. Record interaction (checkbox toggle, navigation)
3. Measure time from click to visual feedback
4. Should be < 100ms for checkboxes, < 300ms for animations

**Load times:**
1. Use Chrome DevTools Lighthouse
2. Run audit in mobile mode
3. Check "Performance" score
4. Target: > 90 score

---

## Testing Checklist

### Week 1-2: MVP Foundation

**Dashboard:**
- [ ] Person cards render in < 1s (cold start)
- [ ] 2x2 grid layout displays correctly
- [ ] Checkbox touch targets are 48px minimum
- [ ] Checkbox toggle feels instant (< 100ms)
- [ ] Checkmark stroke animation is smooth (60fps)
- [ ] Scrolling is smooth (if needed)

**Calendar:**
- [ ] Dashboard → Calendar transition is smooth (60fps)
- [ ] Month view renders correctly
- [ ] Event dots are visible and tappable
- [ ] Swipe gestures work (if implemented)

**Screensaver:**
- [ ] Activates after 5min idle
- [ ] Photos crossfade smoothly (60fps)
- [ ] Ken Burns effect is subtle and smooth
- [ ] Touch anywhere wakes app
- [ ] Returns to dashboard without lag

### Week 3: Recognition & Polish

**Kudos:**
- [ ] Kudos picker slides up smoothly (60fps)
- [ ] Bottom sheet backdrop blurs correctly
- [ ] Category buttons are easily tappable
- [ ] Picker slides down on dismiss

**Celebrations:**
- [ ] Background blur + scale works smoothly
- [ ] Celebration modal spring animation is smooth (60fps)
- [ ] Physics effects (ripple/morph/bloom) run at 60fps
- [ ] Auto-dismiss after 2-3s works correctly
- [ ] Sound plays at appropriate volume

**Streaks:**
- [ ] Streak badges display correctly
- [ ] Fire emoji and text are readable

### Week 4: Settings & Mobile

**Settings Panel:**
- [ ] Panel slides in from right smoothly (60fps)
- [ ] All toggles and sliders are responsive
- [ ] Scrolling within panel is smooth
- [ ] Panel slides out on close

**Responsive:**
- [ ] Portrait mode works (if supported)
- [ ] Text is readable at all sizes
- [ ] No horizontal scrolling

### Week 5+: Smart Features & Performance

**Overall Performance:**
- [ ] No frame drops during normal use
- [ ] App feels as smooth as native Android apps
- [ ] Battery drain is acceptable (< 10%/hour active use)
- [ ] No memory leaks (use Chrome DevTools Memory profiler)

---

## Common Issues & Solutions

### Issue: Frame drops during animations

**Symptoms:** Stuttering, janky transitions, FPS < 60

**Diagnosis:**
1. Check Chrome DevTools Performance tab
2. Look for long tasks (> 50ms)
3. Check for forced reflows (layout thrashing)

**Solutions:**
- Use `transform` and `opacity` only (GPU-accelerated)
- Avoid animating `width`, `height`, `top`, `left`
- Add `will-change` to animated elements (sparingly)
- Reduce Framer Motion complexity
- Batch DOM updates

### Issue: Slow initial load

**Symptoms:** White screen > 1s on cold start

**Diagnosis:**
1. Use Lighthouse audit
2. Check bundle size (should be < 500KB gzipped)
3. Look for blocking resources

**Solutions:**
- Code splitting (lazy load routes)
- Optimize images (WebP, lazy loading)
- Minimize JavaScript bundle
- Font subsetting

### Issue: Checkboxes feel sluggish

**Symptoms:** Delay between tap and visual feedback

**Diagnosis:**
1. Check if Zustand update is synchronous
2. Verify no network call before UI update
3. Use Performance tab to measure tap → render time

**Solutions:**
- Ensure Zustand updates happen immediately
- Firestore writes should be queued (batched)
- Use `whileTap` on Framer Motion for instant feedback

### Issue: Memory leaks

**Symptoms:** App slows down over time, eventual crash

**Diagnosis:**
1. Chrome DevTools Memory tab
2. Take heap snapshot before and after interactions
3. Look for detached DOM nodes or listeners

**Solutions:**
- Clean up event listeners in `useEffect` return
- Unsubscribe from Firestore listeners (if any)
- Avoid storing large objects in Zustand

---

## Real-World Testing Scenarios

### Scenario 1: Morning Rush (High Activity)

**Simulate:**
1. Load dashboard
2. Check off 4 tasks rapidly (< 5s)
3. Navigate to calendar
4. Add new event
5. Navigate back to dashboard
6. Give kudos to 2 people
7. Trigger celebration animation

**Expected:**
- All interactions feel instant
- No frame drops
- Animations are smooth throughout
- Batched Firestore writes execute within 1s total

### Scenario 2: Idle to Screensaver

**Simulate:**
1. Load dashboard
2. Don't touch for 5 minutes
3. Screensaver activates
4. Let run for 30 minutes
5. Touch screen to wake

**Expected:**
- Screensaver activates exactly at 5min
- Photos transition smoothly every 10s
- No memory leaks after 30min
- Wake is instant (< 200ms)

### Scenario 3: Extended Use (Endurance)

**Simulate:**
1. Leave app running for 8 hours
2. Interact every 30 minutes (check task, view calendar)
3. Let screensaver run between interactions

**Expected:**
- Performance doesn't degrade
- No crashes
- Memory usage stays stable (< 500MB)
- Battery drain is acceptable

---

## Mounting & Display

### Wall Mount Setup

**Recommended Mount:**
- Adjustable arm for kitchen flexibility
- Cable management for power
- Landscape orientation
- Eye-level height (~48-60" from floor)

**Power:**
- Keep plugged in at all times
- Use "Stay awake" setting (Developer Options)

**Positioning:**
- Away from stove (heat damage)
- Away from sink (water damage)
- Good WiFi signal
- Natural light OK (not direct sunlight)

---

## Performance Tracking Log

**Date:** _TBD_  
**Build:** _TBD_  
**Tester:** Will

| Test | Target | Result | Notes |
|------|--------|--------|-------|
| Cold start | < 1s | | |
| Dashboard render | < 1s | | |
| Checkbox toggle | < 100ms | | |
| Page transition | < 300ms @ 60fps | | |
| Celebration | 60fps | | |
| Memory (8hr) | < 500MB | | |

_Update this table weekly as features are implemented._

---

**Document Version:** 1.0  
**Last Updated:** October 15, 2025  
**Hardware Status:** Not yet ordered (Week 1 priority)

