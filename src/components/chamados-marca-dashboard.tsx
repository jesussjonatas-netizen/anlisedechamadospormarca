import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LabelList,
} from "recharts";
import {
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Clock3,
  Download,
  Eraser,
  Filter,
  Search,
  XCircle,
} from "lucide-react";
import type { Solicitacao } from "@/lib/auditoria-types";
import { solicitacoesQueryOptions } from "@/lib/solicitacoes-queries";
import { CxKpiCard, CxMultiSelect, CxPanel, CxQuickSelect, CxSearch } from "@/components/cx-ui";
import ancoraLogo from "@/assets/ancora-logo.png";
const BLUE = "#083B63";
const GREEN = "#7AC143";
const RED = "#CE0E2D";

const MESES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const fmtInt = (v: number) => v.toLocaleString("pt-BR");
const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
const fmtPct = (n: number, d: number) => (d === 0 ? "0,0%" : `${((n / d) * 100).toFixed(1).replace(".", ",")}%`);

// ---------------- regras de negócio ----------------

/** Normaliza texto: minúsculo, sem acentos e sem espaços extras. */
function norm(s: unknown) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

type Classe = "Procedente" | "Improcedente" | "Em tratativa";

const STATUS_IMPROCEDENTE = new Set(
  ["Cancelado por tempo", "Improcedente", "Encerrado", "Em Discordância", "Em Preparação"].map(norm),
);

const STATUS_TRATATIVA = new Set(
  [
    "Em Análise",
    "Verificando com o Fornecedor",
    "Aguardando Atendimento",
    "Discordância Aceita",
    "Com Erros",
    "Verificando com a Transportadora",
    "Aguardando lista de Itens",
    "Em tratativa com o Gestor da Filial",
  ].map(norm),
);

/** Classificação do chamado a partir do Status atual. */
function classeDe(r: Solicitacao): Classe {
  const st = norm(r.Status);
  if (STATUS_IMPROCEDENTE.has(st)) return "Improcedente";
  if (STATUS_TRATATIVA.has(st)) return "Em tratativa";
  return "Procedente";
}

/** Marca do item; base sem marca preenchida cai em "Não informado". */
const marcaDe = (r: Solicitacao) => (r.Marca && String(r.Marca).trim()) || "Não informado";

/** Chave do chamado único: Marca + ID Portal. */
const chamadoKey = (r: Solicitacao) => `${marcaDe(r)}||${r["Id Portal"] ?? "-"}`;

const contarChamados = (rows: Solicitacao[]) => new Set(rows.map(chamadoKey)).size;

const contarPorClasse = (rows: Solicitacao[], c: Classe) =>
  new Set(rows.filter((r) => classeDe(r) === c).map(chamadoKey)).size;

const mesDe = (r: Solicitacao) => (r.Data ? Number(r.Data.slice(5, 7)) : null);

// ---------------- filtros ----------------

type FilterKey =
  | "ano"
  | "mes"
  | "marca"
  | "regiao"
  | "cd"
  | "cliente"
  | "modalidade"
  | "tipo"
  | "status"
  | "procedencia"
  | "nome";

type FilterState = Record<FilterKey, string[]>;

const FILTER_KEYS: FilterKey[] = [
  "ano",
  "mes",
  "marca",
  "regiao",
  "cd",
  "cliente",
  "modalidade",
  "tipo",
  "status",
  "procedencia",
  "nome",
];

const emptyFilters: FilterState = {
  ano: [],
  mes: [],
  marca: [],
  regiao: [],
  cd: [],
  cliente: [],
  modalidade: [],
  tipo: [],
  status: [],
  procedencia: [],
  nome: [],
};

const getters: Record<FilterKey, (r: Solicitacao) => string> = {
  ano: (r) => (r.Ano != null ? String(r.Ano) : r.Data ? r.Data.slice(0, 4) : ""),
  mes: (r) => {
    const m = mesDe(r);
    return m ? MESES[m - 1] : "";
  },
  marca: marcaDe,
  regiao: (r) => r["Região"] ?? "",
  cd: (r) => r.CD ?? "",
  cliente: (r) => r.Cliente ?? "",
  modalidade: (r) => r.Modalidade ?? "",
  tipo: (r) => r.Tipo ?? "",
  status: (r) => r.Status ?? "",
  procedencia: classeDe,
  nome: (r) => r.Nome ?? "",
};

