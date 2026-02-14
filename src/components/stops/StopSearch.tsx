// File: src/components/stops/StopSearch.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchGeocodeSuggestionsWithFallback,
  type GeocodeSuggestion,
} from "../../services/mapboxGeocoding";

type Props = {
  onSelect: (s: GeocodeSuggestion) => void;
  disabled?: boolean;
};

export default function StopSearch({ onSelect, disabled }: Props) {
  const [value, setValue] = useState("");
  const [items, setItems] = useState<GeocodeSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<number | null>(null);

  const trimmed = value.trim();
  const canSearch = useMemo(() => trimmed.length >= 3, [trimmed]);
  const isTooShort = trimmed.length > 0 && trimmed.length < 3;

  useEffect(() => {
    setError(null);

    // If disabled, keep things closed/clean
    if (disabled) {
      setItems([]);
      setIsOpen(false);
      return;
    }

    // Validation: < 3 chars => clear results
    if (!canSearch) {
      setItems([]);
      setIsOpen(false);
      return;
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(async () => {
      try {
        setIsLoading(true);

        const results = await fetchGeocodeSuggestionsWithFallback(value, 6);

        setItems(results);
        setIsOpen(true);
      } catch (e: any) {
        setError(e?.message ?? "Failed to search");
        setItems([]);
        setIsOpen(true);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [value, canSearch, disabled]);

  function pick(item: GeocodeSuggestion) {
    onSelect(item);
    setValue("");
    setItems([]);
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        Search & add stop
      </label>

      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={disabled ? "Max stops reached (25)" : "Search address or place..."}
        disabled={disabled}
        className={[
          "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 disabled:bg-gray-100",
          isTooShort ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500",
        ].join(" ")}
      />

      <div className="mt-2 min-h-[18px] text-xs">
        {isTooShort && <span className="text-red-600">Type at least 3 characters…</span>}
        {!isTooShort && isLoading && <span className="text-gray-500">Searching…</span>}
        {!isTooShort && !isLoading && error && <span className="text-red-600">{error}</span>}
      </div>

      {isOpen && (items.length > 0 || error) && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white shadow">
          {items.length === 0 && !isLoading && (
            <div className="px-3 py-2 text-sm text-gray-600">No results</div>
          )}

          <ul className="max-h-64 overflow-auto py-1">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => pick(item)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  {item.place_name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
