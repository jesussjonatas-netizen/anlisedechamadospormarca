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

/** Card de KPI branco com borda colorida à esquerda, ícone opcional e clique para filtrar. */
export function CxKpiCard({
  title,
  value,
  sub,
  color,
  icon,
  onClick,
  active,
}: {
  title: string;
  value: string;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cx-muted)]">
          {title}
        </div>
        {icon && <span className="shrink-0">{icon}</span>}
      </div>
      <div className="mt-2 text-2xl font-bold text-[var(--cx-text)]">{value}</div>
      {sub && <div className="mt-1 text-xs text-[var(--cx-muted)]">{sub}</div>}
    </>
  );

  const base =
    "rounded-xl border border-[var(--cx-border)] border-l-4 bg-[var(--cx-card)] p-4 text-left shadow-sm transition-shadow";
  const style = {
    borderLeftColor: color || "var(--cx-blue)",
    boxShadow: active ? `0 0 0 2px ${color || "var(--cx-blue)"}` : undefined,
  };

  if (!onClick) {
    return (
      <div className={base} style={style}>
        {content}
      </div>
    );
  }
  return (
    <button type="button" onClick={onClick} className={`${base} w-full hover:shadow-md`} style={style}>
      {content}
    </button>
  );
}

/** Painel branco com cabeçalho azul e área opcional de ações (busca, toggles). */
export function CxPanel({
  title,
  children,
  className,
  actions,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-[var(--cx-border)] bg-[var(--cx-card)] shadow-sm ${className ?? ""}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 bg-[var(--cx-blue)] px-4 py-2 text-sm font-bold uppercase tracking-wider text-white">
        <span>{title}</span>
        {actions && <span className="flex items-center gap-2 normal-case">{actions}</span>}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

/** Campo de busca livre compacto para uso dentro de painéis. */
export function CxSearch({
  value,
  onChange,
  placeholder = "Pesquisar...",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className ?? "w-48"}`}>
      <SearchIcon className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--cx-muted)]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-[var(--cx-border)] bg-[var(--cx-card)] py-1.5 pl-7 pr-2 text-xs font-normal tracking-normal text-[var(--cx-text)] outline-none focus:border-[var(--cx-green)]"
      />
    </div>
  );
}

/** Seleção rápida em grade (múltipla), usada para Ano e Mês. */
export function CxQuickSelect({
  label,
  options,
  value,
  onChange,
  cols = 3,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  cols?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--cx-muted)]">
        {label}
      </label>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
        {options.map((opt) => {
          const active = value.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(active ? value.filter((v) => v !== opt) : [...value, opt])}
              className="rounded-md border px-2 py-1 text-xs font-medium transition-colors"
              style={{
                borderColor: active ? "var(--cx-blue)" : "var(--cx-border)",
                backgroundColor: active ? "var(--cx-blue)" : "var(--cx-card)",
                color: active ? "#fff" : "var(--cx-text)",
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

