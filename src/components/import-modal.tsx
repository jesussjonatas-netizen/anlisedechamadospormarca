import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, CheckCircle2, Loader2, Upload, X } from "lucide-react";
import type { Solicitacao } from "@/lib/auditoria-types";
import { importarSolicitacoes, type ImportRow } from "@/lib/import-solicitacoes.functions";

type Etapa = "leitura" | "comparacao" | "confirmacao" | "sucesso";

const txt = (v: unknown) => {
  const s = String(v ?? "").trim();
  return s === "" || s === "-" ? null : s;
};

const num = (v: unknown) => {
  const s = txt(v);
  if (s === null) return null;
  const n = Number(String(s).replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

/** Status descartados na leitura do arquivo. */
const STATUS_IRRELEVANTE = new Set(["", "-", "n/a", "na", "null", "sem status"]);

function toISODate(v: unknown): string | null {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = txt(v);
  if (!s) return null;
  const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

type Leitura = {
  rows: ImportRow[];
  totalLinhas: number;
  descartadasSemId: number;
  descartadasStatus: number;
  arquivo: string;
};

type Comparacao = { novos: number; atualizados: number; semAlteracao: number };

/** Assinatura de um chamado, usada para detectar alterações. */
function assinatura(itens: { status: unknown; codigo: unknown; nome: unknown; valor: unknown }[]) {
  return itens
    .map((i) => `${txt(i.status) ?? ""}|${txt(i.codigo) ?? ""}|${txt(i.nome) ?? ""}|${num(i.valor) ?? ""}`)
    .sort()
    .join("#");
}

export function ImportModal({ existentes, onClose }: { existentes: Solicitacao[]; onClose: () => void }) {
  const [etapa, setEtapa] = useState<Etapa>("leitura");
  const [leitura, setLeitura] = useState<Leitura | null>(null);
  const [comp, setComp] = useState<Comparacao | null>(null);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<{ chamados: number; itens: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const gravar = useServerFn(importarSolicitacoes);

  const lerArquivo = async (file: File) => {
    setErro(null);
    setCarregando(true);
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]!]!;
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });

      let semId = 0;
      let statusRuim = 0;
      const rows: ImportRow[] = [];

      for (const r of raw) {
        const idPortal = txt(r["Id Portal"] ?? r["ID Portal"] ?? r["id_portal"]);
        if (!idPortal) {
          semId++;
          continue;
        }
        const status = txt(r["Status"]);
        if (!status || STATUS_IRRELEVANTE.has(status.toLowerCase())) {
          statusRuim++;
          continue;
        }
        const data = toISODate(r["Data de Entrada"] ?? r["Data"]);
        rows.push({
          data,
          id_portal: idPortal,
          numero_benner: txt(r["Número Benner"]),
          cliente: txt(r["Cliente"]),
          regiao: txt(r["Região"]),
          cd: txt(r["CD"]),
          cd_full: txt(r["CD"]),
          nf: txt(r["NF"]),
          valor: num(r["Valor"]),
          modalidade: txt(r["Modalidade"]),
          tipo: txt(r["Tipo"]),
          status,
          conferente: txt(r["Conferente de Expedição"] ?? r["Conferente"]),
          causa_raiz: txt(r["Causa Raiz"]),
          cna: txt(r["CNA"]),
          codigo: txt(r["Código"]),
          nome: txt(r["Nome"]),
          marca: txt(r["Marca"]),
          ano: data ? Number(data.slice(0, 4)) : null,
        });
      }

      if (rows.length === 0) throw new Error("O arquivo não possui linhas válidas.");

      setLeitura({
        rows,
        totalLinhas: raw.length,
        descartadasSemId: semId,
        descartadasStatus: statusRuim,
        arquivo: file.name,
      });
      setEtapa("comparacao");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível ler o arquivo.");
    } finally {
      setCarregando(false);
    }
  };

  const comparar = () => {
    if (!leitura) return;
    const base = new Map<string, { status: unknown; codigo: unknown; nome: unknown; valor: unknown }[]>();
    for (const r of existentes) {
      const id = txt(r["Id Portal"]);
      if (!id) continue;
      const arr = base.get(id) ?? [];
      arr.push({ status: r.Status, codigo: r["Código"], nome: r.Nome, valor: r.Valor });
      base.set(id, arr);
    }

    const arquivo = new Map<string, { status: unknown; codigo: unknown; nome: unknown; valor: unknown }[]>();
    for (const r of leitura.rows) {
      const arr = arquivo.get(r.id_portal) ?? [];
      arr.push({ status: r.status, codigo: r.codigo, nome: r.nome, valor: r.valor });
      arquivo.set(r.id_portal, arr);
    }

    let novos = 0;
    let atualizados = 0;
    let semAlteracao = 0;
    for (const [id, itens] of arquivo) {
      const atual = base.get(id);
      if (!atual) novos++;
      else if (assinatura(atual) === assinatura(itens)) semAlteracao++;
      else atualizados++;
    }
    setComp({ novos, atualizados, semAlteracao });
    setEtapa("confirmacao");
  };

  const confirmar = async () => {
    if (!leitura) return;
    setErro(null);
    if (senha !== "chamadosbr") {
      setErro("Senha incorreta.");
      return;
    }
    setCarregando(true);
    try {
      let chamados = 0;
      let itens = 0;
      const lote = 4000;
      for (let i = 0; i < leitura.rows.length; i += lote) {
        const res = await gravar({ data: { senha, rows: leitura.rows.slice(i, i + lote) } });
        chamados += res.chamados;
        itens += res.itens;
      }
      setResultado({ chamados, itens });
      setEtapa("sucesso");
      await queryClient.invalidateQueries({ queryKey: ["solicitacoes"] });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao gravar os dados.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-xl bg-[var(--cx-card)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--cx-border)] px-5 py-3">
          <h2 className="text-base font-bold text-[var(--cx-blue)]">Importar base de chamados</h2>
          <button type="button" aria-label="Fechar" onClick={onClose} className="opacity-60 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4 text-sm">
          <ol className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
            {(["leitura", "comparacao", "confirmacao"] as Etapa[]).map((e, i) => (
              <li
                key={e}
                className={`rounded-full px-3 py-1 ${
                  etapa === e ? "bg-[var(--cx-blue)] text-white" : "bg-[var(--cx-bg)] text-[var(--cx-blue)] opacity-70"
                }`}
              >
                {i + 1}. {e === "leitura" ? "Ler arquivo" : e === "comparacao" ? "Comparar" : "Confirmar"}
              </li>
            ))}
          </ol>

          {etapa === "leitura" && (
            <div className="space-y-3">
              <p className="opacity-80">Selecione o arquivo Excel (.xlsx) ou CSV com os chamados.</p>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void lerArquivo(f);
                }}
                className="w-full rounded-md border border-[var(--cx-border)] p-2"
              />
            </div>
          )}

          {etapa === "comparacao" && leitura && (
            <div className="space-y-2">
              <div className="font-semibold">{leitura.arquivo}</div>
              <ul className="space-y-1 opacity-80">
                <li>Linhas lidas: {leitura.totalLinhas.toLocaleString("pt-BR")}</li>
                <li>Linhas válidas: {leitura.rows.length.toLocaleString("pt-BR")}</li>
                <li>Descartadas sem Id Portal: {leitura.descartadasSemId.toLocaleString("pt-BR")}</li>
                <li>Descartadas por status irrelevante: {leitura.descartadasStatus.toLocaleString("pt-BR")}</li>
              </ul>
              <button
                type="button"
                onClick={comparar}
                className="w-full rounded-md bg-[var(--cx-blue)] px-3 py-2 font-semibold text-white"
              >
                Comparar com a base atual
              </button>
            </div>
          )}

          {etapa === "confirmacao" && comp && leitura && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { l: "Novos", v: comp.novos },
                  { l: "Atualizados", v: comp.atualizados },
                  { l: "Sem alteração", v: comp.semAlteracao },
                ].map((c) => (
                  <div key={c.l} className="rounded-md border border-[var(--cx-border)] p-2">
                    <div className="text-lg font-bold text-[var(--cx-blue)]">{c.v.toLocaleString("pt-BR")}</div>
                    <div className="text-xs opacity-70">{c.l}</div>
                  </div>
                ))}
              </div>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide opacity-70">Senha</span>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[var(--cx-border)] px-3 py-2"
                  placeholder="Digite a senha para confirmar"
                />
              </label>
              <button
                type="button"
                disabled={carregando}
                onClick={() => void confirmar()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[var(--cx-green)] px-3 py-2 font-semibold text-white disabled:opacity-60"
              >
                {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Confirmar e gravar
              </button>
            </div>
          )}

          {etapa === "sucesso" && resultado && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-semibold text-[var(--cx-green)]">
                <CheckCircle2 className="h-5 w-5" /> Importação concluída
              </div>
              <p className="opacity-80">
                {resultado.chamados.toLocaleString("pt-BR")} chamados e {resultado.itens.toLocaleString("pt-BR")} itens
                gravados.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-md bg-[var(--cx-blue)] px-3 py-2 font-semibold text-white"
              >
                Fechar
              </button>
            </div>
          )}

          {carregando && etapa === "leitura" && (
            <div className="flex items-center gap-2 opacity-70">
              <Loader2 className="h-4 w-4 animate-spin" /> Lendo arquivo...
            </div>
          )}

          {erro && (
            <div className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 p-2 text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ImportModal;
