import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { Tabs } from "@/components/Tabs";
import { VehicleCascade, EMPTY, type CascadeValue } from "@/components/VehicleCascade";
import { GlobalCodeSearch } from "@/components/GlobalCodeSearch";
import { SearchHistory } from "@/components/SearchHistory";
import { VehicleResult } from "@/components/VehicleResult";
import { findVehicle, useVehicleStore } from "@/store/useVehicleStore";
import type { Vehicle } from "@/types";

export const Route = createFileRoute("/")({
  component: Consulta,
});

type Match = { make: string; vehicle: Vehicle; highlightCode?: string };
type SearchResult =
  | { state: "idle" }
  | { state: "not_found"; query: CascadeValue }
  | { state: "found"; matches: Match[] };

function filterVehicles(
  data: Record<string, Vehicle[]>,
  q: CascadeValue,
): Match[] {
  const out: Match[] = [];
  for (const [make, list] of Object.entries(data)) {
    if (q.make && make !== q.make) continue;
    for (const v of list) {
      if (q.model && v.model !== q.model) continue;
      if (q.year && String(v.year) !== q.year) continue;
      if (q.engine && v.engine !== q.engine) continue;
      out.push({ make, vehicle: v });
    }
  }
  // Stable order: make, model, year desc, engine
  out.sort((a, b) => {
    if (a.make !== b.make) return a.make.localeCompare(b.make);
    if (a.vehicle.model !== b.vehicle.model)
      return a.vehicle.model.localeCompare(b.vehicle.model);
    if (a.vehicle.year !== b.vehicle.year) return b.vehicle.year - a.vehicle.year;
    return a.vehicle.engine.localeCompare(b.vehicle.engine);
  });
  return out;
}

function Consulta() {
  const data = useVehicleStore((s) => s.data);
  const addToHistory = useVehicleStore((s) => s.addToHistory);

  const [fields, setFields] = useState<CascadeValue>(EMPTY);
  const [result, setResult] = useState<SearchResult>({ state: "idle" });

  const runSearch = (override?: CascadeValue) => {
    const f = override ?? fields;
    const anyFilled = !!(f.make || f.model || f.year || f.engine);
    if (!anyFilled) return;
    const matches = filterVehicles(data, f);
    if (matches.length === 0) {
      setResult({ state: "not_found", query: f });
      return;
    }
    // Add to history only when result is uniquely identified (all 4 set)
    if (f.make && f.model && f.year && f.engine) {
      addToHistory({
        make: f.make,
        model: f.model,
        year: parseInt(f.year, 10),
        engine: f.engine,
      });
    }
    setResult({ state: "found", matches });
  };

  const handleClear = () => {
    setFields(EMPTY);
    setResult({ state: "idle" });
  };

  const handlePickHistory = (entry: {
    make: string;
    model: string;
    year: number;
    engine: string;
  }) => {
    const cv: CascadeValue = {
      make: entry.make,
      model: entry.model,
      year: String(entry.year),
      engine: entry.engine,
    };
    setFields(cv);
    runSearch(cv);
  };

  const handlePickGlobalResult = (r: {
    make: string;
    model: string;
    year: number;
    engine: string;
    code: string;
  }) => {
    const cv: CascadeValue = {
      make: r.make,
      model: r.model,
      year: String(r.year),
      engine: r.engine,
    };
    setFields(cv);
    const v = findVehicle(data, r.make, r.model, r.year, r.engine);
    if (v) {
      addToHistory({
        make: r.make,
        model: r.model,
        year: r.year,
        engine: r.engine,
      });
      setResult({
        state: "found",
        matches: [{ make: r.make, vehicle: v, highlightCode: r.code }],
      });
      setTimeout(() => {
        document
          .getElementById(`fn-${r.code}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    }
  };

  // Re-derive matches from store so deletions update live.
  const liveMatches: Match[] | null = useMemo(() => {
    if (result.state !== "found") return null;
    return result.matches
      .map((m) => {
        const v = data[m.make]?.find((x) => x.id === m.vehicle.id);
        return v ? { ...m, vehicle: v } : null;
      })
      .filter((m): m is Match => m !== null);
  }, [result, data]);

  useEffect(() => {
    if (result.state === "found" && liveMatches && liveMatches.length === 0) {
      setResult({ state: "idle" });
    }
  }, [result, liveMatches]);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <Tabs />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <header className="mb-6">
          <h1
            className="text-[13px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: "var(--text-secondary)" }}
          >
            Consulta de cobertura
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Pesquise por montadora, modelo, ano ou motor — em qualquer combinação.
          </p>
        </header>

        <section
          className="rounded-lg border p-5"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border)",
          }}
        >
          <VehicleCascade
            value={fields}
            onChange={setFields}
            onSubmit={() => runSearch()}
            onClear={handleClear}
          />
          <GlobalCodeSearch onPick={handlePickGlobalResult} />
        </section>

        <SearchHistory onPick={handlePickHistory} />

        {result.state === "idle" && (
          <div
            className="mt-10 flex items-center gap-3 text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            <Info size={16} />
            Preencha ao menos um campo para ver a cobertura.
          </div>
        )}

        {result.state === "not_found" && (
          <div
            className="odin-anim-fade mt-6 rounded-md border p-4 flex gap-3"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--warning)",
            }}
          >
            <AlertTriangle
              size={18}
              style={{ color: "var(--warning)", flexShrink: 0, marginTop: 2 }}
            />
            <div className="text-sm">
              <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                Nenhum veículo corresponde aos filtros.
              </div>
              <div className="mt-1" style={{ color: "var(--text-secondary)" }}>
                {[result.query.make, result.query.model, result.query.year, result.query.engine]
                  .filter(Boolean)
                  .join(" · ")}{" "}
                não retornou resultados. Ajuste os filtros ou use a aba{" "}
                <span style={{ color: "var(--accent)" }}>+ Adicionar</span>.
              </div>
            </div>
          </div>
        )}

        {result.state === "found" && liveMatches && liveMatches.length > 0 && (
          <>
            <div
              className="mt-6 text-[12px] font-medium uppercase tracking-wider"
              style={{ color: "var(--text-secondary)" }}
            >
              {liveMatches.length} {liveMatches.length === 1 ? "veículo" : "veículos"} encontrados
            </div>
            <div className="space-y-8 mt-2">
              {liveMatches.map((m) => (
                <VehicleResult
                  key={`${m.make}-${m.vehicle.id}`}
                  make={m.make}
                  vehicle={m.vehicle}
                  highlightCode={m.highlightCode}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