function applyFilters(rows: Solicitacao[], f: FilterState, skip?: FilterKey) {
  return rows.filter((r) =>
    FILTER_KEYS.every((k) => {
      if (k === skip || f[k].length === 0) return true;
      return f[k].includes(getters[k](r));
    }),
  );
}

function uniqSorted(values: string[], ordered?: string[]) {
  const set = new Set(values.filter((v) => v !== ""));
  if (ordered) return ordered.filter((o) => set.has(o));
  return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));
}

const TABLE_COLS: { key: string; label: string; get: (r: Solicitacao) => string | number | null }[] = [
  { key: "Data", label: "Data", get: (r) => r.Data },
  { key: "Id Portal", label: "ID Portal", get: (r) => r["Id Portal"] as string | null },
  { key: "Marca", label: "Marca", get: marcaDe },
  { key: "Cliente", label: "Cliente", get: (r) => r.Cliente },
  { key: "CD", label: "CD", get: (r) => r.CD },
  { key: "Valor", label: "Valor", get: (r) => r.Valor },
  { key: "Modalidade", label: "Modalidade", get: (r) => r.Modalidade },
  { key: "Tipo", label: "Tipo", get: (r) => r.Tipo },
  { key: "CNA", label: "CNA", get: (r) => r.CNA },
  { key: "Código", label: "Código", get: (r) => r["Código"] },
  { key: "Nome", label: "Nome", get: (r) => r.Nome },
  { key: "Status", label: "Status", get: (r) => r.Status },
  { key: "Classificação", label: "Classificação", get: classeDe },
  { key: "Causa Raiz", label: "Causa Raiz", get: (r) => r["Causa Raiz"] },
];

