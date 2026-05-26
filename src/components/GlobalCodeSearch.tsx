import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import {
  buildFunctionFuse,
  highlightSpans,
  normalize,
  type FunctionSearchItem,
} from "@/lib/fuzzy";
import { getAllFunctionEntries, useVehicleStore } from "@/store/useVehicleStore";

type ResultRow = FunctionSearchItem;

type Props = {
  onPick: (r: ResultRow) => void;
};

export function GlobalCodeSearch({ onPick }: Props) {
  const data = useVehicleStore((s) => s.data);
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setDebounced(q), 300);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [q]);

  const items: ResultRow[] = useMemo(() => {
    return getAllFunctionEntries(data).map(({ make, vehicle, category, code, entry }) => ({
      code,
      description: entry.description,
      normalizedCode: normalize(code),
      normalizedDescription: normalize(entry.description),
      make,
      vehicleId: vehicle.id,
      model: vehicle.model,
      year: vehicle.year,
      engine: vehicle.engine,
      category,
    }));
  }, [data]);

  const results = useMemo(() => {
    const trimmed = debounced.trim();
    if (!trimmed) return [];
    const fuse = buildFunctionFuse(items);
    return fuse
      .search(normalize(trimmed))
      .slice(0, 20)
      .map((r) => r.item);
  }, [items, debounced]);

  return (
    <div className="mt-4">
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--text-muted)" }}
        />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por código ou descrição em toda a base..."
          className="w-full h-10 pl-9 pr-3 rounded-md border text-sm outline-none"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
        />
      </div>
      {q.trim() && (
        <div
          className="mt-3 rounded-md border overflow-hidden odin-anim-fade"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border)",
          }}
        >
          {results.length === 0 ? (
            <div
              className="px-4 py-6 text-sm text-center"
              style={{ color: "var(--text-muted)" }}
            >
              Nenhum código ou descrição corresponde a "{q}".
            </div>
          ) : (
            <ul>
              {results.map((r) => (
                <li
                  key={`${r.vehicleId}-${r.category}-${r.code}`}
                  className="border-t first:border-t-0"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <button
                    type="button"
                    onClick={() => onPick(r)}
                    className="w-full text-left px-4 py-3 transition-colors hover:bg-[var(--bg-elevated)]"
                  >
                    <div className="flex items-baseline gap-3">
                      <code
                        className="font-mono text-xs font-medium"
                        style={{ color: "var(--accent-hover)" }}
                      >
                        {renderHighlight(r.code, debounced)}
                      </code>
                      <span
                        className="text-[13px] flex-1"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {renderHighlight(r.description, debounced)}
                      </span>
                    </div>
                    <div
                      className="mt-1 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {r.make} {r.model} · {r.year} · {r.engine}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function renderHighlight(text: string, query: string) {
  const parts = highlightSpans(text, query);
  return parts.map((p, i) =>
    p.match ? (
      <mark
        key={i}
        style={{
          background: "var(--accent-subtle)",
          color: "var(--accent-hover)",
          padding: "0 2px",
          borderRadius: 2,
        }}
      >
        {p.text}
      </mark>
    ) : (
      <span key={i}>{p.text}</span>
    ),
  );
}
