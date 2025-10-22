# Photo Widget Animation Fix

## Problem
The PhotoWidget was experiencing a "double-clutch" animation effect where:
1. Framer Motion was animating the container (scale, position, opacity)
2. PhotoWidget had its own internal CSS transition for opacity changes
3. These two animations were conflicting, causing a jerky, double-animation effect

## Root Cause
- PhotoWidget had internal `transition-opacity duration-500` CSS classes
- Dashboard was using `isTransitioning` prop to control internal opacity
- Framer Motion was simultaneously animating the same properties
- This created competing animations that didn't sync properly

## Solution
1. **Removed internal transitions from PhotoWidget**:
   - Removed `transition-opacity duration-500 ease-in-out` classes
   - Removed `isTransitioning` prop and related logic
   - Let Framer Motion handle all animations

2. **Updated Dashboard animation approach**:
   - Replaced `isPhotoTransitioning` state with `photoKey` counter
   - Used `key={photoKey}` on motion.div to trigger re-animation when photos change
   - Removed manual opacity control, let Framer Motion handle it

3. **Improved animation parameters**:
   - Reduced photoItem animation scale from 0.9 to 0.98 (more subtle)
   - Reduced y-offset from 40px to 20px (smoother entrance)
   - Increased stiffness from 300 to 400 (more responsive)
   - Reduced duration from 0.8s to 0.6s (snappier)

## Result
- PhotoWidget now animates smoothly with the rest of the dashboard
- No more "double-clutch" effect
- Photo transitions are handled entirely by Framer Motion
- Consistent animation timing across all dashboard elements
- Smoother, more professional feel

## Files Modified
1. `src/components/PhotoWidget.tsx` - Removed internal transitions
2. `src/features/dashboard/Dashboard.tsx` - Updated animation approach
