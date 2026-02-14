import type { Stop } from "../../app/state/types";
import { haversineMeters } from "./haversine";

function totalDistance(stops: Stop[]) {
  let sum = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    sum += haversineMeters(stops[i].lngLat, stops[i + 1].lngLat);
  }
  return sum;
}

// Nearest Neighbor (keeps first stop as fixed start)
function nearestNeighborFixedStart(stops: Stop[]) {
  if (stops.length <= 2) return stops;

  const start = stops[0];
  const remaining = stops.slice(1);
  const route: Stop[] = [start];

  while (remaining.length) {
    const last = route[route.length - 1];
    let bestIdx = 0;
    let bestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const d = haversineMeters(last.lngLat, remaining[i].lngLat);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }

    route.push(remaining.splice(bestIdx, 1)[0]);
  }

  return route;
}

// 2-opt improvement (keeps first stop fixed)
function twoOptFixedStart(stops: Stop[], maxIterations = 250) {
  if (stops.length <= 3) return stops;

  let best = stops.slice();
  let bestDist = totalDistance(best);

  for (let iter = 0; iter < maxIterations; iter++) {
    let improved = false;

    // start index = 1 keeps first stop fixed
    for (let i = 1; i < best.length - 2; i++) {
      for (let k = i + 1; k < best.length - 1; k++) {
        const candidate = best.slice();
        const segment = candidate.slice(i, k + 1).reverse();
        candidate.splice(i, k - i + 1, ...segment);

        const d = totalDistance(candidate);
        if (d < bestDist) {
          best = candidate;
          bestDist = d;
          improved = true;
        }
      }
    }

    if (!improved) break;
  }

  return best;
}

export function optimizeStops(stops: Stop[]) {
  if (stops.length < 3) return stops;

  const nn = nearestNeighborFixedStart(stops);
  const opt = twoOptFixedStart(nn);

  return opt;
}

export function estimateDistanceMeters(stops: Stop[]) {
  return totalDistance(stops);
}
