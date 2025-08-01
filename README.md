# MealMood (React + Vite PWA)

Cute 14‑day meal budget tracker with banking and conversion rules:

- Per‑cycle goals: Vegan 10, Vegetarian 9, Small‑meat points 9
- Big meat costs **2** small‑meat points
- Bank leftovers at the end of a 14‑day cycle
- Conversion: **2 vegetarian → 1 vegan + 1 small‑meat point**
- Offline‑capable (basic service worker), installable as a PWA

## Quick start
```bash
npm create vite@latest mealmood -- --template react-ts
cd mealmood
# Replace the generated files with the contents of this zip (or copy src/, public/, etc.)
npm i
npm run dev
```

Or unzip and run directly:
```bash
npm i
npm run dev
```

## Notes
- The 14‑day cycle is computed from an **anchor date** (default: 2025‑01‑01 Europe/Paris). Change it via the ⚙️ Cycle button.
- Progress bars include your **bank** so you can see how much runway you have this cycle.
- “Add leftovers to bank” simulates closing a cycle today; you can do this on your exact end date.
- Data persists locally in your browser (localStorage).
```
