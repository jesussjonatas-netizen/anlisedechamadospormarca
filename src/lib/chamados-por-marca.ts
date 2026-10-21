import type { Solicitacao } from "./auditoria-types";

/** Colunas da tabela chamados_por_marca que vêm da planilha (cabeçalho → coluna). */
export const MAPA_COLUNAS = {
  "Data de Entrada": "data_entrada",
  "Id Portal": "id_portal",
  "Número Benner": "numero_benner",
  Cliente: "cliente",
  Documento: "documento",
  "Região": "regiao",
  CD: "cd",
  NF: "nf",
  Valor: "valor",
  Modalidade: "modalidade",
  Tipo: "tipo",
  Status: "status",
  "Conferente de Expedição": "conf_expedicao",
  "Conferente de Checkout": "conf_checkout",
  "Conferente de Separação": "conf_separacao",
  "Causa Raiz": "causa_raiz",
  "No status atual": "no_status_atual",
  "Tempo em aberto": "tempo_aberto",
  CNA: "cna",
  "Código": "codigo",
  Nome: "nome",
  Marca: "marca",
  Quantidade: "quantidade",
  "Quantidade Desejada": "quantidade_desejada",
  "Quantidade a Retornar": "quantidade_a_retornar",
  "NF de Devolução": "nf_devolucao",
  "NF-e contra a Transportadora": "nfe_transportadora",
  "NF-e contra o Fabricante": "nfe_fabricante",
} as const;

export type CampoPlanilha = (typeof MAPA_COLUNAS)[keyof typeof MAPA_COLUNAS];
export const CAMPOS = Object.values(MAPA_COLUNAS) as CampoPlanilha[];
const NUMERICOS = new Set<CampoPlanilha>(["valor", "quantidade", "quantidade_desejada", "quantidade_a_retornar"]);

export type RegistroPlanilha = Record<CampoPlanilha, string | number | null> & { id_portal: string };
export type RegistroEnvio = RegistroPlanilha & { _alvo: string | null };
export type ChamadoRow = Record<string, unknown> & { id: string };

const texto = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};

const numero = (v: unknown): number | null => {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = texto(v);
  if (s === null) return null;
  const limpo = /,\d+$/.test(s) || s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  const n = Number(limpo);
  return Number.isFinite(n) ? n : null;
};

const data = (v: unknown): string | null => {
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null;
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = texto(v);
  if (!s) return null;
  const br = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (br) return `${br[3]}-${br[2]!.padStart(2, "0")}-${br[1]!.padStart(2, "0")}`;
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return iso ? iso[0] : null;
};

const chaveCabecalho = (s: string) => s.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");

/** Converte as linhas cruas da planilha em registros, achando colunas sem diferenciar maiúsculas. */
export function normalizarPlanilha(linhas: Record<string, unknown>[]) {
  const alvoPorCabecalho = new Map<string, CampoPlanilha>();
  for (const [cab, campo] of Object.entries(MAPA_COLUNAS)) alvoPorCabecalho.set(chaveCabecalho(cab), campo);

  const registros: RegistroPlanilha[] = [];
  let ignoradasSemId = 0;
  for (const linha of linhas) {
    const r: Record<string, unknown> = {};
    for (const [cab, valor] of Object.entries(linha)) {
      const campo = alvoPorCabecalho.get(chaveCabecalho(cab));
      if (campo && r[campo] === undefined) r[campo] = valor;
    }
    const id = texto(r.id_portal);
    if (!id) {
      ignoradasSemId++;
      continue;
    }
    const out = {} as Record<CampoPlanilha, string | number | null>;
    for (const campo of CAMPOS) {
      const v = r[campo];
      out[campo] = campo === "data_entrada" ? data(v) : NUMERICOS.has(campo) ? numero(v) : texto(v);
    }
    out.id_portal = id;
    registros.push(out as RegistroPlanilha);
  }
  return { registros, ignoradasSemId };
}

const comparavel = (campo: CampoPlanilha, v: unknown) => {
  if (v === null || v === undefined || v === "") return "";
  if (NUMERICOS.has(campo)) {
    const n = numero(v);
    return n === null ? "" : String(n);
  }
  if (campo === "data_entrada") return String(v).slice(0, 10);
  return String(v).trim();
};

export const chaveItem = (idPortal: unknown, codigo: unknown) => `${texto(idPortal) ?? ""}§${texto(codigo) ?? ""}`;

/**
 * Compara a planilha com a base por Id Portal + Código.
 * Com várias linhas na mesma chave, a 1ª linha do arquivo compara com a 1ª existente, a 2ª com a 2ª, etc.
 */
export function compararComBase(registros: RegistroPlanilha[], base: ChamadoRow[]) {
  const existentes = new Map<string, ChamadoRow[]>();
  for (const row of base) {
    const k = chaveItem(row.id_portal, row.codigo);
    const arr = existentes.get(k);
    if (arr) arr.push(row);
    else existentes.set(k, [row]);
  }
  const usados = new Map<string, number>();
  const envio: RegistroEnvio[] = [];
  let novos = 0;
  let atualizados = 0;
  let semAlteracao = 0;
  const chamadosAfetados = new Set<string>();

  for (const reg of registros) {
    const k = chaveItem(reg.id_portal, reg.codigo);
    const i = usados.get(k) ?? 0;
    usados.set(k, i + 1);
    const atual = existentes.get(k)?.[i];
    if (!atual) {
      novos++;
      envio.push({ ...reg, _alvo: null });
      chamadosAfetados.add(reg.id_portal);
      continue;
    }
    const diferente = CAMPOS.some((c) => comparavel(c, reg[c]) !== comparavel(c, atual[c]));
    if (diferente) {
      atualizados++;
      envio.push({ ...reg, _alvo: atual.id });
      chamadosAfetados.add(reg.id_portal);
    } else semAlteracao++;
  }
  return { novos, atualizados, semAlteracao, chamadosAfetados: chamadosAfetados.size, envio };
}

const s = (v: unknown) => (v === null || v === undefined || v === "" ? null : String(v));

/** Converte uma linha de chamados_por_marca no formato usado pelos painéis. */
export function rowToSolicitacao(row: Record<string, unknown>): Solicitacao {
  const dataEntrada = row.data_entrada ? String(row.data_entrada).slice(0, 10) : null;
  return {
    Data: dataEntrada,
    "Id Portal": s(row.id_portal),
    "Número Benner": s(row.numero_benner),
    NFD: s(row.nfd),
    Cliente: s(row.cliente),
    "Região": s(row.regiao),
    CD: s(row.cd),
    CD_Full: s(row.cd_full) ?? s(row.cd),
    NF: s(row.nf),
    Valor: row.valor != null ? Number(row.valor) : null,
    Modalidade: s(row.modalidade),
    Tipo: s(row.tipo),
    "Causa Raiz": s(row.causa_raiz),
    Status: s(row.status),
    "Entrada Devolução": s(row.entrada_devolucao),
    "Situação": s(row.situacao),
    "Status Auditoria": s(row.status_auditoria),
    "Data de validação": row.data_validacao ? String(row.data_validacao).slice(0, 10) : null,
    Validador: s(row.validador),
    "OBS REPROVAÇÃO/APROVAÇÃO:": s(row.obs_reprovacao_aprovacao),
    Ano: dataEntrada ? Number(dataEntrada.slice(0, 4)) : null,
    Marca: s(row.marca),
    Conferente: s(row.conf_expedicao),
    CNA: s(row.cna),
    "Código": s(row.codigo),
    Nome: s(row.nome),
    "Procedência": s(row.procedencia),
  };
}
