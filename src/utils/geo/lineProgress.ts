type LngLat = [number, number];

function dist(a: LngLat, b: LngLat) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}

// Returns point at progress t (0..1) along a LineString coordinates array
export function pointAtT(coords: LngLat[], t: number): LngLat | null {
  if (!coords || coords.length < 2) return null;

  const clamped = Math.min(1, Math.max(0, t));

  const segLens: number[] = [];
  let total = 0;

  for (let i = 0; i < coords.length - 1; i++) {
    const d = dist(coords[i], coords[i + 1]);
    segLens.push(d);
    total += d;
  }

  if (total === 0) return coords[0];

  const target = total * clamped;
  let acc = 0;

  for (let i = 0; i < segLens.length; i++) {
    const seg = segLens[i];
    if (acc + seg >= target) {
      const local = (target - acc) / seg;
      const a = coords[i];
      const b = coords[i + 1];
      return [a[0] + (b[0] - a[0]) * local, a[1] + (b[1] - a[1]) * local];
    }
    acc += seg;
  }

  return coords[coords.length - 1];
}
