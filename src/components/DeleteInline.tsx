import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";

type Props = {
  onConfirm: () => void;
  label?: string;
};

export function DeleteInline({ onConfirm, label = "Remover" }: Props) {
  const [armed, setArmed] = useState(false);
  const yesRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (armed) yesRef.current?.focus();
  }, [armed]);

  if (!armed) {
    return (
      <button
        type="button"
        aria-label={label}
        onClick={() => setArmed(true)}
        className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-1 rounded"
        style={{ color: "var(--danger)" }}
      >
        <Trash2 size={14} />
      </button>
    );
  }

  return (
    <div
      className="flex items-center gap-2 text-xs"
      style={{ color: "var(--text-secondary)" }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setArmed(false);
      }}
    >
      <span>Confirmar remoção?</span>
      <button
        ref={yesRef}
        type="button"
        onClick={() => {
          onConfirm();
          setArmed(false);
        }}
        className="px-2 py-0.5 rounded text-xs font-medium"
        style={{
          background: "var(--danger)",
          color: "white",
        }}
      >
        Sim
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="px-2 py-0.5 rounded text-xs"
        style={{
          background: "var(--bg-elevated)",
          color: "var(--text-secondary)",
        }}
      >
        Não
      </button>
    </div>
  );
}
