## Goal
Reduce the free routine limit from 5 to 3 and enforce it at every entry point where a user can create a new routine, with a clear Pro upgrade prompt when blocked.

## Current State
- `src/pages/Index.tsx` already has a `FREE_ROUTINE_LIMIT = 5` constant and a check in `newRoutine()` that toasts + navigates to `/settings/pro`.
- However, `handleAddTemplate()` in Index.tsx, `Templates.tsx`, `Settings.tsx` template add, and `RoutineDetail.tsx` auto-create/save all call `addRoutine()` directly and bypass the limit check.

## Changes

### 1. Centralise limit constant
Move `FREE_ROUTINE_LIMIT = 3` and a `canAddRoutine()` helper into `src/lib/pro.ts` so every consumer imports the same value.

### 2. Make `addRoutine` return `string | null`
In `src/hooks/useRoutines.ts`, update `addRoutine` so it:
- counts active (non-archived) routines using `stateRef.current`
- returns the new routine `id` on success
- returns `null` when the free limit is hit (and user is not Pro)

This gives every caller an explicit signal that the creation was blocked.

### 3. Update all callers to handle the limit
Each call site will check the return value. When `null`:
- Show a toast: "Free tier limit reached — Free includes up to 3 routines. Upgrade to Pro for unlimited."
- Navigate to `/settings/pro`

**Files to update:**
- `src/pages/Index.tsx` — change limit constant to 3; add check inside `handleAddTemplate()`
- `src/pages/Templates.tsx` — check `addRoutine` return before showing success haptic
- `src/pages/Settings.tsx` — check `addRoutine` return inside `handleAddTemplate()`
- `src/pages/RoutineDetail.tsx` — check return on auto-create (first title entry) and on manual save

## Technical notes
- Toast and `navigate` imports are already present in `Index.tsx` and `RoutineDetail.tsx`; they will need to be added in `Templates.tsx` and `Settings.tsx`.
- The `+` FAB on the home page continues to use the existing `newRoutine()` guard, which will simply be updated to the new limit of 3.
- No backend changes are required; the limit is client-side only.