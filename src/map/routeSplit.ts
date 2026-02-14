import mapboxgl from "mapbox-gl";

export function splitLineAtT(
  coords: [number, number][],
  t: number
): { done: [number, number][]; remain: [number, number][] } {
  if (coords.length < 2) return { done: coords, remain: [] };

  const clamped = Math.max(0, Math.min(1, t));
  if (clamped <= 0) return { done: [coords[0]], remain: coords };
  if (clamped >= 1) return { done: coords, remain: [coords[coords.length - 1]] };

  let total = 0;
  const segLens: number[] = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const a = new mapboxgl.LngLat(coords[i][0], coords[i][1]);
    const b = new mapboxgl.LngLat(coords[i + 1][0], coords[i + 1][1]);
    const d = a.distanceTo(b);
    segLens.push(d);
    total += d;
  }

  const target = total * clamped;

  let acc = 0;
  for (let i = 0; i < segLens.length; i++) {
    const seg = segLens[i];
    if (acc + seg >= target) {
      const ratio = seg === 0 ? 0 : (target - acc) / seg;

      const [ax, ay] = coords[i];
      const [bx, by] = coords[i + 1];

      const cut: [number, number] = [ax + (bx - ax) * ratio, ay + (by - ay) * ratio];

      const done = coords.slice(0, i + 1);
      const last = done[done.length - 1];
      if (!last || last[0] !== cut[0] || last[1] !== cut[1]) done.push(cut);

      const remain = [cut, ...coords.slice(i + 1)];
      return { done, remain };
    }
    acc += seg;
  }

  return { done: coords, remain: [coords[coords.length - 1]] };
}
