import { Link, useRouterState } from "@tanstack/react-router";
import { Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import logoUrl from "@/assets/odin-logo.svg";

const TABS = [
  { to: "/", label: "Consulta", icon: Search },
  { to: "/adicionar", label: "Adicionar", icon: Plus },
] as const;

export function Tabs() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      className="flex items-center gap-1 px-4 h-14 border-b"
      style={{
        borderColor: "var(--border)",
        background: "var(--bg-surface)",
      }}
      aria-label="Navegação principal"
    >
      <Link to="/" className="mr-6 flex items-center select-none" aria-label="ODIN">
        <img src={logoUrl} alt="ODIN" className="h-7 w-auto" />
      </Link>
      {TABS.map((t) => {
        const active = path === t.to;
        const Icon = t.icon;
        return (
          <Link
            key={t.to}
            to={t.to}
            className={cn(
              "relative inline-flex items-center gap-2 px-3 h-14 text-sm transition-colors",
            )}
            style={{
              color: active ? "var(--text-primary)" : "var(--text-secondary)",
            }}
          >
            <Icon size={14} />
            {t.label}
            {active && (
              <span
                className="absolute left-2 right-2 bottom-0 h-[2px] rounded-t transition-all"
                style={{ background: "var(--accent)" }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
