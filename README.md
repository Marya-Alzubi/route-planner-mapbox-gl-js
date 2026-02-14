# Route Planning Tool (Frontend)

A React + TypeScript route-planning app using Mapbox GL JS. Users can add/reorder up to 25 stops, fetch a driving route, optimize stop order on the client, and simulate a vehicle moving along the route with completed vs remaining segments.

<img width="1512" height="982" alt="Screenshot 2026-02-14 at 12 41 46" src="https://github.com/user-attachments/assets/b75ee5cf-3e75-4d94-a10c-64e3b2dcde72" />


### Demo link: https://drive.google.com/file/d/1CFuzFuQup3TUyUTD94kWobQWA0DZtqxd/view?usp=sharing
---
## Run Locally

### 1) Prerequisites
- Node.js (recommended: latest LTS)
- npm (comes with Node)

### 2) Install dependencies
```bash
yarn install
```
### 3) Create environment file
Create a file named .env.local in the project root (same level as package.json).
```
VITE_MAPBOX_ACCESS_TOKEN=pk.XXXXXXXXXXXXXXXXXXXXXXXX
VITE_OFFLINE_MODE=false
```
### 4) Start the dev server
```
yarn dev
```
Open the URL shown in the terminal (usually http://localhost:5173).

----

## Architecture (High-level)

### UI + State
- **React (Vite) + TypeScript**
- Global state is managed via a **typed reducer** (`src/app/state/reducer.ts`) and dispatched actions (add/update/remove/reorder/clear, simulation play/pause/reset, etc.).
- The UI is split into:
  - **Sidebar**: stop search, list management, optimization preview, simulation controls, export.
  - **MapCanvas**: map rendering, stop markers, route polylines, arrows, vehicle marker.

### Map Rendering (Mapbox GL JS)
- The map is initialized once, then updated incrementally using Mapbox **sources + layers**:
  - **Stops**: Mapbox `Marker`s (draggable) synced from `stops[]`.
  - **Route**: GeoJSON sources that get updated when the route or simulation changes.
  - **Direction arrows**: a symbol layer placed along the remaining route only.

### Services Layer (External APIs + Offline fallback)
- **Mapbox Directions API**: fetches driving route geometry (LineString), distance, and duration.
- **Mapbox Geocoding API**: autocomplete suggestions for searching stops.
- **Snap-to-road**: when adding from map click, clicks are snapped to the nearest road (with a safe fallback to raw click coords).
- **Offline mode** (`VITE_OFFLINE_MODE=true`): uses an alternative raster style (OSM tiles) and mock/fallback logic where applicable.

---

## Key Features & Data Flow

### 1) Stop Management
- Stops are stored as `{ id, label, lngLat, source }`.
- Add stop:
  - From **search** (geocoding suggestion).
  - From **map click** (snap-to-road; fallback if snapping fails).
- Update stop position:
  - Dragging a map marker dispatches `stop/updateCoords`.
- Reorder:
  - Sidebar uses **@dnd-kit** to reorder and dispatches `stops/reorder`.
- Delete / Clear:
  - Individual remove dispatches `stop/remove`.
  - Clear all dispatches `stops/clear`.

### 2) Route Fetching & Display
- When stops change (>=2), the app requests a driving route from **Mapbox Directions**.
- The returned route is stored as:
  - `geometry` (GeoJSON LineString)
  - `distanceM`, `durationS`
- The map renders:
  - A **dashed “remaining”** route (todo)
  - A **solid “completed”** route (done)
  - **Arrows** on the remaining route for direction

### 3) Optimization (Frontend)
Optimization runs fully on the client and is designed to remain fast under 25 stops.

**Distance metric**
- Uses a fast **Haversine** approximation (straight-line distance) to estimate route length for optimization and “before vs after” comparison.

**Algorithm**
1. **Nearest Neighbor (NN) initial solution**
   - Start from the first stop, repeatedly pick the closest unvisited stop.
   - Complexity: ~O(n²)

2. **2-opt improvement**
   - Iteratively attempts to improve the tour by reversing segments `(i..k)` when it reduces total distance.
   - Stops when no improving swap is found or a practical iteration limit is hit.
   - Typical performance is good for n ≤ 25.
   - Worst-case theoretical complexity is higher, but bounded in practice by small n and early exits.

**UX**
- Shows a preview:
  - original estimated distance
  - optimized estimated distance
  - improvement percentage
- User can **Apply** or **Cancel** the optimized order.

### 4) Route Simulation (Visualization-only)
Simulation animates a vehicle icon along the route geometry with take into considration:
   - Position along the route
   - Heading / rotation
   - Completed vs remaining segments

---

## Export
- Exports a JSON file containing:
  - Stops list (order + coordinates)
  - Route geometry (LineString)
  - Distance and duration metadata

---

## Notes / Trade-offs
- ```VITE_MAPBOX_ACCESS_TOKEN``` must be a valid token even when ```VITE_OFFLINE_MODE=false```.
- During optimization, the first stop is fixed. The function then searches for the fastest route between the remaining stops and reorders them accordingly.
- Optimization uses Haversine distance (fast) instead of road-network distance (slow) to meet the < 2s performance requirement.
- Simulation is purely visual and does not model real-world driving constraints (e.g., speed limits, traffic, turn delays).
- Mapbox services require an access token for live Directions/Geocoding. Offline mode is intended as a UI/dev fallback.

---

## Tech Stack
- React + TypeScript (Vite)
- Mapbox GL JS
- Mapbox Directions + Geocoding APIs
- @dnd-kit for drag-and-drop stop reordering

  

