import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type DraftFunction = {
  uid: string;
  code: string;
  description: string;
  /** Set when validation runs */
  error?: string;
};

type Props = {
  draft: DraftFunction;
  onChange: (next: DraftFunction) => void;
  onRemove: () => void;
};

export function FunctionLineEditor({ draft, onChange, onRemove }: Props) {
  const codeErr = draft.error?.includes("código") || draft.error?.includes("existe");
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-start gap-2">
        <div className="w-28 shrink-0">
          <input
            type="text"
            value={draft.code}
            onChange={(e) =>
              onChange({ ...draft, code: e.target.value.toUpperCase().trim(), error: undefined })
            }
            placeholder="T001"
            aria-label="Código"
            className={cn(
              "w-full h-9 px-2.5 rounded-md border text-sm font-mono outline-none",
            )}
            style={{
              background: "var(--bg-elevated)",
              borderColor: codeErr ? "var(--danger)" : "var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </div>
        <input
          type="text"
          value={draft.description}
          onChange={(e) =>
            onChange({ ...draft, description: e.target.value, error: undefined })
          }
          placeholder="Descrição da função"
          aria-label="Descrição"
          className="flex-1 h-9 px-3 rounded-md border text-sm outline-none"
          style={{
            background: "var(--bg-elevated)",
            borderColor:
              draft.error && !codeErr ? "var(--danger)" : "var(--border)",
            color: "var(--text-primary)",
          }}
        />
        <button
          type="button"
          aria-label="Remover linha"
          onClick={onRemove}
          className="h-9 w-9 inline-flex items-center justify-center rounded-md transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <X size={14} />
        </button>
      </div>
      {draft.error && (
        <div
          className="text-xs ml-1"
          style={{ color: "var(--danger)" }}
        >
          {draft.error}
        </div>
      )}
    </div>
  );
}
