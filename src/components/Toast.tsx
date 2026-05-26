import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

type ToastKind = "success" | "warning" | "info";
type Toast = { id: number; kind: ToastKind; message: string };

type Ctx = {
  toast: (message: string, kind?: ToastKind) => void;
};

const ToastCtx = createContext<Ctx | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

let idSeq = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback(
    (id: number) => setToasts((t) => t.filter((x) => x.id !== id)),
    [],
  );

  const toast = useCallback(
    (message: string, kind: ToastKind = "success") => {
      const id = idSeq++;
      setToasts((t) => [...t, { id, kind, message }]);
      setTimeout(() => remove(id), 3200);
    },
    [remove],
  );

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    // ensure removal animation isn't blocked
  }, []);
  const Icon =
    toast.kind === "success"
      ? CheckCircle2
      : toast.kind === "warning"
        ? AlertTriangle
        : Info;
  const color =
    toast.kind === "success"
      ? "var(--success)"
      : toast.kind === "warning"
        ? "var(--warning)"
        : "var(--accent)";

  return (
    <div
      className="odin-anim-toast pointer-events-auto flex items-start gap-3 rounded-md border px-4 py-3 shadow-lg min-w-[280px] max-w-md"
      style={{
        background: "var(--bg-overlay)",
        borderColor: "var(--border)",
        color: "var(--text-primary)",
      }}
    >
      <Icon size={16} style={{ color, marginTop: 2, flexShrink: 0 }} />
      <div className="flex-1 text-sm">{toast.message}</div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="opacity-60 hover:opacity-100 transition-opacity"
      >
        <X size={14} />
      </button>
    </div>
  );
}
