## Smooth "New Section" → "+" Collapse Animation

### Problem
The FAB currently switches classes between `pl-4 pr-5 py-3.5` (pill) and `h-12 w-12` (circle) when `showFullButton` flips. Tailwind transitions can't animate `width: auto` → fixed width smoothly, and the label is mounted/unmounted abruptly, so it visually "jumps."

### Fix
Replace the conditional Tailwind sizing with a Framer Motion `motion.button` that animates width, and a `motion.span` for the label that animates `opacity`, `width`, and `marginLeft`. Slow the timing (~700–900ms) with an easing curve so it feels gentle.

### Changes (single file: `src/pages/Index.tsx`)

1. Import `motion` and `AnimatePresence` from `framer-motion` (already used in the file).
2. Replace the current `<button>` for "New Section" with a `motion.button` of fixed height (`h-12`) that animates between an expanded width (auto, pill padding) and collapsed width (`48px`, square).
3. Wrap the label in `<AnimatePresence>` with a `motion.span` animating:
   - `opacity: 1 → 0`
   - `width: auto → 0`
   - `marginLeft: 8px → 0`
   - Duration ~0.5s for label, ~0.7s for the button shape, easing `[0.22, 1, 0.36, 1]` (easeOutExpo-like) for a soft settle.
4. Keep the `+` icon static (no scale jump). Only the label and outer width animate.
5. Bump the auto-collapse timer slightly (e.g. 3500ms) so the user sees the full label longer before the smooth collapse begins.

### Technical sketch

```tsx
<motion.button
  onClick={() => newRoutine()}
  layout
  initial={false}
  animate={{ width: showFullButton ? "auto" : 48 }}
  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
  className="flex items-center h-12 rounded-full bg-foreground text-background shadow-elevated overflow-hidden px-3.5"
>
  <Plus size={18} strokeWidth={2.5} className="shrink-0" />
  <AnimatePresence initial={false}>
    {showFullButton && (
      <motion.span
        key="label"
        initial={{ opacity: 0, width: 0, marginLeft: 0 }}
        animate={{ opacity: 1, width: "auto", marginLeft: 8 }}
        exit={{ opacity: 0, width: 0, marginLeft: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-sm font-semibold whitespace-nowrap pr-1.5"
      >
        New Section
      </motion.span>
    )}
  </AnimatePresence>
</motion.button>
```

### Result
- No size jump: width interpolates continuously.
- Label gracefully fades and slides into the icon instead of disappearing.
- Slower, eased timing feels intentional rather than abrupt.
- No other components or behavior change.