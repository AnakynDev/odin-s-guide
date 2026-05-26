import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { Tabs } from "@/components/Tabs";
import { VehicleCascade, EMPTY, type CascadeValue } from "@/components/VehicleCascade";
import { GlobalCodeSearch } from "@/components/GlobalCodeSearch";
import { SearchHistory } from "@/components/SearchHistory";
import { VehicleResult } from "@/components/VehicleResult";
import { findVehicle, useVehicleStore } from "@/store/useVehicleStore";

export const Route = createFileRoute("/")({
  component: Consulta,
});

type SearchResult =
  | { state: "idle" }
  | { state: "not_found"; query: CascadeValue }
  | { state: "found"; make: string; vehicleId: string; highlightCode?: string };

function Consulta() {
  const data = useVehicleStore((s) => s.data);
  const addToHistory = useVehicleStore((s) => s.addToHistory);

  const [fields, setFields] = useState<CascadeValue>(EMPTY);
  const [result, setResult] = useState<SearchResult>({ state: "idle" });

  const runSearch = (override?: CascadeValue) => {
    const f = override ?? fields;
    if (!f.make || !f.model || !f.year || !f.engine) return;
    const year = parseInt(f.year, 10);
    if (isNaN(year)) return;
    const v = findVehicle(data, f.make, f.model, year, f.engine);
    if (!v) {
      setResult({ state: "not_found", query: f });
      return;
    }
    addToHistory({
      make: f.make,
      model: f.model,
      year,
      engine: f.engine,
    });
    setResult({ state: "found", make: f.make, vehicleId: v.id });
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
        make: r.make,
        vehicleId: v.id,
        highlightCode: r.code,
      });
      // scroll
      setTimeout(() => {
        document
          .getElementById(`fn-${r.code}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    }
  };

  // Recompute current vehicle reference from store (for live deletions)
  const currentVehicle = useMemo(() => {
    if (result.state !== "found") return undefined;
    return data[result.make]?.find((v) => v.id === result.vehicleId);
  }, [result, data]);

  // If vehicle disappeared (rare), reset
  useEffect(() => {
    if (result.state === "found" && !currentVehicle) {
      setResult({ state: "idle" });
    }
  }, [result, currentVehicle]);

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
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Selecione montadora, modelo, ano e motorização para ver as funções
            suportadas.
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
            Selecione o veículo para ver a cobertura de funções.
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
              <div
                className="font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                Este veículo não consta na cobertura atual.
              </div>
              <div
                className="mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                {result.query.make} {result.query.model} {result.query.year} ·{" "}
                {result.query.engine} não foi encontrado na base de dados. Para
                adicionar, use a aba{" "}
                <span style={{ color: "var(--accent-hover)" }}>
                  + Adicionar
                </span>
                .
              </div>
            </div>
          </div>
        )}

        {result.state === "found" && currentVehicle && (
          <VehicleResult
            make={result.make}
            vehicle={currentVehicle}
            highlightCode={result.highlightCode}
          />
        )}
      </main>
    </div>
  );
}
