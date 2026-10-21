import { createServerFn } from "@tanstack/react-start";
import { CAMPOS, type RegistroEnvio } from "./chamados-por-marca";

function senhaConfere(digitada: string, correta: string) {
  if (digitada.length !== correta.length) return false;
  let diff = 0;
  for (let i = 0; i < correta.length; i++) diff |= digitada.charCodeAt(i) ^ correta.charCodeAt(i);
  return diff === 0;
}

function validar(input: unknown): { senha: string; registros: RegistroEnvio[] } {
  const d = input as { senha?: unknown; registros?: unknown };
  if (typeof d?.senha !== "string" || !Array.isArray(d.registros)) throw new Error("Dados inválidos.");
  const registros = d.registros.map((r) => {
    const o = r as Record<string, unknown>;
    if (typeof o.id_portal !== "string" || o.id_portal.trim() === "") throw new Error("Registro sem Id Portal.");
    const limpo: Record<string, unknown> = { _alvo: typeof o._alvo === "string" ? o._alvo : null };
    for (const c of CAMPOS) {
      const v = o[c];
      limpo[c] = v === undefined || v === null ? null : typeof v === "number" ? v : String(v);
    }
    return limpo as RegistroEnvio;
  });
  return { senha: d.senha, registros };
}

/** Grava novos e atualizados em chamados_por_marca numa única transação, após validar a senha. */
export const importarChamadosPorMarca = createServerFn({ method: "POST" })
  .inputValidator(validar)
  .handler(async ({ data }) => {
    const correta = process.env["IMPORT_CHAMADOS_MARCA_SENHA"];
    if (!correta) throw new Error("A senha de importação ainda não foi configurada.");
    if (!senhaConfere(data.senha, correta)) throw new Error("Senha incorreta.");
    if (data.registros.length === 0) throw new Error("Nada novo ou atualizado para gravar.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: res, error } = await supabaseAdmin.rpc("importar_chamados_por_marca", {
      _rows: data.registros as never,
    });
    if (error) {
      console.error("importar_chamados_por_marca", error);
      throw new Error(`Falha ao gravar: ${error.message}. Nada foi alterado na base.`);
    }
    return res as { inseridos: number; atualizados: number; atualizado_em: string };
  });
