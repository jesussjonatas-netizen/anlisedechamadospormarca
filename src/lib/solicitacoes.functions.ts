import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Solicitacao } from "./auditoria-types";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    if (isNewSupabaseApiKey(supabaseKey) && headers.get("Authorization") === `Bearer ${supabaseKey}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function dbToSolicitacao(row: Record<string, unknown>): Solicitacao {
  return {
    Data: row.data ? String(row.data).slice(0, 10) : null,
    "Id Portal": row.id_portal != null ? String(row.id_portal) : null,
    "Número Benner": row.numero_benner != null ? String(row.numero_benner) : null,
    NFD: row.nfd != null ? String(row.nfd) : null,
    Cliente: row.cliente ? String(row.cliente) : null,
    "Região": row.regiao ? String(row.regiao) : null,
    CD: row.cd ? String(row.cd) : null,
    CD_Full: row.cd_full ? String(row.cd_full) : null,
    NF: row.nf != null ? String(row.nf) : null,
    Valor: row.valor != null ? Number(row.valor) : null,
    Modalidade: row.modalidade ? String(row.modalidade) : null,
    Tipo: row.tipo ? String(row.tipo) : null,
    "Causa Raiz": row.causa_raiz ? String(row.causa_raiz) : null,
    Status: row.status ? String(row.status) : null,
    "Entrada Devolução": row.entrada_devolucao != null ? String(row.entrada_devolucao) : null,
    "Situação": row.situacao != null ? String(row.situacao) : null,
    "Status Auditoria": row.status_auditoria ? String(row.status_auditoria) : null,
    "Data de validação": row.data_validacao ? String(row.data_validacao).slice(0, 10) : null,
    Validador: row.validador != null ? String(row.validador) : null,
    "OBS REPROVAÇÃO/APROVAÇÃO:": row.obs_reprovacao_aprovacao ? String(row.obs_reprovacao_aprovacao) : null,
    Ano: row.ano != null ? Number(row.ano) : null,
    Marca: row.marca ? String(row.marca) : null,
    Conferente: row.conferente ? String(row.conferente) : null,
    CNA: row.cna != null ? String(row.cna) : null,
    "Código": row.codigo != null ? String(row.codigo) : null,
    Nome: row.nome ? String(row.nome) : null,
    "Procedência": row.procedencia ? String(row.procedencia) : null,
  };
}

export const getSolicitacoes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
  const allRows: Record<string, unknown>[] = [];
  const pageSize = 1000;
  let start = 0;
  while (true) {
    const { data, error } = await context.supabase
      .from("solicitacoes")
      .select("*")
      .range(start, start + pageSize - 1)
      .order("id", { ascending: true });
    if (error) throw error;
    if (!data || data.length === 0) break;
    allRows.push(...(data as Record<string, unknown>[]));
    if (data.length < pageSize) break;
    start += pageSize;
  }

  return {
    rows: allRows.map(dbToSolicitacao),
    lastUpdate: new Date().toISOString(),
  };
});

export const seedSolicitacoes = createServerFn({ method: "POST" })
  .inputValidator((data: { rows: Solicitacao[] }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error: deleteError } = await supabaseAdmin.from("solicitacoes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (deleteError) throw deleteError;

    const inserts = data.rows.map((r) => ({
      data: r.Data ? String(r.Data).slice(0, 10) : null,
      id_portal: r["Id Portal"] != null ? String(r["Id Portal"]) : null,
      numero_benner: r["Número Benner"] != null ? String(r["Número Benner"]) : null,
      nfd: r.NFD != null ? String(r.NFD) : null,
      cliente: r.Cliente,
      regiao: r["Região"],
      cd: r.CD,
      cd_full: r.CD_Full,
      nf: r.NF != null ? String(r.NF) : null,
      valor: r.Valor,
      modalidade: r.Modalidade,
      tipo: r.Tipo,
      causa_raiz: r["Causa Raiz"],
      status: r.Status,
      entrada_devolucao: r["Entrada Devolução"] != null ? String(r["Entrada Devolução"]) : null,
      situacao: r["Situação"] != null ? String(r["Situação"]) : null,
      status_auditoria: r["Status Auditoria"],
      data_validacao: r["Data de validação"] ? String(r["Data de validação"]).slice(0, 10) : null,
      validador: r.Validador != null ? String(r.Validador) : null,
      obs_reprovacao_aprovacao: r["OBS REPROVAÇÃO/APROVAÇÃO:"],
      ano: r.Ano,
      marca: r.Marca ?? null,
      conferente: r.Conferente ?? null,
      cna: r.CNA != null ? String(r.CNA) : null,
      codigo: r["Código"] != null ? String(r["Código"]) : null,
      nome: r.Nome ?? null,
      procedencia: r["Procedência"] ?? null,
    }));

    const { error } = await supabaseAdmin.from("solicitacoes").insert(inserts);
    if (error) throw error;

    return { inserted: inserts.length };
  });

export const seedFromJsonFile = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { default: rawRows } = await import("@/data/solicitacoes.json");

  const rows = (rawRows as Solicitacao[]).map((r) => ({
    data: r.Data ? String(r.Data).slice(0, 10) : null,
    id_portal: r["Id Portal"] != null ? String(r["Id Portal"]) : null,
    numero_benner: r["Número Benner"] != null ? String(r["Número Benner"]) : null,
    nfd: r.NFD != null ? String(r.NFD) : null,
    cliente: r.Cliente,
    regiao: r["Região"],
    cd: r.CD,
    cd_full: r.CD_Full,
    nf: r.NF != null ? String(r.NF) : null,
    valor: r.Valor,
    modalidade: r.Modalidade,
    tipo: r.Tipo,
    causa_raiz: r["Causa Raiz"],
    status: r.Status,
    entrada_devolucao: r["Entrada Devolução"] != null ? String(r["Entrada Devolução"]) : null,
    situacao: r["Situação"] != null ? String(r["Situação"]) : null,
    status_auditoria: r["Status Auditoria"],
    data_validacao: r["Data de validação"] ? String(r["Data de validação"]).slice(0, 10) : null,
    validador: r.Validador != null ? String(r.Validador) : null,
    obs_reprovacao_aprovacao: r["OBS REPROVAÇÃO/APROVAÇÃO:"],
    ano: r.Ano,
    marca: r.Marca ?? null,
    conferente: r.Conferente ?? null,
    cna: r.CNA != null ? String(r.CNA) : null,
    codigo: r["Código"] != null ? String(r["Código"]) : null,
    nome: r.Nome ?? null,
    procedencia: r["Procedência"] ?? null,
  }));

  const { error: deleteError } = await supabaseAdmin.from("solicitacoes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (deleteError) throw deleteError;

  const batchSize = 500;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabaseAdmin.from("solicitacoes").insert(batch);
    if (error) throw error;
  }

  return { inserted: rows.length };
});
