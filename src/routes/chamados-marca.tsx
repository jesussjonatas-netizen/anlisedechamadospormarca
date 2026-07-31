import { createFileRoute } from "@tanstack/react-router";
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
} from "recharts";
import { ChevronUp, ChevronDown, Eraser, Search } from "lucide-react";
import type { Solicitacao } from "@/lib/auditoria-types";
import { solicitacoesQueryOptions } from "@/lib/solicitacoes-queries";
import { CxKpiCard, CxMultiSelect, CxPanel } from "@/components/cx-ui";
import ancoraLogo from "@/assets/ancora-logo.png";

export const Route = createFileRoute("/chamados-marca")({
  head: () => ({
    meta: [
      { title: "Análise de Chamados por Marca | Rede ANCORA" },
      {
        name: "description",
        content:
          "Painel de análise dos chamados de Crossdocking da Rede ANCORA por marca, com procedência, ranking e evolução mensal.",
      },
      { property: "og:title", content: "Análise de Chamados por Marca | Rede ANCORA" },
      {
        property: "og:description",
        content:
          "Painel de análise dos chamados de Crossdocking da Rede ANCORA por marca, com procedência, ranking e evolução mensal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(solicitacoesQueryOptions),
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen items-center justify-center px-4" role="alert">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Erro ao carregar dados</h1>
        <p className="mt-2 text-sm opacity-70">{error.message}</p>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center px-4">Nenhum dado encontrado.</div>
  ),
  component: ChamadosPorMarca,
});

const BLUE = "#083B63";
const GREEN = "#7AC143";
const RED = "#CE0E2D";

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const fmtInt = (v: number) => v.toLocaleString("pt-BR");
const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
const fmtPct = (n: number, d: number) => (d === 0 ? "0,0%" : `${((n / d) * 100).toFixed(1).replace(".", ",")}%`);

// ---- regras de negócio ----
/** Marca do item; base sem marca preenchida cai em "Não informado". */
const marcaDe = (r: Solicitacao) => (r.Marca && String(r.Marca).trim()) || "Não informado";

/** Status considerados improcedentes (regra de negócio da Rede ANCORA). */
const STATUS_IMPROCEDENTES = new Set(
  [
    "Discordância Aceita",
    "Em Discordância",
    "Improcedente",
    "Encerrado",
    "Cancelado",
    "Discordância Encerrada",
    "Encerrada com rejeição",
    "Negado",
    "Rejeitado",
  ].map(normalizarStatus),
);

/** Normaliza texto: minúsculo, sem acentos e sem espaços extras. */
function normalizarStatus(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** Procedência: Improcedente quando o Status está na lista; caso contrário, Procedente. */
function procedenciaDe(r: Solicitacao): "Procedente" | "Improcedente" {
  const st = normalizarStatus((r.Status ?? "").toString());
  return STATUS_IMPROCEDENTES.has(st) ? "Improcedente" : "Procedente";
}

/** Chave do chamado único: Marca + ID Portal. */
const chamadoKey = (r: Solicitacao) => `${marcaDe(r)}||${r["Id Portal"] ?? "-"}`;

const contarChamados = (rows: Solicitacao[]) => new Set(rows.map(chamadoKey)).size;

const mesDe = (r: Solicitacao) => (r.Data ? Number(r.Data.slice(5, 7)) : null);

type FilterKey =
  | "ano"
  | "mes"
  | "marca"
  | "regiao"
  | "cd"
  | "cliente"
  | "conferente"
  | "modalidade"
  | "tipo"
  | "status"
  | "procedencia";

type FilterState = Record<FilterKey, string[]>;

const FILTER_KEYS: FilterKey[] = [
  "ano",
  "mes",
  "marca",
  "regiao",
  "cd",
  "cliente",
  "conferente",
  "modalidade",
  "tipo",
  "status",
  "procedencia",
];

const emptyFilters: FilterState = {
  ano: [],
  mes: [],
  marca: [],
  regiao: [],
  cd: [],
  cliente: [],
  conferente: [],
  modalidade: [],
  tipo: [],
  status: [],
  procedencia: [],
};

const getters: Record<FilterKey, (r: Solicitacao) => string> = {
  ano: (r) => (r.Ano != null ? String(r.Ano) : ""),
  mes: (r) => {
    const m = mesDe(r);
    return m ? MESES[m - 1] : "";
  },
  marca: marcaDe,
  regiao: (r) => r["Região"] ?? "",
  cd: (r) => r.CD ?? "",
  cliente: (r) => r.Cliente ?? "",
  conferente: (r) => r.Conferente ?? "",
  modalidade: (r) => r.Modalidade ?? "",
  tipo: (r) => r.Tipo ?? "",
  status: (r) => r.Status ?? "",
  procedencia: procedenciaDe,
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
  const arr = Array.from(set);
  if (ordered) return ordered.filter((o) => set.has(o));
  return arr.sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));
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
  { key: "Causa Raiz", label: "Causa Raiz", get: (r) => r["Causa Raiz"] },
];

function ChamadosPorMarca() {
  const { data } = useSuspenseQuery(solicitacoesQueryOptions);

  // escopo: chamados de Crossdocking (quando a base tiver essa modalidade)
  const base = useMemo(() => {
    const cross = data.rows.filter((r) =>
      (r.Modalidade ?? "").toLowerCase().includes("crossdocking"),
    );
    return cross.length > 0 ? cross : data.rows;
  }, [data.rows]);

  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [busca, setBusca] = useState("");
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
      conferente: o("conferente"),
      modalidade: o("modalidade"),
      tipo: o("tipo"),
      status: o("status"),
      procedencia: o("procedencia", ["Procedente", "Improcedente", "Não classificado"]),
    };
  }, [base, filters]);

  // ---- KPIs (chamado único = Marca + ID Portal) ----
  const kpi = useMemo(() => {
    const totalChamados = contarChamados(filtered);
    const totalMarcas = new Set(filtered.map(marcaDe)).size;
    const totalItens = filtered.length;
    const procedentes = contarChamados(filtered.filter((r) => procedenciaDe(r) === "Procedente"));
    const improcedentes = contarChamados(
      filtered.filter((r) => procedenciaDe(r) === "Improcedente"),
    );
    return { totalChamados, totalMarcas, totalItens, procedentes, improcedentes };
  }, [filtered]);

  // ---- Ranking de marcas (chamados únicos) ----
  const ranking = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const r of filtered) {
      const m = marcaDe(r);
      if (!map.has(m)) map.set(m, new Set());
      map.get(m)!.add(String(r["Id Portal"] ?? "-"));
    }
    return Array.from(map.entries())
      .map(([marca, ids]) => ({ marca, chamados: ids.size }))
      .sort((a, b) => b.chamados - a.chamados)
      .slice(0, 15);
  }, [filtered]);

  // ---- Procedentes x Improcedentes por marca ----
  const porMarcaProced = useMemo(() => {
    const map = new Map<string, { proc: Set<string>; improc: Set<string> }>();
    for (const r of filtered) {
      const m = marcaDe(r);
      const p = procedenciaDe(r);
      if (p === "Não classificado") continue;
      if (!map.has(m)) map.set(m, { proc: new Set(), improc: new Set() });
      const e = map.get(m)!;
      (p === "Procedente" ? e.proc : e.improc).add(String(r["Id Portal"] ?? "-"));
    }
    return Array.from(map.entries())
      .map(([marca, v]) => ({
        marca,
        Procedente: v.proc.size,
        Improcedente: v.improc.size,
        total: v.proc.size + v.improc.size,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 12);
  }, [filtered]);

  // ---- Evolução mensal (chamados únicos) ----
  const evolucao = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const r of filtered) {
      if (!r.Data) continue;
      const k = r.Data.slice(0, 7);
      if (!map.has(k)) map.set(k, new Set());
      map.get(k)!.add(chamadoKey(r));
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, s]) => ({
        mes: `${k.slice(5, 7)}/${k.slice(2, 4)}`,
        chamados: s.size,
      }));
  }, [filtered]);

  // ---- Tabela ----
  const tableRows = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const rows = q
      ? filtered.filter((r) =>
          TABLE_COLS.some((c) => String(c.get(r) ?? "").toLowerCase().includes(q)),
        )
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

  const toggleSort = (key: string) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const ultimaAtualizacao = new Date(data.lastUpdate).toLocaleDateString("pt-BR");

  return (
    <div className="cx-theme min-h-screen">
      {/* Cabeçalho */}
      <header className="border-b-4 border-[var(--cx-green)] bg-[var(--cx-blue)] text-white">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6">
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

      <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 md:px-6">
        {/* KPIs */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          <CxKpiCard title="Total de Chamados" value={fmtInt(kpi.totalChamados)} sub="Marca + ID Portal" />
          <CxKpiCard title="Total de Marcas" value={fmtInt(kpi.totalMarcas)} />
          <CxKpiCard title="Total de Itens" value={fmtInt(kpi.totalItens)} sub="1 linha = 1 item" />
          <CxKpiCard title="Chamados Procedentes" value={fmtInt(kpi.procedentes)} color={GREEN} />
          <CxKpiCard title="Chamados Improcedentes" value={fmtInt(kpi.improcedentes)} color={RED} />
          <CxKpiCard
            title="% Procedência"
            value={fmtPct(kpi.procedentes, kpi.procedentes + kpi.improcedentes)}
            color={GREEN}
          />
          <CxKpiCard
            title="% Improcedência"
            value={fmtPct(kpi.improcedentes, kpi.procedentes + kpi.improcedentes)}
            color={RED}
          />
        </section>

        {/* Filtros */}
        <CxPanel title="Filtros">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
            <CxMultiSelect label="Ano" options={opts.ano} value={filters.ano} onChange={setFilter("ano")} />
            <CxMultiSelect label="Mês" options={opts.mes} value={filters.mes} onChange={setFilter("mes")} />
            <CxMultiSelect label="Marca" options={opts.marca} value={filters.marca} onChange={setFilter("marca")} />
            <CxMultiSelect label="Região" options={opts.regiao} value={filters.regiao} onChange={setFilter("regiao")} />
            <CxMultiSelect label="CD" options={opts.cd} value={filters.cd} onChange={setFilter("cd")} />
            <CxMultiSelect label="Cliente" options={opts.cliente} value={filters.cliente} onChange={setFilter("cliente")} />
            <CxMultiSelect label="Conferente" options={opts.conferente} value={filters.conferente} onChange={setFilter("conferente")} />
            <CxMultiSelect label="Modalidade" options={opts.modalidade} value={filters.modalidade} onChange={setFilter("modalidade")} />
            <CxMultiSelect label="Tipo" options={opts.tipo} value={filters.tipo} onChange={setFilter("tipo")} />
            <CxMultiSelect label="Status" options={opts.status} value={filters.status} onChange={setFilter("status")} />
            <CxMultiSelect label="Procedência" options={opts.procedencia} value={filters.procedencia} onChange={setFilter("procedencia")} />
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setFilters(emptyFilters);
                  setBusca("");
                  setPage(1);
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[var(--cx-blue)] px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <Eraser className="h-4 w-4" /> Limpar filtros
              </button>
            </div>
          </div>
        </CxPanel>

        {/* Gráficos */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <CxPanel title="Ranking de Marcas (chamados únicos)">
            <div style={{ height: Math.max(260, ranking.length * 28) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ranking} layout="vertical" margin={{ left: 24, right: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6eaef" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="marca" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [fmtInt(v), "Chamados"]} />
                  <Bar dataKey="chamados" fill={BLUE} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CxPanel>

          <CxPanel title="Procedentes x Improcedentes por Marca">
            <div style={{ height: Math.max(260, porMarcaProced.length * 30) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porMarcaProced} layout="vertical" margin={{ left: 24, right: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6eaef" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="marca" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => fmtInt(v)} />
                  <Legend />
                  <Bar dataKey="Procedente" stackId="p" fill={GREEN} />
                  <Bar dataKey="Improcedente" stackId="p" fill={RED} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CxPanel>
        </div>

        <CxPanel title="Evolução Mensal de Chamados">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolucao} margin={{ left: 8, right: 16, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6eaef" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(v: number) => [fmtInt(v), "Chamados"]} />
                <Line
                  type="monotone"
                  dataKey="chamados"
                  stroke={BLUE}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: BLUE }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CxPanel>

        {/* Tabela */}
        <CxPanel title="Detalhamento dos Itens">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--cx-muted)]" />
              <input
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setPage(1);
                }}
                placeholder="Pesquisar em todas as colunas..."
                className="w-full rounded-md border border-[var(--cx-border)] py-2 pl-8 pr-3 text-sm outline-none focus:border-[var(--cx-blue)]"
              />
            </div>
            <div className="text-xs text-[var(--cx-muted)]">
              {fmtInt(tableRows.length)} itens • {fmtInt(contarChamados(tableRows))} chamados únicos
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border border-[var(--cx-border)]">
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="bg-[var(--cx-bg)] text-left">
                  {TABLE_COLS.map((c) => (
                    <th key={c.key} className="whitespace-nowrap px-3 py-2 font-semibold">
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className="inline-flex items-center gap-1 hover:text-[var(--cx-blue)]"
                      >
                        {c.label}
                        {sortKey === c.key &&
                          (sortDir === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          ))}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={TABLE_COLS.length}
                      className="px-3 py-6 text-center text-[var(--cx-muted)]"
                    >
                      Nenhum registro encontrado.
                    </td>
                  </tr>
                )}
                {pageRows.map((r, i) => (
                  <tr
                    key={`${chamadoKey(r)}-${i}`}
                    className="border-t border-[var(--cx-border)] hover:bg-[var(--cx-bg)]"
                  >
                    {TABLE_COLS.map((c) => {
                      const v = c.get(r);
                      let text: string;
                      if (v == null || v === "") text = "-";
                      else if (c.key === "Valor") text = fmtBRL(Number(v));
                      else if (c.key === "Data")
                        text = String(v).slice(0, 10).split("-").reverse().join("/");
                      else text = String(v);
                      return (
                        <td
                          key={c.key}
                          className="max-w-[240px] truncate whitespace-nowrap px-3 py-2"
                          title={text}
                        >
                          {text}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="text-[var(--cx-muted)]">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-md border border-[var(--cx-border)] px-3 py-1.5 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-md border border-[var(--cx-border)] px-3 py-1.5 disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          </div>
        </CxPanel>
      </main>

      <footer className="border-t border-[var(--cx-border)] bg-[var(--cx-card)] py-4 text-center text-xs text-[var(--cx-muted)]">
        Base de dados extraída do Portal B2B.
      </footer>
    </div>
  );
}
