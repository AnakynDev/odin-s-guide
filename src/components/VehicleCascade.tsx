import { Combobox } from "./Combobox";
import { useVehicleStore } from "@/store/useVehicleStore";
import { isCtrl } from "@/lib/hotkeys";
import { useMemo } from "react";

export type CascadeValue = {
  make: string;
  model: string;
  year: string;
  engine: string;
};

type Props = {
  value: CascadeValue;
  onChange: (v: CascadeValue) => void;
  onSubmit?: () => void;
  onClear?: () => void;
  showSubmit?: boolean;
  submitLabel?: string;
  /** If true, requires all fields filled to enable submit (used by Add forms). */
  requireAll?: boolean;
};

export const EMPTY: CascadeValue = { make: "", model: "", year: "", engine: "" };

export function VehicleCascade({
  value,
  onChange,
  onSubmit,
  onClear,
  showSubmit = true,
  submitLabel = "Buscar",
  requireAll = false,
}: Props) {
  const data = useVehicleStore((s) => s.data);

  // Independent options: each field shows all unique values across the
  // dataset, narrowed only by OTHER fields already filled (so picking
  // a model still shows compatible makes/years/engines, but no field
  // is ever disabled).
  const { makes, models, years, engines } = useMemo(() => {
    const flat: Array<{ make: string; model: string; year: number; engine: string }> = [];
    for (const [make, list] of Object.entries(data)) {
      for (const v of list) {
        flat.push({ make, model: v.model, year: v.year, engine: v.engine });
      }
    }
    const matches = (
      row: { make: string; model: string; year: number; engine: string },
      skip: keyof CascadeValue,
    ) => {
      if (skip !== "make" && value.make && row.make !== value.make) return false;
      if (skip !== "model" && value.model && row.model !== value.model) return false;
      if (skip !== "year" && value.year && String(row.year) !== value.year) return false;
      if (skip !== "engine" && value.engine && row.engine !== value.engine) return false;
      return true;
    };
    return {
      makes: Array.from(new Set(flat.filter((r) => matches(r, "make")).map((r) => r.make))).sort(),
      models: Array.from(new Set(flat.filter((r) => matches(r, "model")).map((r) => r.model))).sort(),
      years: Array.from(new Set(flat.filter((r) => matches(r, "year")).map((r) => r.year)))
        .sort((a, b) => b - a)
        .map(String),
      engines: Array.from(new Set(flat.filter((r) => matches(r, "engine")).map((r) => r.engine))).sort(),
    };
  }, [data, value.make, value.model, value.year, value.engine]);

  const anyFilled = !!(value.make || value.model || value.year || value.engine);
  const allFilled = !!(value.make && value.model && value.year && value.engine);
  const canSubmit = requireAll ? allFilled : anyFilled;

  const globalHotkey = (e: React.KeyboardEvent) => {
    if (isCtrl(e) && e.key === "Enter" && canSubmit) {
      e.preventDefault();
      onSubmit?.();
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Combobox
          label="Montadora"
          value={value.make}
          options={makes}
          onChange={(v) => onChange({ ...value, make: v })}
          onKeyDownCapture={globalHotkey}
          placeholder="Ford, Chevrolet, ..."
        />
        <Combobox
          label="Modelo"
          value={value.model}
          options={models}
          onChange={(v) => onChange({ ...value, model: v })}
          onKeyDownCapture={globalHotkey}
          placeholder="Qualquer modelo"
        />
        <Combobox
          label="Ano"
          value={value.year}
          options={years}
          numeric
          onChange={(v) => onChange({ ...value, year: v })}
          onKeyDownCapture={globalHotkey}
          placeholder="Qualquer ano"
        />
        <Combobox
          label="Motorização"
          value={value.engine}
          options={engines}
          onChange={(v) => onChange({ ...value, engine: v })}
          onSubmitCommit={() => {
            if (canSubmit) onSubmit?.();
          }}
          onKeyDownCapture={globalHotkey}
          placeholder="Qualquer motor"
        />
      </div>
      {showSubmit && (
        <div className="flex justify-end gap-2">
          {anyFilled && onClear && (
            <button
              type="button"
              onClick={onClear}
              className="h-10 px-4 rounded-md text-sm font-medium transition-colors border"
              style={{
                background: "transparent",
                color: "var(--text-secondary)",
                borderColor: "var(--border)",
              }}
            >
              Limpar
            </button>
          )}
          <button
            type="button"
            disabled={!canSubmit}
            onClick={onSubmit}
            className="h-10 px-5 rounded-md text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: canSubmit ? "var(--accent)" : "var(--bg-surface)",
              color: canSubmit ? "white" : "var(--text-muted)",
              border: canSubmit ? "none" : "1px solid var(--border)",
            }}
          >
            {submitLabel}
          </button>
        </div>
      )}
    </div>
  );
}
