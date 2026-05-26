import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { searchStrings } from "@/lib/fuzzy";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  disabled?: boolean;
  placeholder?: string;
  /** Called when user presses Enter without picking a suggestion (after value commit). */
  onSubmitCommit?: () => void;
  /** Allow arbitrary value (not in options). Defaults true. */
  freeSolo?: boolean;
  /** Force input mode='numeric' for the Year field. */
  numeric?: boolean;
  /** Optional className for the wrapper. */
  className?: string;
  /** Hotkey handler: called with the key event for global shortcuts (e.g. Ctrl+Enter). */
  onKeyDownCapture?: (e: React.KeyboardEvent) => void;
};

export function Combobox({
  label,
  value,
  onChange,
  options,
  disabled,
  placeholder,
  onSubmitCommit,
  freeSolo = true,
  numeric,
  className,
  onKeyDownCapture,
}: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();

  // keep draft in sync when value changes externally
  useEffect(() => {
    setDraft(value);
  }, [value]);

  const suggestions = useMemo(
    () => searchStrings(options, draft, 8),
    [options, draft],
  );

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // keep active item in view
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const commit = (val: string) => {
    onChange(val);
    setDraft(val);
    setOpen(false);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDownCapture?.(e);
    if (e.defaultPrevented) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) =>
        Math.min(a + 1, Math.max(0, suggestions.length - 1)),
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
    } else if (e.key === "Enter") {
      if (open && suggestions[active]) {
        e.preventDefault();
        commit(suggestions[active]);
        return;
      }
      // commit free-solo draft and trigger submit
      if (freeSolo && draft !== value) {
        onChange(draft);
      }
      onSubmitCommit?.();
    }
  };

  return (
    <div ref={wrapRef} className={cn("relative w-full", className)}>
      <label
        className="block text-[12px] font-medium mb-1.5 uppercase tracking-wider"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          inputMode={numeric ? "numeric" : "text"}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          disabled={disabled}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => {
            setDraft(e.target.value);
            setActive(0);
            setOpen(true);
            if (freeSolo) onChange(e.target.value);
          }}
          onFocus={() => !disabled && setOpen(true)}
          onKeyDown={handleKey}
          className={cn(
            "w-full h-10 px-3 pr-8 rounded-md text-sm transition-colors",
            "border outline-none",
            disabled ? "cursor-not-allowed opacity-50" : "",
          )}
          style={{
            background: "var(--bg-elevated)",
            color: "var(--text-primary)",
            borderColor: "var(--border)",
          }}
        />
        <ChevronDown
          size={14}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "var(--text-muted)" }}
        />
      </div>
      {open && !disabled && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          className="odin-anim-dropdown absolute z-30 mt-1 w-full rounded-md border shadow-xl overflow-auto max-h-[280px]"
          style={{
            background: "var(--bg-overlay)",
            borderColor: "var(--border)",
          }}
        >
          {suggestions.length === 0 ? (
            <li
              className="px-3 py-2.5 text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              Nenhuma opção encontrada
            </li>
          ) : (
            suggestions.map((s, i) => (
              <li
                key={s}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault(); // keep focus on input
                  commit(s);
                }}
                className="px-3 py-2 text-sm cursor-pointer transition-colors"
                style={{
                  background:
                    i === active ? "var(--accent-subtle)" : "transparent",
                  color: "var(--text-primary)",
                }}
              >
                {s}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
