export function debounce<T extends (...args: any[]) => void>(fn: T, waitMs: number) {
  let t: number | null = null;

  return (...args: Parameters<T>) => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), waitMs);
  };
}
