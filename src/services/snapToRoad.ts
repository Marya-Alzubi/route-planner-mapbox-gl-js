export type SnapResult = {
  lngLat: [number, number];
  label?: string;
};

export async function snapToNearestRoad(
  lng: number,
  lat: number
): Promise<SnapResult> {
  const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined;
  if (!token) throw new Error("Missing VITE_MAPBOX_ACCESS_TOKEN");

  // Reverse geocode the clicked point.
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
    `?types=address,poi,place&limit=1&access_token=${token}`;

//   console.log("[snapToNearestRoad] GET", url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Reverse geocoding failed: ${res.status}`);

  const data = await res.json();
  const f = data.features?.[0];

  // Fallback to original coords if response is unexpected
  if (!f?.center || f.center.length < 2) {
    return { lngLat: [lng, lat] };
  }

  return {
    lngLat: [Number(f.center[0]), Number(f.center[1])],
    label: typeof f.place_name === "string" ? f.place_name : undefined,
  };
}
