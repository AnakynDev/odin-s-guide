import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Vehicle } from "@/types";
import { colorFor, getCategoryKeys, getCategoryMap, labelFor } from "@/lib/categories";
import { useVehicleStore } from "@/store/useVehicleStore";
import { DeleteInline } from "./DeleteInline";
import { useToast } from "./Toast";

type Props = {
  make: string;
  vehicle: Vehicle;
  /** code to scroll/highlight (from global function search). */
  highlightCode?: string;
};

export function VehicleResult({ make, vehicle, highlightCode }: Props) {
  const categories = getCategoryKeys(vehicle);
  return (
    <div className="odin-anim-result mt-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2
          className="text-xl font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {make} {vehicle.model}
        </h2>
        <span style={{ color: "var(--text-muted)" }}>·</span>
        <span className="text-base" style={{ color: "var(--text-secondary)" }}>
          {vehicle.year}
        </span>
        <span style={{ color: "var(--text-muted)" }}>·</span>
        <span className="text-base" style={{ color: "var(--text-secondary)" }}>
          {vehicle.engine}
        </span>
      </div>
      <div
        className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm"
        style={{ color: "var(--text-secondary)" }}
      >
        {categories.map((c) => {
          const count = Object.keys(getCategoryMap(vehicle, c)).length;
          return (
            <span key={c}>
              {count} {labelFor(c).toLowerCase()}
            </span>
          );
        })}
      </div>
      <div
        className="my-4 h-px"
        style={{ background: "var(--border)" }}
      />
      <div className="space-y-4">
        {categories.map((cat) => (
          <CategorySection
            key={cat}
            make={make}
            vehicle={vehicle}
            category={cat}
            highlightCode={highlightCode}
          />
        ))}
      </div>
    </div>
  );
}

function CategorySection({
  make,
  vehicle,
  category,
  highlightCode,
}: {
  make: string;
  vehicle: Vehicle;
  category: string;
  highlightCode?: string;
}) {
  const [open, setOpen] = useState(true);
  const map = getCategoryMap(vehicle, category);
  const codes = Object.keys(map).sort();
  const color = colorFor(category);
  const deleteFn = useVehicleStore((s) => s.deleteFunction);
  const { toast } = useToast();

  useEffect(() => {
    if (highlightCode && map[highlightCode]) setOpen(true);
  }, [highlightCode, map]);

  return (
    <section
      className="rounded-md border overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border)",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3"
        aria-expanded={open}
      >
        <ChevronDown
          size={14}
          style={{
            color: "var(--text-secondary)",
            transform: open ? "rotate(0)" : "rotate(-90deg)",
            transition: "transform 180ms ease",
          }}
        />
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: color }}
        />
        <span
          className="text-[12px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: "var(--text-primary)" }}
        >
          {labelFor(category)}
        </span>
        <span
          className="text-xs ml-1"
          style={{ color: "var(--text-muted)" }}
        >
          ({codes.length})
        </span>
      </button>
      {open && (
        <ul
          className="border-t"
          style={{ borderColor: "var(--border)" }}
        >
          {codes.length === 0 && (
            <li
              className="px-4 py-3 text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              Nenhuma função cadastrada.
            </li>
          )}
          {codes.map((code) => {
            const entry = map[code];
            const hl = highlightCode === code;
            return (
              <li
                key={code}
                id={hl ? `fn-${code}` : undefined}
                className="group flex items-center gap-4 px-4 py-2 border-t first:border-t-0 transition-colors"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: hl ? "var(--accent-subtle)" : "transparent",
                }}
              >
                <code
                  className="font-mono text-xs font-medium w-16 shrink-0"
                  style={{ color: "var(--accent-hover)" }}
                >
                  {code}
                </code>
                <span
                  className="text-[13px] flex-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  {entry.description}
                </span>
                <span
                  className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{
                    background:
                      entry.origin === "user"
                        ? "var(--accent-subtle)"
                        : "transparent",
                    color:
                      entry.origin === "user"
                        ? "var(--accent-hover)"
                        : "var(--text-muted)",
                  }}
                >
                  {entry.origin === "user" ? "usuário" : "original"}
                </span>
                {entry.origin === "user" && (
                  <DeleteInline
                    onConfirm={() => {
                      deleteFn(make, vehicle.id, category, code);
                      toast(`${code} removido`, "success");
                    }}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
