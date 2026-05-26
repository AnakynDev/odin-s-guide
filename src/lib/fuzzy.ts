import Fuse from "fuse.js";

export function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export type NormalizedItem = { original: string; normalized: string };

/** Build a fuse over a list of plain strings (montadora, modelo, motorização). */
export function buildStringFuse(values: string[]): {
  fuse: Fuse<NormalizedItem>;
  items: NormalizedItem[];
} {
  const items: NormalizedItem[] = Array.from(new Set(values)).map((v) => ({
    original: v,
    normalized: normalize(v),
  }));
  const fuse = new Fuse(items, {
    keys: ["normalized"],
    threshold: 0.4,
    distance: 100,
    minMatchCharLength: 1,
    includeScore: true,
    ignoreLocation: true,
  });
  return { fuse, items };
}

export function searchStrings(
  values: string[],
  query: string,
  limit = 8,
): string[] {
  if (!values.length) return [];
  const trimmed = query.trim();
  if (!trimmed) return values.slice(0, limit);
  const { fuse, items } = buildStringFuse(values);
  const q = normalize(trimmed);
  // Prefix match boost: items starting with the query first
  const direct = items
    .filter((i) => i.normalized.includes(q))
    .map((i) => i.original);
  const fuzzy = fuse.search(q).map((r) => r.item.original);
  const merged: string[] = [];
  const seen = new Set<string>();
  for (const v of [...direct, ...fuzzy]) {
    if (!seen.has(v)) {
      seen.add(v);
      merged.push(v);
      if (merged.length >= limit) break;
    }
  }
  return merged;
}

/* ---------- Global function search ---------- */

export type FunctionSearchItem = {
  code: string;
  description: string;
  normalizedCode: string;
  normalizedDescription: string;
  make: string;
  vehicleId: string;
  model: string;
  year: number;
  engine: string;
  category: string;
};

export function buildFunctionFuse(items: FunctionSearchItem[]) {
  return new Fuse(items, {
    keys: ["normalizedCode", "normalizedDescription"],
    threshold: 0.3,
    distance: 100,
    minMatchCharLength: 2,
    includeScore: true,
    ignoreLocation: true,
  });
}

/** Highlight matches of `query` within `text` (case/accent-insensitive). */
export function highlightSpans(
  text: string,
  query: string,
): { text: string; match: boolean }[] {
  const q = normalize(query).trim();
  if (!q) return [{ text, match: false }];
  const nText = normalize(text);
  const parts: { text: string; match: boolean }[] = [];
  let i = 0;
  while (i < text.length) {
    const idx = nText.indexOf(q, i);
    if (idx === -1) {
      parts.push({ text: text.slice(i), match: false });
      break;
    }
    if (idx > i) parts.push({ text: text.slice(i, idx), match: false });
    parts.push({ text: text.slice(idx, idx + q.length), match: true });
    i = idx + q.length;
  }
  return parts;
}