export default function ChamadosPorMarca() {
  const { data } = useSuspenseQuery(solicitacoesQueryOptions);

  // escopo: chamados de Crossdocking (quando a base tiver essa modalidade)
  const base = useMemo(() => {
    const cross = data.rows.filter((r: Solicitacao) => norm(r.Modalidade).includes("crossdocking"));
    return cross.length > 0 ? cross : data.rows;
  }, [data.rows]);

  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [busca, setBusca] = useState("");
  const [buscaMarca, setBuscaMarca] = useState("");
  const [buscaProc, setBuscaProc] = useState("");
  const [buscaItem, setBuscaItem] = useState("");
  const [granularidade, setGranularidade] = useState<"Dia" | "Mês" | "Ano">("Mês");
  const [sortKey, setSortKey] = useState<string>("Data");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => applyFilters(base, filters), [base, filters]);

  const opts = useMemo(() => {
    const o = (k: FilterKey, ordered?: string[]) =>
      uniqSorted(applyFilters(base, filters, k).map(getters[k]), ordered);
    return {
      ano: o("ano"),
      mes: o("mes", MESES),
      marca: o("marca"),
      regiao: o("regiao"),
      cd: o("cd"),
      cliente: o("cliente"),
      modalidade: o("modalidade"),
      tipo: o("tipo"),
      status: o("status"),
      procedencia: o("procedencia", ["Procedente", "Em tratativa", "Improcedente"]),
    };
  }, [base, filters]);

  // ---- KPIs (chamado único = Marca + ID Portal) ----
  const kpi = useMemo(() => {
    const totalChamados = contarChamados(filtered);
    return {
      totalChamados,
      totalMarcas: new Set(filtered.map(marcaDe)).size,
      totalItens: filtered.length,
      tratativa: contarPorClasse(filtered, "Em tratativa"),
      procedentes: contarPorClasse(filtered, "Procedente"),
      improcedentes: contarPorClasse(filtered, "Improcedente"),
    };
  }, [filtered]);

  // ---- Ranking de marcas (chamados únicos) ----
  const ranking = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const r of filtered) {
      const m = marcaDe(r);
      if (!map.has(m)) map.set(m, new Set());
      map.get(m)!.add(chamadoKey(r));
    }
    const q = norm(buscaMarca);
    return Array.from(map.entries())
      .map(([marca, ids]) => ({ marca, chamados: ids.size }))
      .filter((d) => (q ? norm(d.marca).includes(q) : true))
      .sort((a, b) => b.chamados - a.chamados)
      .slice(0, 15);
  }, [filtered, buscaMarca]);

  // ---- Procedente x Improcedente x Em tratativa por marca ----
  const porMarcaClasse = useMemo(() => {
    const map = new Map<string, { p: Set<string>; i: Set<string>; t: Set<string> }>();
    for (const r of filtered) {
      const m = marcaDe(r);
      if (!map.has(m)) map.set(m, { p: new Set(), i: new Set(), t: new Set() });
      const e = map.get(m)!;
      const c = classeDe(r);
      (c === "Procedente" ? e.p : c === "Improcedente" ? e.i : e.t).add(chamadoKey(r));
    }
    const q = norm(buscaProc);
    return Array.from(map.entries())
      .map(([marca, v]) => {
        const total = v.p.size + v.i.size + v.t.size;
        return {
          marca,
          Procedente: v.p.size,
          "Em tratativa": v.t.size,
          Improcedente: v.i.size,
          total,
          rotulo: `${fmtInt(total)} • ${fmtPct(v.p.size, total)} proc.`,
        };
      })
      .filter((d) => (q ? norm(d.marca).includes(q) : true))
      .sort((a, b) => b.total - a.total)
      .slice(0, 12);
  }, [filtered, buscaProc]);

  // ---- Ranking de itens (Nome) com mais divergências ----
  const rankingItens = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const r of filtered) {
      const nome = (r.Nome && String(r.Nome).trim()) || "Não informado";
      if (!map.has(nome)) map.set(nome, new Set());
      map.get(nome)!.add(chamadoKey(r));
    }
    const q = norm(buscaItem);
    return Array.from(map.entries())
      .map(([nome, ids]) => ({ nome, chamados: ids.size }))
      .filter((d) => (q ? norm(d.nome).includes(q) : true))
      .sort((a, b) => b.chamados - a.chamados)
      .slice(0, 15);
  }, [filtered, buscaItem]);

  // ---- Evolução dos chamados ----
  const evolucao = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const r of filtered) {
      if (!r.Data) continue;
      const k =
        granularidade === "Dia"
          ? r.Data.slice(0, 10)
          : granularidade === "Mês"
            ? r.Data.slice(0, 7)
            : r.Data.slice(0, 4);
      if (!map.has(k)) map.set(k, new Set());
      map.get(k)!.add(chamadoKey(r));
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, s]) => ({
        periodo:
          granularidade === "Dia"
            ? `${k.slice(8, 10)}/${k.slice(5, 7)}`
            : granularidade === "Mês"
              ? `${k.slice(5, 7)}/${k.slice(2, 4)}`
              : k,
        chamados: s.size,
      }));
  }, [filtered, granularidade]);

  // ---- Tabela ----
  const tableRows = useMemo(() => {
    const q = norm(busca);
    const rows = q
      ? filtered.filter((r) => TABLE_COLS.some((c) => norm(c.get(r)).includes(q)))
      : filtered;
    const col = TABLE_COLS.find((c) => c.key === sortKey) ?? TABLE_COLS[0];
    return [...rows].sort((a, b) => {
      const av = col.get(a);
      const bv = col.get(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number")
        return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv), "pt-BR", { numeric: true })
        : String(bv).localeCompare(String(av), "pt-BR", { numeric: true });
    });
  }, [filtered, busca, sortKey, sortDir]);

  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(tableRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = tableRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const setFilter = (k: FilterKey) => (v: string[]) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setPage(1);
  };

  const toggleValue = (k: FilterKey, v: string) => {
    setFilters((f) => ({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] }));
    setPage(1);
  };

  const toggleSort = (key: string) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const limpar = () => {
    setFilters(emptyFilters);
    setBusca("");
    setBuscaMarca("");
    setBuscaProc("");
    setBuscaItem("");
    setPage(1);
  };

  const exportar = async () => {
    const XLSX = await import("xlsx");
    const dados = tableRows.map((r) =>
      Object.fromEntries(TABLE_COLS.map((c) => [c.label, c.get(r) ?? ""])),
    );
    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Chamados");
    XLSX.writeFile(wb, "chamados-por-marca.xlsx");
  };

  const ultimaAtualizacao = new Date(data.lastUpdate).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });

  return (
    <div className="cx-theme min-h-screen">
      {/* Cabeçalho */}
      <header className="border-b-4 border-[var(--cx-green)] bg-[var(--cx-blue)] text-white">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6">
          <img src={ancoraLogo} alt="Logo Rede ANCORA" className="h-10 w-auto" />
          <h1 className="order-3 w-full text-center text-lg font-bold tracking-tight md:order-2 md:w-auto md:text-xl">
            Análise de Chamados por Marca
          </h1>
          <div className="order-2 text-right text-xs md:order-3">
            <div className="uppercase tracking-wide opacity-70">Última atualização da base</div>
            <div className="font-semibold">{ultimaAtualizacao}</div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1800px] flex-col gap-6 px-4 py-6 md:px-6 lg:flex-row">
        {/* Filtros laterais */}
        <aside className="w-full shrink-0 lg:w-72">
          <div className="rounded-xl border border-[var(--cx-border)] bg-[var(--cx-card)] p-4 shadow-sm lg:sticky lg:top-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--cx-blue)]">
              <Filter className="h-4 w-4" /> Filtros
            </div>
            <div className="space-y-3">
              <CxQuickSelect label="Ano" options={opts.ano} value={filters.ano} onChange={setFilter("ano")} cols={3} />
              <CxQuickSelect label="Mês" options={opts.mes} value={filters.mes} onChange={setFilter("mes")} cols={4} />
              <CxMultiSelect label="Marca" options={opts.marca} value={filters.marca} onChange={setFilter("marca")} />
              <CxMultiSelect label="Região" options={opts.regiao} value={filters.regiao} onChange={setFilter("regiao")} />
              <CxMultiSelect label="CD" options={opts.cd} value={filters.cd} onChange={setFilter("cd")} />
              <CxMultiSelect label="Cliente" options={opts.cliente} value={filters.cliente} onChange={setFilter("cliente")} />
              <CxMultiSelect label="Modalidade" options={opts.modalidade} value={filters.modalidade} onChange={setFilter("modalidade")} />
              <CxMultiSelect label="Tipo" options={opts.tipo} value={filters.tipo} onChange={setFilter("tipo")} />
              <CxMultiSelect label="Status" options={opts.status} value={filters.status} onChange={setFilter("status")} />
              <CxMultiSelect label="Procedência" options={opts.procedencia} value={filters.procedencia} onChange={setFilter("procedencia")} />
              {filters.nome.length > 0 && (
                <div className="rounded-md border border-[var(--cx-border)] bg-[var(--cx-bg)] p-2 text-xs">
                  <div className="font-semibold text-[var(--cx-blue)]">Item selecionado</div>
                  <div className="truncate" title={filters.nome.join(", ")}>
                    {filters.nome.join(", ")}
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={limpar}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[var(--cx-blue)] px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <Eraser className="h-4 w-4" /> Limpar filtros
              </button>
              <button
                type="button"
                onClick={exportar}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[var(--cx-green)] px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <Download className="h-4 w-4" /> Exportar seleção para Excel
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-6">
          {/* KPIs */}
          <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <CxKpiCard title="Total de Chamados" value={fmtInt(kpi.totalChamados)} sub="Marca + ID Portal" />
            <CxKpiCard title="Total de Marcas" value={fmtInt(kpi.totalMarcas)} />
            <CxKpiCard title="Total de Itens" value={fmtInt(kpi.totalItens)} sub="1 linha = 1 item" />
            <CxKpiCard
              title="Chamados em Tratativa"
              value={fmtInt(kpi.tratativa)}
              color={BLUE}
              icon={<Clock3 className="h-5 w-5" style={{ color: BLUE }} />}
              onClick={() => toggleValue("procedencia", "Em tratativa")}
              active={filters.procedencia.includes("Em tratativa")}
            />
            <CxKpiCard
              title="Chamados Procedentes"
              value={fmtInt(kpi.procedentes)}
              color={GREEN}
              icon={<CheckCircle2 className="h-5 w-5" style={{ color: GREEN }} />}
              onClick={() => toggleValue("procedencia", "Procedente")}
              active={filters.procedencia.includes("Procedente")}
            />
            <CxKpiCard
              title="Chamados Improcedentes"
              value={fmtInt(kpi.improcedentes)}
              color={RED}
              icon={<XCircle className="h-5 w-5" style={{ color: RED }} />}
              onClick={() => toggleValue("procedencia", "Improcedente")}
              active={filters.procedencia.includes("Improcedente")}
            />
            <CxKpiCard title="% Procedência" value={fmtPct(kpi.procedentes, kpi.totalChamados)} color={GREEN} />
            <CxKpiCard title="% Improcedência" value={fmtPct(kpi.improcedentes, kpi.totalChamados)} color={RED} />
            <CxKpiCard title="% Em Tratativa" value={fmtPct(kpi.tratativa, kpi.totalChamados)} color={BLUE} />
          </section>

          {/* Primeira linha de gráficos */}
          <div className="grid grid-cols-1 gap-6 2xl:grid-cols-3">
            <CxPanel
              title="Ranking de Marcas"
              actions={<CxSearch value={buscaMarca} onChange={setBuscaMarca} placeholder="Buscar marca..." />}
            >
              <div style={{ height: Math.max(280, ranking.length * 28) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ranking} layout="vertical" margin={{ left: 16, right: 32 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e6eaef" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="marca" width={130} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => [fmtInt(v), "Chamados"]} />
                    <Bar
                      dataKey="chamados"
                      fill={BLUE}
                      radius={[0, 4, 4, 0]}
                      cursor="pointer"
                      onClick={(d: { marca?: string }) => d?.marca && toggleValue("marca", d.marca)}
                    >
                      <LabelList dataKey="chamados" position="right" style={{ fontSize: 10, fill: BLUE }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CxPanel>

            <CxPanel
              title="Procedente x Improcedente x Em Tratativa"
              actions={<CxSearch value={buscaProc} onChange={setBuscaProc} placeholder="Buscar marca..." />}
            >
              <div style={{ height: Math.max(280, porMarcaClasse.length * 32) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={porMarcaClasse} layout="vertical" margin={{ left: 16, right: 110 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e6eaef" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="marca" width={130} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => fmtInt(v)} />
                    <Legend />
                    <Bar dataKey="Procedente" stackId="p" fill={GREEN} cursor="pointer" onClick={(d: { marca?: string }) => d?.marca && toggleValue("marca", d.marca)} />
                    <Bar dataKey="Em tratativa" stackId="p" fill={BLUE} cursor="pointer" onClick={(d: { marca?: string }) => d?.marca && toggleValue("marca", d.marca)} />
                    <Bar dataKey="Improcedente" stackId="p" fill={RED} radius={[0, 4, 4, 0]} cursor="pointer" onClick={(d: { marca?: string }) => d?.marca && toggleValue("marca", d.marca)}>
                      <LabelList dataKey="rotulo" position="right" style={{ fontSize: 10, fill: "#667585" }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CxPanel>

            <CxPanel
              title="Ranking de Itens com mais Divergências"
              actions={<CxSearch value={buscaItem} onChange={setBuscaItem} placeholder="Buscar item..." />}
            >
              <div style={{ height: Math.max(280, rankingItens.length * 28) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rankingItens} layout="vertical" margin={{ left: 16, right: 32 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e6eaef" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="nome" width={150} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => [fmtInt(v), "Chamados"]} />
                    <Bar
                      dataKey="chamados"
                      fill={GREEN}
                      radius={[0, 4, 4, 0]}
                      cursor="pointer"
                      onClick={(d: { nome?: string }) => d?.nome && toggleValue("nome", d.nome)}
                    >
                      <LabelList dataKey="chamados" position="right" style={{ fontSize: 10, fill: BLUE }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CxPanel>
          </div>

          {/* Evolução */}
          <CxPanel
            title="Evolução dos Chamados"
            actions={
              <div className="flex gap-1">
                {(["Dia", "Mês", "Ano"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGranularidade(g)}
                    className="rounded-md px-2 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: granularidade === g ? GREEN : "rgba(255,255,255,.15)",
                      color: "#fff",
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            }
          >
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolucao} margin={{ left: 8, right: 16, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6eaef" />
                  <XAxis dataKey="periodo" tick={{ fontSize: 11 }} minTickGap={16} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(v: number) => [fmtInt(v), "Chamados"]} />
                  <Line type="monotone" dataKey="chamados" stroke={BLUE} strokeWidth={2.5} dot={{ r: 2, fill: BLUE }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CxPanel>

          {/* Ranking de Clientes */}
          <CxPanel
            title="Ranking de Clientes"
            actions={<CxSearch value={buscaCliente} onChange={setBuscaCliente} placeholder="Buscar cliente..." />}
          >
            <div style={{ height: Math.max(280, rankingClientes.length * 30) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rankingClientes} layout="vertical" margin={{ left: 16, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6eaef" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="cliente" width={200} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => [fmtInt(v), "Chamados"]} />
                  <Bar
                    dataKey="chamados"
                    fill={BLUE}
                    radius={[0, 4, 4, 0]}
                    cursor="pointer"
                    onClick={(d: { cliente?: string }) => d?.cliente && toggleValue("cliente", d.cliente)}
                  >
                    <LabelList dataKey="chamados" position="right" style={{ fontSize: 10, fill: BLUE }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CxPanel>

        </main>
      </div>

      <footer className="border-t border-[var(--cx-border)] bg-[var(--cx-card)] py-4 text-center text-xs text-[var(--cx-muted)]">
        Base de dados extraída do Portal B2B.
      </footer>
    </div>
  );
}
