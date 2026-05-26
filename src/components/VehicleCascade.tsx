import { Combobox } from "./Combobox";
import {
  getEnginesFor,
  getMakes,
  getModelsFor,
  getYearsFor,
  useVehicleStore,
} from "@/store/useVehicleStore";
import { isCtrl } from "@/lib/hotkeys";

export type CascadeValue = {
  make: string;
  model: string;
  year: string; // keep as string in UI, parsed on submit
  engine: string;
};

type Props = {
  value: CascadeValue;
  onChange: (v: CascadeValue) => void;
  onSubmit?: () => void;
  /** Show submit button + Enter behavior. */
  showSubmit?: boolean;
  /** Field labels (defaults: Montadora, Modelo, Ano, Motorização) */
  /** Submit button label */
  submitLabel?: string;
};

export const EMPTY: CascadeValue = { make: "", model: "", year: "", engine: "" };

export function VehicleCascade({
  value,
  onChange,
  onSubmit,
  showSubmit = true,
  submitLabel = "Buscar",
}: Props) {
  const data = useVehicleStore((s) => s.data);

  const makes = getMakes(data);
  const models = value.make ? getModelsFor(data, value.make) : [];
  const years = value.make && value.model ? getYearsFor(data, value.make, value.model) : [];
  const engines =
    value.make && value.model && value.year
      ? getEnginesFor(data, value.make, value.model, parseInt(value.year, 10))
      : [];

  const allFilled = !!(value.make && value.model && value.year && value.engine);

  const globalHotkey = (e: React.KeyboardEvent) => {
    if (isCtrl(e) && e.key === "Enter" && allFilled) {
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
          onChange={(v) =>
            onChange({ make: v, model: "", year: "", engine: "" })
          }
          onKeyDownCapture={globalHotkey}
          placeholder="Ford, Chevrolet, ..."
        />
        <Combobox
          label="Modelo"
          value={value.model}
          options={models}
          disabled={!value.make}
          onChange={(v) =>
            onChange({ ...value, model: v, year: "", engine: "" })
          }
          onKeyDownCapture={globalHotkey}
          placeholder={value.make ? "Modelo do veículo" : "Selecione a montadora"}
        />
        <Combobox
          label="Ano"
          value={value.year}
          options={years.map(String)}
          disabled={!value.model}
          numeric
          onChange={(v) => onChange({ ...value, year: v, engine: "" })}
          onKeyDownCapture={globalHotkey}
          placeholder={value.model ? "2023" : ""}
        />
        <Combobox
          label="Motorização"
          value={value.engine}
          options={engines}
          disabled={!value.year}
          onChange={(v) => onChange({ ...value, engine: v })}
          onSubmitCommit={() => {
            if (allFilled) onSubmit?.();
          }}
          onKeyDownCapture={globalHotkey}
          placeholder={value.year ? "1.0 EcoBoost" : ""}
        />
      </div>
      {showSubmit && (
        <div className="flex justify-end">
          <button
            type="button"
            disabled={!allFilled}
            onClick={onSubmit}
            className="h-10 px-5 rounded-md text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: allFilled ? "var(--accent)" : "var(--bg-elevated)",
              color: allFilled ? "white" : "var(--text-muted)",
            }}
          >
            {submitLabel}
          </button>
        </div>
      )}
    </div>
  );
}
