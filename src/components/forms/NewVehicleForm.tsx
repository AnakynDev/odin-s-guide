import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useToast } from "@/components/Toast";
import { useVehicleStore } from "@/store/useVehicleStore";
import { CATEGORY_PREFIXES, type Vehicle } from "@/types";
import { labelFor } from "@/lib/categories";
import { nextCode, slugify } from "@/lib/codes";
import {
  FunctionLineEditor,
  type DraftFunction,
} from "./FunctionLineEditor";

const CATEGORIES = ["actuation_test", "special_functions"] as const;

type Drafts = Record<string, DraftFunction[]>;

function makeUid() {
  return Math.random().toString(36).slice(2, 9);
}

function blankDraft(category: string, existing: string[]): DraftFunction {
  return {
    uid: makeUid(),
    code: nextCode(CATEGORY_PREFIXES[category] ?? "C", existing),
    description: "",
  };
}

type Props = { onCancel: () => void; onDone: () => void };

export function NewVehicleForm({ onCancel, onDone }: Props) {
  const { toast } = useToast();
  const addVehicle = useVehicleStore((s) => s.addVehicle);

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [engine, setEngine] = useState("");

  const [drafts, setDrafts] = useState<Drafts>(() => ({
    actuation_test: [blankDraft("actuation_test", [])],
    special_functions: [blankDraft("special_functions", [])],
  }));

  const [headerErrors, setHeaderErrors] = useState<Record<string, boolean>>({});

  const updateDraft = (cat: string, idx: number, next: DraftFunction) => {
    setDrafts((d) => {
      const list = [...d[cat]];
      list[idx] = next;
      return { ...d, [cat]: list };
    });
  };

  const removeDraft = (cat: string, idx: number) => {
    setDrafts((d) => ({ ...d, [cat]: d[cat].filter((_, i) => i !== idx) }));
  };

  const addRow = (cat: string) => {
    setDrafts((d) => {
      const existing = d[cat].map((x) => x.code).filter(Boolean);
      return { ...d, [cat]: [...d[cat], blankDraft(cat, existing)] };
    });
  };

  const totalNonEmpty = useMemo(
    () =>
      Object.values(drafts).reduce(
        (acc, list) =>
          acc + list.filter((d) => d.code && d.description).length,
        0,
      ),
    [drafts],
  );

  const save = () => {
    // Validate header
    const hErr: Record<string, boolean> = {
      make: !make.trim(),
      model: !model.trim(),
      year: !year.trim() || isNaN(parseInt(year, 10)),
      engine: !engine.trim(),
    };
    setHeaderErrors(hErr);
    let valid = !Object.values(hErr).some(Boolean);

    // Validate drafts: each row must have both fields if not empty; check duplicates per category
    const newDrafts: Drafts = {};
    for (const cat of Object.keys(drafts)) {
      const list = drafts[cat];
      const seen = new Map<string, number>();
      const annotated = list.map((d, i) => {
        let error: string | undefined;
        const hasAny = d.code || d.description;
        if (hasAny && (!d.code || !d.description)) {
          error = "Preencha código e descrição";
        }
        if (d.code) {
          const prev = seen.get(d.code);
          if (prev !== undefined) {
            error = "Código já existe neste veículo";
          } else {
            seen.set(d.code, i);
          }
        }
        if (error) valid = false;
        return { ...d, error };
      });
      newDrafts[cat] = annotated;
    }
    setDrafts(newDrafts);

    if (totalNonEmpty === 0) {
      toast(
        "Adicione ao menos uma função em uma das categorias.",
        "warning",
      );
      return;
    }
    if (!valid) {
      toast("Corrija os campos destacados.", "warning");
      return;
    }

    const y = parseInt(year, 10);
    const id = slugify(make, model, y, engine);
    const vehicle: Vehicle = {
      id,
      model: model.trim(),
      year: y,
      engine: engine.trim(),
    };
    for (const cat of Object.keys(newDrafts)) {
      const map: Record<string, { description: string; origin: "user" }> = {};
      for (const d of newDrafts[cat]) {
        if (d.code && d.description) {
          map[d.code] = { description: d.description.trim(), origin: "user" };
        }
      }
      if (Object.keys(map).length) vehicle[cat] = map;
    }

    addVehicle(make.trim(), vehicle);
    toast(`${make.trim()} ${model.trim()} ${y} · ${engine.trim()} adicionado com sucesso`);
    onDone();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Field
          label="Montadora *"
          value={make}
          onChange={setMake}
          error={headerErrors.make}
        />
        <Field
          label="Modelo *"
          value={model}
          onChange={setModel}
          error={headerErrors.model}
        />
        <Field
          label="Ano *"
          value={year}
          onChange={setYear}
          numeric
          error={headerErrors.year}
        />
        <Field
          label="Motorização *"
          value={engine}
          onChange={setEngine}
          error={headerErrors.engine}
        />
      </div>

      {CATEGORIES.map((cat) => (
        <section key={cat}>
          <div
            className="text-[12px] font-semibold uppercase tracking-[0.1em] mb-2"
            style={{ color: "var(--text-secondary)" }}
          >
            {labelFor(cat)}
          </div>
          <div className="space-y-2">
            {drafts[cat].map((d, i) => (
              <FunctionLineEditor
                key={d.uid}
                draft={d}
                onChange={(n) => updateDraft(cat, i, n)}
                onRemove={() => removeDraft(cat, i)}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => addRow(cat)}
            className="mt-2 inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border"
            style={{
              background: "var(--bg-elevated)",
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            <Plus size={12} />
            Adicionar {labelFor(cat).toLowerCase()}
          </button>
        </section>
      ))}

      <div
        className="flex items-center justify-end gap-2 pt-4 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <button
          type="button"
          onClick={onCancel}
          className="h-10 px-4 rounded-md text-sm"
          style={{
            background: "transparent",
            color: "var(--text-secondary)",
          }}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={save}
          className="h-10 px-5 rounded-md text-sm font-medium"
          style={{ background: "var(--accent)", color: "white" }}
        >
          Salvar veículo
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  numeric,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
  numeric?: boolean;
}) {
  return (
    <div>
      <label
        className="block text-[12px] font-medium mb-1.5 uppercase tracking-wider"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </label>
      <input
        type="text"
        inputMode={numeric ? "numeric" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-md border text-sm outline-none"
        style={{
          background: "var(--bg-elevated)",
          borderColor: error ? "var(--danger)" : "var(--border)",
          color: "var(--text-primary)",
        }}
      />
    </div>
  );
}
