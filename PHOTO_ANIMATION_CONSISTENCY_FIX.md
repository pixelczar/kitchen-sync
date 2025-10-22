# Photo Widget Animation Consistency Fix

## Problem
The photo tile wrapper was animating differently from other dashboard cards:
- Different speed and easing compared to other tiles
- When photos changed, the entire tile wrapper would re-animate (move, scale, shift)
- Inconsistent animation behavior with the rest of the dashboard

## Root Cause
- Photo tile was using a custom `photoItem` animation variant with different parameters
- The `key={photoKey}` on the motion.div was causing the entire wrapper to re-animate when photos changed
- This created inconsistent timing and behavior compared to other dashboard cards

## Solution

### 1. **Consistent Wrapper Animation**
- Removed the custom `photoItem` variant
- Changed photo tile to use the standard `item` variant (same as other cards)
- Removed `key={photoKey}` from the motion.div wrapper
- Now the photo tile animates in exactly like other dashboard cards

### 2. **Internal Photo Transitions**
- Added `photoKey` prop to PhotoWidget
- Used `key={photoKey}` on the internal `<img>` element only
- Added smooth `transition-opacity duration-500 ease-in-out` to the image
- Photo content changes now only fade the image, without affecting the wrapper

### 3. **Animation Behavior**
- **Initial Load**: Photo tile animates in with same speed/easing as other cards
- **Photo Changes**: Only the image content fades smoothly, wrapper stays stable
- **No Movement**: Tile wrapper never moves, scales, or shifts during photo transitions

## Result
- ✅ Photo tile wrapper animates in exactly like other dashboard cards
- ✅ Photo transitions are smooth fades that don't affect the wrapper
- ✅ Consistent timing and easing across all dashboard elements
- ✅ No unwanted movement or shifting during photo changes
- ✅ Professional, polished animation behavior

## Files Modified
1. `src/features/dashboard/Dashboard.tsx` - Removed custom photoItem variant, used standard item variant
2. `src/components/PhotoWidget.tsx` - Added photoKey prop and internal image transitions
