# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Dinner Roll" — a mobile-first PWA that picks a cuisine, then a restaurant, via a slot-machine-style "cycle and land" animation. User sets budget, distance, and party size, spins a cuisine wheel, then spins a restaurant wheel weighted toward that budget's price tier. Restaurant data is a static hardcoded list (no backend). GitHub repo name is `dinner-roll` (local folder is `dinner-randomizer`).

## Commands

```bash
npm run dev       # vite dev server
npm run build     # production build to dist/
npm run preview   # preview the production build
```

No linter, no test suite — this is a small hand-rolled Vite vanilla-JS project, not a framework scaffold.

## Architecture

**No framework, no build-time templating.** [src/main.js](src/main.js) is a single-file state machine: module-level `let` variables (`selectedBudget`, `selectedDistance`, `partySize`, `selectedCuisine`, `userLatitude`/`userLongitude`) hold all app state, and three `render*` functions (`renderHome`, `renderCuisineScreen`, `renderRestaurantScreen`) each fully replace `#app`'s `innerHTML` with a template string and re-attach event listeners. There's no diffing — every state change that needs a UI update calls the current screen's render function again from scratch.

**Restaurant data:** [src/restaurants.js](src/restaurants.js) exports a static `restaurants` array (name, cuisine, pricePerPerson, distance, optional `tier`). No API, no database — edits to the restaurant list mean editing this file directly.

**Selection logic:** cuisine is a uniform random pick from a hardcoded `cuisines` array in `main.js`. Restaurant selection is weighted: `spinRestaurant()` in `main.js` buckets restaurants into `casual`/`midrange`/`upscale` tiers (by `tier` field if present, else derived from `pricePerPerson`), computes a target tier from `budgetPerPerson = selectedBudget / partySize`, and weights each candidate by tier proximity to target × how close its price is to the budget ceiling. The visible "spin" (`showNextCuisine`/`showNextRestaurant`) is a pure animation — cycling through display names on a decaying interval — that always lands on the winner already chosen by the weighted pick, not a random walk.

**Recency + favorites, both `localStorage`-only, no backend:** `getRecentRestaurants`/`saveRecentRestaurant` keep the last 5 winners and exclude them from the next pool when possible (falls back to the full pool if excluding them would empty it). `getFavoriteRestaurants`/`toggleFavoriteRestaurant`/`isFavoriteRestaurant` back the heart button on the result card.

**Geolocation is wired up but not yet used in filtering.** `getUserLocation()` requests the browser's position on load and re-renders the home screen with the raw lat/lng shown for debugging; `userLatitude`/`userLongitude` aren't yet consumed by restaurant selection (distance filtering still uses the static `distance` field on each restaurant record).

**PWA shell:** [public/manifest.webmanifest](public/manifest.webmanifest) + [public/sw.js](public/sw.js) (registered at the bottom of `main.js`). The service worker is a simple network-first-with-cache-fallback for all GET requests, cache-busted by bumping `CACHE_NAME` (currently `dinner-roll-v2`) — bump that string whenever a deploy needs clients to drop stale cached assets.

## Known dead code

`src/counter.js` and the assets `src/assets/hero.png`, `src/assets/javascript.svg`, `src/assets/vite.svg` are unused leftovers from the original Vite template scaffold — not imported anywhere. `public/icons.svg`, `public/world-map.svg`, and the `earthTexture` Image preload in `main.js` are remnants of an abandoned 3D-globe UI (see git history: "Save 3D globe version") — `earthTexture` is created and given a `src` but never attached to the DOM or otherwise used. Safe to ignore or clean up; not wired into any current screen.
