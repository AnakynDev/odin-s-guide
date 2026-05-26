import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { Tabs } from "@/components/Tabs";
import { NewVehicleForm } from "@/components/forms/NewVehicleForm";
import { ExistingVehicleForm } from "@/components/forms/ExistingVehicleForm";

export const Route = createFileRoute("/adicionar")({
  component: Adicionar,
});

type Mode = "choose" | "new" | "existing";

function Adicionar() {
  const [mode, setMode] = useState<Mode>("choose");

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <Tabs />
      <main className="max-w-5xl mx-auto px-6 py-8">
        {mode !== "choose" && (
          <button
            type="button"
            onClick={() => setMode("choose")}
            className="inline-flex items-center gap-1.5 text-sm mb-4"
            style={{ color: "var(--text-secondary)" }}
          >
            <ArrowLeft size={14} />
            Voltar
          </button>
        )}

        {mode === "choose" && (
          <>
            <header className="mb-6">
              <h1
                className="text-[13px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: "var(--text-secondary)" }}
              >
                Adicionar à base
              </h1>
              <p
                className="mt-1 text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                Escolha o tipo de entrada.
              </p>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ChoiceCard
                icon={<Plus size={18} />}
                title="Novo veículo"
                description="Cadastrar montadora, modelo, ano e motor novos."
                onClick={() => setMode("new")}
              />
              <ChoiceCard
                icon={<Pencil size={18} />}
                title="Veículo existente"
                description="Adicionar funções a veículo já cadastrado."
                onClick={() => setMode("existing")}
              />
            </div>
          </>
        )}

        {mode === "new" && (
          <section
            className="rounded-lg border p-6"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border)",
            }}
          >
            <h2
              className="text-[13px] font-semibold uppercase tracking-[0.1em] mb-5"
              style={{ color: "var(--text-secondary)" }}
            >
              Novo veículo
            </h2>
            <NewVehicleForm
              onCancel={() => setMode("choose")}
              onDone={() => setMode("choose")}
            />
          </section>
        )}

        {mode === "existing" && (
          <section
            className="rounded-lg border p-6"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border)",
            }}
          >
            <h2
              className="text-[13px] font-semibold uppercase tracking-[0.1em] mb-5"
              style={{ color: "var(--text-secondary)" }}
            >
              Veículo existente
            </h2>
            <ExistingVehicleForm onDone={() => setMode("choose")} />
          </section>
        )}
      </main>
    </div>
  );
}

function ChoiceCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-lg border p-5 transition-colors hover:border-[var(--accent)]"
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border)",
      }}
    >
      <div
        className="inline-flex items-center justify-center h-9 w-9 rounded-md mb-3"
        style={{
          background: "var(--accent-subtle)",
          color: "var(--accent-hover)",
        }}
      >
        {icon}
      </div>
      <div
        className="text-base font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </div>
      <div
        className="text-sm mt-1"
        style={{ color: "var(--text-secondary)" }}
      >
        {description}
      </div>
    </button>
  );
}
