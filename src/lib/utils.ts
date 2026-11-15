export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/** Normalise a rootMargin value for IntersectionObserver.
 *
 * Accepts a string like "0px 0px -40px 0px", a number (treated as px), or
 * unitless/unknown values. Each part is coerced to px or %; unknown units
 * (e.g. vh, em, rem) fall back to px. Returns "0px" for anything that can't
 * be parsed. Always returns 1-4 space-separated values ending in px or %,
 * which is what the IntersectionObserver constructor requires.
 */
export function normaliseRootMargin(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return "0px";

  const raw = typeof value === "number" ? `${value}px` : String(value);
  const parts = raw.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0 || parts.length > 4) return "0px";

  const normalised = parts.map((part) => {
    // Already has a valid unit (px or %).
    if (/^-?\d+(?:\.\d+)?(px|%)$/.test(part)) return part;

    // Bare number → px.
    if (/^-?\d+(?:\.\d+)?$/.test(part)) return `${part}px`;

    // Has a number but unknown/invalid unit (e.g. vh, em, rem) → coerce to px.
    const m = part.match(/^-?\d+(?:\.\d+)?/);
    if (m) return `${m[0]}px`;

    return "0px";
  });

  return normalised.join(" ");
}
