import { X, Clock } from "lucide-react";
import { useVehicleStore } from "@/store/useVehicleStore";

type Props = {
  onPick: (entry: {
    make: string;
    model: string;
    year: number;
    engine: string;
  }) => void;
};

export function SearchHistory({ onPick }: Props) {
  const history = useVehicleStore((s) => s.searchHistory);
  const remove = useVehicleStore((s) => s.removeFromHistory);
  const clear = useVehicleStore((s) => s.clearHistory);

  if (history.length === 0) return null;

  return (
    <div className="mt-6">
      <div
        className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wider mb-2"
        style={{ color: "var(--text-secondary)" }}
      >
        <Clock size={12} />
        Buscas recentes
      </div>
      <ul className="flex flex-wrap gap-2">
        {history.map((h, i) => (
          <li
            key={`${h.make}-${h.model}-${h.year}-${h.engine}`}
            className="group inline-flex items-center gap-2 rounded-md border pl-3 pr-1 py-1 text-sm transition-colors hover:border-[var(--accent)]"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <button
              type="button"
              onClick={() => onPick(h)}
              className="text-left"
            >
              {h.make} {h.model} {h.year}{" "}
              <span style={{ color: "var(--text-muted)" }}>·</span>{" "}
              <span style={{ color: "var(--text-secondary)" }}>{h.engine}</span>
            </button>
            <button
              type="button"
              aria-label="Remover do histórico"
              onClick={() => remove(i)}
              className="p-1 rounded opacity-50 hover:opacity-100"
              style={{ color: "var(--text-muted)" }}
            >
              <X size={12} />
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={clear}
            className="px-2 py-1 text-xs underline-offset-2 hover:underline"
            style={{ color: "var(--text-muted)" }}
          >
            Limpar histórico
          </button>
        </li>
      </ul>
    </div>
  );
}
