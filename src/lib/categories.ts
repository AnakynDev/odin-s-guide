import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CATEGORY_PREFIXES,
  VEHICLE_META_KEYS,
  type CategoryMap,
  type Vehicle,
} from "@/types";

const META = new Set<string>(VEHICLE_META_KEYS as readonly string[]);

export function getCategoryKeys(vehicle: Vehicle): string[] {
  return Object.keys(vehicle).filter((k) => !META.has(k));
}

export function getCategoryMap(vehicle: Vehicle, key: string): CategoryMap {
  return (vehicle[key] as CategoryMap) ?? {};
}

export function labelFor(key: string): string {
  if (CATEGORY_LABELS[key]) return CATEGORY_LABELS[key];
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Stable hash -> hue for unknown categories
function hashHue(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 360;
}

export function colorFor(key: string): string {
  if (CATEGORY_COLORS[key]) return CATEGORY_COLORS[key];
  return `hsl(${hashHue(key)} 70% 60%)`;
}

export function prefixFor(key: string): string {
  if (CATEGORY_PREFIXES[key]) return CATEGORY_PREFIXES[key];
  // Use first letter of each word, upper
  const initials = key
    .split("_")
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return initials || "C";
}
