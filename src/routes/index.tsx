import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import {
  Download,
  RefreshCw,
  Upload,
  LayoutDashboard,
  ListChecks,
  Filter as FilterIcon,
  ChevronDown,
  Calendar,
  Check,
} from "lucide-react";
import { useAuditoriaData, setRows } from "@/lib/auditoria-store";
import {
  STATUS_LIST,
  STATUS_COLORS,
  type Solicitacao,
  type StatusKey,
} from "@/lib/auditoria-types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Auditoria de Devoluções | Rede ANCORA" },
      {
        name: "description",
        content:
          "Dashboard interno de auditoria de devoluções da Rede ANCORA com KPIs, filtros e detalhamento de chamados.",
      },
      { property: "og:title", content: "Auditoria de Devoluções | Rede ANCORA" },
      {
        property: "og:description",
        content: "Painel de auditoria de devoluções da Rede ANCORA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

// ---- helpers ----
const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
const fmtInt = (v: number) => v.toLocaleString("pt-BR");
const pct = (n: number, d: number) => (d === 0 ? "0%" : `${((n / d) * 100).toFixed(1)}%`);

type FilterState = {
  ano: string;
  cd: string[];
  regiao: string[];
  modalidade: string[];
  tipo: string[];
  status: string[];
  cliente: string[];
  causa: string[];
  dataDe: string;
  dataAte: string;
};

const emptyFilters: FilterState = {
  ano: "Todos",
  cd: [],
  regiao: [],
  modalidade: [],
  tipo: [],
  status: [],
  cliente: [],
  causa: [],
  dataDe: "",
  dataAte: "",
};

function normStatus(v: string | null | undefined): StatusKey {
  if (!v) return "Aguardando Auditoria";
  const s = v.trim().toLowerCase();
  if (s === "") return "Aguardando Auditoria";
  if (s === "pago") return "Pago";
  if (s === "reprovado") return "Reprovado";
  if (s === "aprovado") return "Aprovado";
  if (s.startsWith("aguardando aud")) return "Aguardando Auditoria";
  if (s.startsWith("aguardando")) return "Aguardando pagamento";
  if (s.startsWith("revis")) return "Revisão necessária";
  return "Aguardando Auditoria";
}

function cdLabel(cd: string | null, cdFull?: string | null): string {
  const full = (cdFull || cd || "").toUpperCase();
  if (full.includes("DISTRITO FEDERAL")) return "DF";
  if (full.includes("ANANINDEUA")) return "PA";
  return cd || "-";
}


function uniq<T>(arr: (T | null | undefined)[]): T[] {
  const s = new Set<T>();
  for (const v of arr) if (v !== null && v !== undefined && v !== "") s.add(v as T);
  return Array.from(s).sort((a, b) => String(a).localeCompare(String(b)));
}

function applyFilters(rows: Solicitacao[], f: FilterState, skip?: keyof FilterState) {
  return rows.filter((r) => {
    if (skip !== "ano" && f.ano !== "Todos" && String(r.Ano) !== f.ano) return false;
    if (skip !== "cd" && f.cd.length && !f.cd.includes(r.CD || "")) return false;
    if (skip !== "regiao" && f.regiao.length && !f.regiao.includes(r["Região"] || "")) return false;
    if (skip !== "modalidade" && f.modalidade.length && !f.modalidade.includes(r.Modalidade || ""))
      return false;
    if (skip !== "tipo" && f.tipo.length && !f.tipo.includes(r.Tipo || "")) return false;
    if (skip !== "status" && f.status.length) {
      const s = normStatus(r["Status Auditoria"]);
      if (!f.status.includes(s)) return false;
    }
    if (skip !== "cliente" && f.cliente.length && !f.cliente.includes(r.Cliente || "")) return false;
    if (skip !== "causa" && f.causa.length && !f.causa.includes(r["Causa Raiz"] || "")) return false;

    if (skip !== "dataDe" && f.dataDe) {
      if (!r.Data || r.Data.slice(0, 10) < f.dataDe) return false;
    }
    if (skip !== "dataAte" && f.dataAte) {
      if (!r.Data || r.Data.slice(0, 10) > f.dataAte) return false;
    }
    return true;
  });
}

// ---- components ----
function MultiSelect({
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
  const summary =
    value.length === 0 ? "Todos" : value.length === 1 ? value[0] : `${value.length} selecionados`;
  return (
    <div className="relative">
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-md border border-border bg-input px-3 py-2 text-left text-sm text-foreground hover:border-brand"
      >
        <span className="truncate">{summary}</span>
        <ChevronDown className="h-4 w-4 opacity-70" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border border-border bg-popover shadow-xl">
            {options.length === 0 && (
              <div className="p-2 text-xs text-muted-foreground">Sem opções</div>
            )}
            {options.map((opt) => {
              const active = value.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(active ? value.filter((v) => v !== opt) : [...value, opt]);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-secondary"
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded border ${active ? "border-brand bg-brand" : "border-border"}`}
                  >
                    {active && <Check className="h-3 w-3 text-white" />}
                  </span>
                  <span className="truncate">{opt}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({
  title,
  value,
  sub,
  color,
  active,
  onClick,
}: {
  title: string;
  value: string;
  sub?: string;
  color?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const clickable = !!onClick;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border-l-4 bg-panel p-4 text-left shadow-sm transition-all ${clickable ? "cursor-pointer hover:brightness-110" : "cursor-default"} ${active ? "scale-[1.03] ring-2 ring-offset-2 ring-offset-background" : ""}`}
      style={{
        borderLeftColor: color || "var(--brand)",
        ...(active ? { ["--tw-ring-color" as string]: color || "var(--brand)" } : {}),
      }}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      <div className="mt-2 text-2xl font-bold text-foreground">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </button>
  );
}


function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-t-lg bg-[var(--panel-header)] px-4 py-2 text-sm font-bold uppercase tracking-wider text-white">
      {children}
    </div>
  );
}

function Dashboard() {
  const { rows, lastUpdate } = useAuditoriaData();
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [sortKey, setSortKey] = useState<string>("Valor");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [cdSortKey, setCdSortKey] = useState<"qnt" | "val">("val");
  const [cdSortDir, setCdSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const fileRef = useRef<HTMLInputElement>(null);


  const filtered = useMemo(() => applyFilters(rows, filters), [rows, filters]);

  // Available options for each filter (dependent — computed excluding self)
  const opts = useMemo(() => {
    const o = (key: keyof FilterState, getter: (r: Solicitacao) => string | null) =>
      uniq(applyFilters(rows, filters, key).map(getter));
    return {
      ano: uniq(applyFilters(rows, filters, "ano").map((r) => (r.Ano ? String(r.Ano) : null))),
      cd: o("cd", (r) => r.CD),
      regiao: o("regiao", (r) => r["Região"]),
      modalidade: o("modalidade", (r) => r.Modalidade),
      tipo: o("tipo", (r) => r.Tipo),
      status: uniq(
        applyFilters(rows, filters, "status").map((r) => normStatus(r["Status Auditoria"])),
      ) as string[],
      cliente: o("cliente", (r) => r.Cliente),
      causa: o("causa", (r) => r["Causa Raiz"]),
    };
  }, [rows, filters]);

  // KPIs
  const kpi = useMemo(() => {
    const total = filtered.length;
    const valor = filtered.reduce((s, r) => s + (Number(r.Valor) || 0), 0);
    const byStatus: Record<StatusKey, number> = {
      Pago: 0,
      Reprovado: 0,
      Aprovado: 0,
      "Aguardando pagamento": 0,
      "Revisão necessária": 0,
      "Aguardando Auditoria": 0,
    };
    const valorByStatus: Record<StatusKey, number> = { ...byStatus };
    for (const r of filtered) {
      const s = normStatus(r["Status Auditoria"]);
      byStatus[s]++;
      valorByStatus[s] += Number(r.Valor) || 0;
    }

    return { total, valor, byStatus, valorByStatus };
  }, [filtered]);

  const pieData = STATUS_LIST.map((s) => ({ name: s, value: kpi.byStatus[s] })).filter(
    (d) => d.value > 0,
  );
  const barData = STATUS_LIST.map((s) => ({
    name: s,
    value: kpi.valorByStatus[s],
  })).filter((d) => d.value > 0);

  // Aprovados por CD
  const aprovadosPorCd = useMemo(() => {
    const approved = filtered.filter((r) => normStatus(r["Status Auditoria"]) === "Aprovado");
    const totalQnt = approved.length;
    const totalVal = approved.reduce((s, r) => s + (Number(r.Valor) || 0), 0);
    const map = new Map<string, { qnt: number; val: number; label: string }>();
    for (const r of approved) {
      const k = r.CD || "-";
      const label = cdLabel(r.CD, r.CD_Full);
      const e = map.get(k) || { qnt: 0, val: 0, label };
      e.qnt++;
      e.val += Number(r.Valor) || 0;
      map.set(k, e);
    }
    const rowsArr = Array.from(map.entries()).map(([cd, v]) => ({
      cd,
      label: v.label,
      qnt: v.qnt,
      val: v.val,
      pct: totalVal ? (v.val / totalVal) * 100 : 0,
    }));
    const sorted = rowsArr.sort((a, b) => {
      const av = a[cdSortKey];
      const bv = b[cdSortKey];
      return cdSortDir === "asc" ? av - bv : bv - av;
    });
    return { rows: sorted, totalQnt, totalVal };
  }, [filtered, cdSortKey, cdSortDir]);


  // Detalhamento table
  const detalhes = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[sortKey];
      const bv = (b as unknown as Record<string, unknown>)[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number")
        return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return sorted;
  }, [filtered, sortKey, sortDir]);

  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(detalhes.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = detalhes.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const detColumns: { key: keyof Solicitacao; label: string }[] = [
    { key: "Id Portal", label: "Id Portal" },
    { key: "NFD", label: "NFD" },
    { key: "Cliente", label: "Cliente" },
    { key: "Região", label: "Região" },
    { key: "CD", label: "CD" },
    { key: "NF", label: "NF" },
    { key: "Valor", label: "Valor" },
    { key: "Modalidade", label: "Modalidade" },
    { key: "Tipo", label: "Tipo" },
    { key: "Causa Raiz", label: "Causa Raiz" },
    { key: "OBS REPROVAÇÃO/APROVAÇÃO:", label: "OBS Reprovação/Aprovação" },
  ];

  const toggleSort = (k: string) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("desc");
    }
  };

  const downloadExcel = () => {
    const data = detalhes.map((r) => ({
      "Id Portal": r["Id Portal"],
      NFD: r.NFD,
      Cliente: r.Cliente,
      Região: r["Região"],
      CD: r.CD,
      NF: r.NF,
      Valor: r.Valor,
      Modalidade: r.Modalidade,
      Tipo: r.Tipo,
      "Causa Raiz": r["Causa Raiz"],
      "OBS Reprovação/Aprovação": r["OBS REPROVAÇÃO/APROVAÇÃO:"],
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Detalhamento");
    XLSX.writeFile(wb, `auditoria-devolucoes-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const onUpload = async (file: File) => {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { cellDates: true });
    const sheet = wb.Sheets["SOLICITAÇÕES"] || wb.Sheets[wb.SheetNames[0]];
    const arr: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    // find header row (contains "Id Portal")
    let headerIdx = -1;
    for (let i = 0; i < Math.min(20, arr.length); i++) {
      if (arr[i]?.some((c) => String(c).trim() === "Id Portal")) {
        headerIdx = i;
        break;
      }
    }
    if (headerIdx === -1) return;
    const headers = arr[headerIdx] as string[];
    const dataRows = arr.slice(headerIdx + 1);
    const parsed: Solicitacao[] = dataRows
      .map((row) => {
        const o: Record<string, unknown> = {};
        headers.forEach((h, i) => (o[h] = row[i]));
        if (!o["Id Portal"]) return null;
        let cd = o["CD"] as string | null;
        const cdFull = cd;
        if (cd) {
          const m = /REDE ANCORA\s*-\s*([A-Z]{2})/.exec(cd);
          if (m) cd = m[1];
        }
        return {
          Data: o["Data"] instanceof Date ? (o["Data"] as Date).toISOString() : (o["Data"] as string | null),
          "Id Portal": o["Id Portal"] as number,
          "Número Benner": o["Número Benner"] as number,
          NFD: o["NFD"] as number,
          Cliente: o["Cliente"] as string,
          "Região": o["Região"] as string,
          CD: cd,
          CD_Full: cdFull,
          NF: o["NF"] as number,
          Valor: Number(o["Valor"]) || 0,
          Modalidade: o["Modalidade"] as string,
          Tipo: o["Tipo"] as string,
          "Causa Raiz": o["Causa Raiz"] as string,
          Status: o["Status"] as string,
          "Entrada Devolução": o["Entrada Devolução"] as string | number,
          "Situação": o["Situação"] as string | number,
          "Status Auditoria": o["Status Auditoria"] as string,
          "Data de validação":
            o["Data de validação"] instanceof Date
              ? (o["Data de validação"] as Date).toISOString()
              : (o["Data de validação"] as string | null),
          Validador: o["Validador"] as string | number,
          "OBS REPROVAÇÃO/APROVAÇÃO:": o["OBS REPROVAÇÃO/APROVAÇÃO:"] as string,
          Ano: o["Ano"] as number,
        } as Solicitacao;
      })
      .filter((x): x is Solicitacao => x !== null);
    setRows(parsed);
    setFilters(emptyFilters);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="flex w-72 flex-shrink-0 flex-col border-r border-border bg-panel">
        <div className="flex items-center gap-3 border-b border-border px-4 py-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-[10px] font-bold uppercase leading-tight text-white">
            Rede
            <br />
            ANCORA
          </div>
          <div>
            <div className="text-sm font-bold">Rede ANCORA</div>
            <div className="text-[11px] text-muted-foreground">Auditoria HD</div>
          </div>

        </div>

        <nav className="border-b border-border p-2">
          <button className="flex w-full items-center gap-2 rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white">
            <LayoutDashboard className="h-4 w-4" />
            Visão Geral
          </button>
          <button className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
            <ListChecks className="h-4 w-4" />
            Detalhamento de Chamados
          </button>
        </nav>

        <div className="flex-1 overflow-auto p-3">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <FilterIcon className="h-3.5 w-3.5" /> Filtros
          </div>
          <div className="space-y-3">
            <MultiSelect
              label="CD"
              options={opts.cd}
              value={filters.cd}
              onChange={(v) => setFilters((f) => ({ ...f, cd: v }))}
            />
            <MultiSelect
              label="Região"
              options={opts.regiao}
              value={filters.regiao}
              onChange={(v) => setFilters((f) => ({ ...f, regiao: v }))}
            />
            <MultiSelect
              label="Modalidade"
              options={opts.modalidade}
              value={filters.modalidade}
              onChange={(v) => setFilters((f) => ({ ...f, modalidade: v }))}
            />
            <MultiSelect
              label="Tipo"
              options={opts.tipo}
              value={filters.tipo}
              onChange={(v) => setFilters((f) => ({ ...f, tipo: v }))}
            />
            <MultiSelect
              label="Status"
              options={opts.status}
              value={filters.status}
              onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
            />
            <MultiSelect
              label="Cliente"
              options={opts.cliente}
              value={filters.cliente}
              onChange={(v) => setFilters((f) => ({ ...f, cliente: v }))}
            />
            <MultiSelect
              label="Causa Raiz"
              options={opts.causa}
              value={filters.causa}
              onChange={(v) => setFilters((f) => ({ ...f, causa: v }))}
            />
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Data de entrada
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.dataDe}
                  onChange={(e) => setFilters((f) => ({ ...f, dataDe: e.target.value }))}
                  className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-xs text-foreground"
                />
                <input
                  type="date"
                  value={filters.dataAte}
                  onChange={(e) => setFilters((f) => ({ ...f, dataAte: e.target.value }))}
                  className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-xs text-foreground"
                />
              </div>
            </div>
            <button
              onClick={() => setFilters(emptyFilters)}
              className="mt-2 w-full rounded-md border border-border bg-secondary py-2 text-sm font-semibold text-foreground hover:bg-brand hover:border-brand"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-panel px-6 py-4">
          <div>
            <h1 className="text-xl font-bold tracking-wide text-white">
              AUDITORIA DE DEVOLUÇÕES
            </h1>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Rede ANCORA
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold uppercase text-muted-foreground">Ano</span>
              <select
                value={filters.ano}
                onChange={(e) => setFilters((f) => ({ ...f, ano: e.target.value }))}
                className="rounded-md border border-border bg-input px-2 py-1.5 text-sm text-foreground"
              >
                <option value="Todos">Todos</option>
                {opts.ano.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={filters.dataDe}
                onChange={(e) => setFilters((f) => ({ ...f, dataDe: e.target.value }))}
                className="rounded-md border border-border bg-input px-2 py-1.5 text-sm text-foreground"
              />
              <span className="text-muted-foreground">→</span>
              <input
                type="date"
                value={filters.dataAte}
                onChange={(e) => setFilters((f) => ({ ...f, dataAte: e.target.value }))}
                className="rounded-md border border-border bg-input px-2 py-1.5 text-sm text-foreground"
              />
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm font-semibold text-foreground hover:bg-panel-header"
            >
              <Upload className="h-4 w-4" />
              Importar planilha
            </button>
            <button
              onClick={downloadExcel}
              className="inline-flex items-center gap-2 rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white hover:brightness-110"
            >
              <Download className="h-4 w-4" />
              Baixar Excel
            </button>
          </div>
        </header>

        <div className="flex-1 space-y-6 overflow-auto p-6">
          {/* KPIs */}
          <section>
            <SectionHeader>Auditoria de Chamados</SectionHeader>
            <div className="grid grid-cols-2 gap-3 rounded-b-lg bg-panel/50 p-4 md:grid-cols-4 xl:grid-cols-8">
              <KpiCard
                title="Total de Chamados Analisados"
                value={fmtInt(kpi.total)}
                color="#ffffff"
                active={filters.status.length === 0}
                onClick={() => setFilters((f) => ({ ...f, status: [] }))}
              />
              <KpiCard
                title="Valor Total Analisado"
                value={fmtBRL(kpi.valor)}
                color="#ffffff"
                active={filters.status.length === 0}
                onClick={() => setFilters((f) => ({ ...f, status: [] }))}
              />
              {STATUS_LIST.map((s) => {
                const isActive = filters.status.length === 1 && filters.status[0] === s;
                return (
                  <KpiCard
                    key={s}
                    title={s}
                    value={fmtInt(kpi.byStatus[s])}
                    sub={`${pct(kpi.byStatus[s], kpi.total)} do total`}
                    color={STATUS_COLORS[s]}
                    active={isActive}
                    onClick={() =>
                      setFilters((f) => ({ ...f, status: isActive ? [] : [s] }))
                    }
                  />
                );
              })}
            </div>

          </section>

          {/* Charts */}
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg bg-panel">
              <SectionHeader>Distribuição por Status</SectionHeader>
              <div className="p-4" style={{ height: 340 }}>
                {pieData.length === 0 ? (
                  <EmptyState />
                ) : (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={2}
                        label={(e) => `${((e.percent as number) * 100).toFixed(1)}%`}
                      >
                        {pieData.map((d) => (
                          <Cell key={d.name} fill={STATUS_COLORS[d.name as StatusKey]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "#16295C",
                          border: "1px solid #24407a",
                          color: "#fff",
                        }}
                        formatter={(v: number) => fmtInt(v)}
                      />
                      <Legend
                        verticalAlign="middle"
                        align="right"
                        layout="vertical"
                        wrapperStyle={{ color: "#f5f7fb", fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-panel">
              <SectionHeader>Valor por Status</SectionHeader>
              <div className="p-4" style={{ height: 340 }}>
                {barData.length === 0 ? (
                  <EmptyState />
                ) : (
                  <ResponsiveContainer>
                    <BarChart data={barData} layout="vertical" margin={{ left: 40, right: 60 }}>
                      <XAxis type="number" stroke="#a9b5d1" tickFormatter={(v) => fmtBRL(v)} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#a9b5d1"
                        width={140}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#16295C",
                          border: "1px solid #24407a",
                          color: "#fff",
                        }}
                        formatter={(v: number) => fmtBRL(v)}
                      />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {barData.map((d) => (
                          <Cell key={d.name} fill={STATUS_COLORS[d.name as StatusKey]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </section>

          {/* Aprovados por CD */}
          <section className="rounded-lg bg-panel">
            <SectionHeader>Aprovados por CD</SectionHeader>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-2">CD</th>
                    <th
                      className="cursor-pointer select-none px-4 py-2 text-right hover:text-white"
                      onClick={() => {
                        if (cdSortKey === "qnt") setCdSortDir((d) => (d === "asc" ? "desc" : "asc"));
                        else {
                          setCdSortKey("qnt");
                          setCdSortDir("desc");
                        }
                      }}
                    >
                      Qnt. Cham.{cdSortKey === "qnt" ? (cdSortDir === "asc" ? " ▲" : " ▼") : ""}
                    </th>
                    <th
                      className="cursor-pointer select-none px-4 py-2 text-right hover:text-white"
                      onClick={() => {
                        if (cdSortKey === "val") setCdSortDir((d) => (d === "asc" ? "desc" : "asc"));
                        else {
                          setCdSortKey("val");
                          setCdSortDir("desc");
                        }
                      }}
                    >
                      Valor{cdSortKey === "val" ? (cdSortDir === "asc" ? " ▲" : " ▼") : ""}
                    </th>
                    <th className="px-4 py-2 text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {aprovadosPorCd.rows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                        Nenhum chamado aprovado no filtro atual.
                      </td>
                    </tr>
                  ) : (
                    aprovadosPorCd.rows.map((r) => (
                      <tr key={r.cd} className="border-t border-border/60 hover:bg-secondary/50">
                        <td className="px-4 py-2 font-medium" title={r.cd}>{r.label}</td>
                        <td className="px-4 py-2 text-right">{fmtInt(r.qnt)}</td>
                        <td className="px-4 py-2 text-right">{fmtBRL(r.val)}</td>
                        <td className="px-4 py-2 text-right">{r.pct.toFixed(1)}%</td>
                      </tr>
                    ))
                  )}
                </tbody>

                {aprovadosPorCd.rows.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-border bg-[var(--panel-header)] font-bold">
                      <td className="px-4 py-2">Total Geral</td>
                      <td className="px-4 py-2 text-right">{fmtInt(aprovadosPorCd.totalQnt)}</td>
                      <td className="px-4 py-2 text-right">{fmtBRL(aprovadosPorCd.totalVal)}</td>
                      <td className="px-4 py-2 text-right">100%</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </section>

          {/* Detalhamento */}
          <section className="rounded-lg bg-panel">
            <SectionHeader>Detalhamento de Chamados</SectionHeader>
            <div className="overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-secondary text-left uppercase tracking-wider text-muted-foreground">
                    {detColumns.map((c) => (
                      <th
                        key={c.key as string}
                        className="cursor-pointer whitespace-nowrap px-3 py-2 hover:text-white"
                        onClick={() => toggleSort(c.key as string)}
                      >
                        {c.label}
                        {sortKey === (c.key as string) && (sortDir === "asc" ? " ▲" : " ▼")}
                      </th>
                    ))}
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={detColumns.length + 1}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        Nenhum chamado encontrado para os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((r, i) => {
                      const s = normStatus(r["Status Auditoria"]);
                      return (
                        <tr
                          key={`${r["Id Portal"]}-${i}`}
                          className="border-t border-border/50 hover:bg-secondary/40"
                        >
                          {detColumns.map((c) => {
                            const v = r[c.key];
                            const display =
                              c.key === "Valor"
                                ? fmtBRL(Number(v) || 0)
                                : v == null
                                  ? "-"
                                  : String(v);
                            return (
                              <td
                                key={c.key as string}
                                className={`whitespace-nowrap px-3 py-2 ${c.key === "Valor" ? "text-right font-mono" : ""} ${c.key === "Cliente" || c.key === "OBS REPROVAÇÃO/APROVAÇÃO:" ? "max-w-[240px] truncate" : ""}`}
                                title={String(v ?? "")}
                              >
                                {display}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2">
                            {s && (
                              <span
                                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                                style={{ background: STATUS_COLORS[s] }}
                              >
                                {s}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {detalhes.length > 0 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
                <div>
                  Mostrando {(currentPage - 1) * pageSize + 1}-
                  {Math.min(currentPage * pageSize, detalhes.length)} de {fmtInt(detalhes.length)}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded border border-border px-2 py-1 disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <span>
                    Página {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded border border-border px-2 py-1 disabled:opacity-40"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-panel px-6 py-3 text-[11px] text-muted-foreground">
          <span>
            Fonte: Sistema HD - Rede ANCORA | Dados extraídos do B2B. Valores exibidos sem impostos,
            podendo apresentar variações.
          </span>
          <span className="inline-flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            Última atualização:{" "}
            {lastUpdate.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
          </span>
        </footer>
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Nenhum dado para exibir com os filtros atuais.
    </div>
  );
}
