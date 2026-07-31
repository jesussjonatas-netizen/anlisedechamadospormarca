import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

/** Select múltiplo reutilizável no tema executivo claro. */
export function CxMultiSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const summary =
    value.length === 0 ? "Todos" : value.length === 1 ? value[0] : `${value.length} selecionados`;
  const list = q ? options.filter((o) => o.toLowerCase().includes(q.toLowerCase())) : options;

  return (
    <div className="relative">
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--cx-muted)]">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-[var(--cx-border)] bg-[var(--cx-card)] px-3 py-2 text-left text-sm text-[var(--cx-text)] hover:border-[var(--cx-blue)]"
      >
        <span className="truncate" title={summary}>
          {summary}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-1 w-full min-w-[200px] rounded-md border border-[var(--cx-border)] bg-[var(--cx-card)] shadow-xl">
            <div className="border-b border-[var(--cx-border)] p-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Pesquisar..."
                className="w-full rounded border border-[var(--cx-border)] px-2 py-1 text-xs outline-none focus:border-[var(--cx-blue)]"
              />
            </div>
            <div className="max-h-56 overflow-auto py-1">
              {list.length === 0 && (
                <div className="px-3 py-2 text-xs text-[var(--cx-muted)]">Sem opções</div>
              )}
              {list.map((opt) => {
                const active = value.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() =>
                      onChange(active ? value.filter((v) => v !== opt) : [...value, opt])
                    }
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-[var(--cx-bg)]"
                  >
                    <span
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded border"
                      style={{
                        borderColor: active ? "var(--cx-blue)" : "var(--cx-border)",
                        backgroundColor: active ? "var(--cx-blue)" : "transparent",
                      }}
                    >
                      {active && <Check className="h-3 w-3 text-white" />}
                    </span>
                    <span className="truncate" title={opt}>
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Card de KPI branco com borda colorida à esquerda. */
export function CxKpiCard({
  title,
  value,
  sub,
  color,
}: {
  title: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div
      className="rounded-lg border border-[var(--cx-border)] border-l-4 bg-[var(--cx-card)] p-4 shadow-sm"
      style={{ borderLeftColor: color || "var(--cx-blue)" }}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cx-muted)]">
        {title}
      </div>
      <div className="mt-2 text-2xl font-bold text-[var(--cx-text)]">{value}</div>
      {sub && <div className="mt-1 text-xs text-[var(--cx-muted)]">{sub}</div>}
    </div>
  );
}

/** Painel branco com cabeçalho azul. */
export function CxPanel({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-lg border border-[var(--cx-border)] bg-[var(--cx-card)] shadow-sm ${className ?? ""}`}
    >
      <header className="bg-[var(--cx-blue)] px-4 py-2 text-sm font-bold uppercase tracking-wider text-white">
        {title}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
