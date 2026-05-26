import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useToast } from "@/components/Toast";
import { findVehicle, useVehicleStore } from "@/store/useVehicleStore";
import { CATEGORY_PREFIXES } from "@/types";
import { colorFor, getCategoryKeys, getCategoryMap, labelFor } from "@/lib/categories";
import { nextCode } from "@/lib/codes";
import { DeleteInline } from "@/components/DeleteInline";
import {
  VehicleCascade,
  EMPTY,
  type CascadeValue,
} from "@/components/VehicleCascade";
import {
  FunctionLineEditor,
  type DraftFunction,
} from "./FunctionLineEditor";

const CATEGORIES = ["actuation_test", "special_functions"] as const;

type Drafts = Record<string, DraftFunction[]>;

function makeUid() {
  return Math.random().toString(36).slice(2, 9);
}

type Props = { onDone: () => void };

export function ExistingVehicleForm({ onDone }: Props) {
  const { toast } = useToast();
  const data = useVehicleStore((s) => s.data);
  const addFunction = useVehicleStore((s) => s.addFunction);
  const deleteFunction = useVehicleStore((s) => s.deleteFunction);

  const [fields, setFields] = useState<CascadeValue>(EMPTY);
  const [drafts, setDrafts] = useState<Drafts>({
    actuation_test: [],
    special_functions: [],
  });

  const vehicle = useMemo(() => {
    if (!fields.make || !fields.model || !fields.year || !fields.engine) return undefined;
    const y = parseInt(fields.year, 10);
    if (isNaN(y)) return undefined;
    return findVehicle(data, fields.make, fields.model, y, fields.engine);
  }, [data, fields]);

  const existingCodes = (cat: string): string[] => {
    if (!vehicle) return [];
    return Object.keys(getCategoryMap(vehicle, cat));
  };

  const updateDraft = (cat: string, idx: number, next: DraftFunction) => {
    setDrafts((d) => {
      const list = [...(d[cat] ?? [])];
      list[idx] = next;
      return { ...d, [cat]: list };
    });
  };

  const removeDraft = (cat: string, idx: number) => {
    setDrafts((d) => ({
      ...d,
      [cat]: (d[cat] ?? []).filter((_, i) => i !== idx),
    }));
  };

  const addRow = (cat: string) => {
    setDrafts((d) => {
      const existing = [
        ...existingCodes(cat),
        ...(d[cat] ?? []).map((x) => x.code).filter(Boolean),
      ];
      const draft: DraftFunction = {
        uid: makeUid(),
        code: nextCode(CATEGORY_PREFIXES[cat] ?? "C", existing),
        description: "",
      };
      return { ...d, [cat]: [...(d[cat] ?? []), draft] };
    });
  };

  const totalNew = useMemo(
    () =>
      Object.values(drafts).reduce(
        (a, l) => a + l.filter((d) => d.code && d.description).length,
        0,
      ),
    [drafts],
  );

  const save = () => {
    if (!vehicle) return;
    let valid = true;
    const newDrafts: Drafts = {};
    for (const cat of Object.keys(drafts)) {
      const list = drafts[cat] ?? [];
      const existing = new Set(existingCodes(cat));
      const seen = new Map<string, number>();
      newDrafts[cat] = list.map((d, i) => {
        let error: string | undefined;
        const hasAny = d.code || d.description;
        if (hasAny && (!d.code || !d.description))
          error = "Preencha código e descrição";
        if (d.code && existing.has(d.code))
          error = "Código já existe neste veículo";
        if (d.code && seen.has(d.code))
          error = "Código já existe neste veículo";
        if (d.code) seen.set(d.code, i);
        if (error) valid = false;
        return { ...d, error };
      });
    }
    setDrafts(newDrafts);

    if (totalNew === 0) {
      toast("Adicione ao menos uma nova função.", "warning");
      return;
    }
    if (!valid) {
      toast("Corrija os campos destacados.", "warning");
      return;
    }

    let count = 0;
    for (const cat of Object.keys(newDrafts)) {
      for (const d of newDrafts[cat]) {
        if (d.code && d.description) {
          addFunction(fields.make, vehicle.id, cat, d.code, {
            description: d.description.trim(),
            origin: "user",
          });
          count++;
        }
      }
    }
    toast(
      `${count} ${count === 1 ? "função adicionada" : "funções adicionadas"} ao ${fields.make} ${vehicle.model} ${vehicle.year} · ${vehicle.engine}`,
    );
    setDrafts({ actuation_test: [], special_functions: [] });
    onDone();
  };

  return (
    <div className="space-y-6">
      <VehicleCascade
        value={fields}
        onChange={(v) => {
          setFields(v);
          setDrafts({ actuation_test: [], special_functions: [] });
        }}
        showSubmit={false}
      />

      {!vehicle && fields.make && fields.model && fields.year && fields.engine && (
        <div
          className="text-sm rounded-md border p-4"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--warning)",
            color: "var(--text-secondary)",
          }}
        >
          Esse veículo não existe na base. Use "+ Novo veículo" para cadastrá-lo.
        </div>
      )}

      {vehicle && (
        <div
          className="rounded-lg border p-5 odin-anim-fade"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border)",
          }}
        >
          <div className="flex flex-wrap items-baseline gap-x-3 mb-4">
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {fields.make} {vehicle.model}
            </h2>
            <span style={{ color: "var(--text-muted)" }}>·</span>
            <span style={{ color: "var(--text-secondary)" }}>{vehicle.year}</span>
            <span style={{ color: "var(--text-muted)" }}>·</span>
            <span style={{ color: "var(--text-secondary)" }}>{vehicle.engine}</span>
          </div>

          {getCategoryKeys(vehicle)
            .concat(
              CATEGORIES.filter((c) => !getCategoryKeys(vehicle).includes(c)),
            )
            .map((cat) => {
              const map = getCategoryMap(vehicle, cat);
              const codes = Object.keys(map).sort();
              return (
                <section key={cat} className="mb-6 last:mb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: colorFor(cat) }}
                    />
                    <div
                      className="text-[12px] font-semibold uppercase tracking-[0.1em]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {labelFor(cat)}{" "}
                      <span style={{ color: "var(--text-muted)" }}>
                        ({codes.length} existentes)
                      </span>
                    </div>
                  </div>

                  <ul className="mb-2">
                    {codes.map((code) => {
                      const e = map[code];
                      return (
                        <li
                          key={code}
                          className="group flex items-center gap-3 py-1.5"
                        >
                          <code
                            className="font-mono text-xs w-16 shrink-0"
                            style={{ color: "var(--accent-hover)" }}
                          >
                            {code}
                          </code>
                          <span
                            className="text-[13px] flex-1"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {e.description}
                          </span>
                          <span
                            className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                            style={{
                              background:
                                e.origin === "user"
                                  ? "var(--accent-subtle)"
                                  : "transparent",
                              color:
                                e.origin === "user"
                                  ? "var(--accent-hover)"
                                  : "var(--text-muted)",
                            }}
                          >
                            {e.origin === "user" ? "usuário" : "original"}
                          </span>
                          {e.origin === "user" && (
                            <DeleteInline
                              onConfirm={() => {
                                deleteFunction(
                                  fields.make,
                                  vehicle.id,
                                  cat,
                                  code,
                                );
                                toast(`${code} removido`);
                              }}
                            />
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  <div
                    className="my-2 border-t border-dashed"
                    style={{ borderColor: "var(--border)" }}
                  />

                  <div className="space-y-2">
                    {(drafts[cat] ?? []).map((d, i) => (
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
              );
            })}

          <div
            className="flex items-center justify-end gap-2 pt-4 border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <button
              type="button"
              onClick={save}
              className="h-10 px-5 rounded-md text-sm font-medium"
              style={{ background: "var(--accent)", color: "white" }}
            >
              Salvar alterações
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
