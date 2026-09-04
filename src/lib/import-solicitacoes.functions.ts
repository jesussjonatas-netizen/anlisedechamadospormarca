import { createServerFn } from "@tanstack/react-start";

export type ImportRow = {
  data: string | null;
  id_portal: string;
  numero_benner: string | null;
  cliente: string | null;
  regiao: string | null;
  cd: string | null;
  cd_full: string | null;
  nf: string | null;
  valor: number | null;
  modalidade: string | null;
  tipo: string | null;
  status: string | null;
  conferente: string | null;
  causa_raiz: string | null;
  cna: string | null;
  codigo: string | null;
  nome: string | null;
  marca: string | null;
  ano: number | null;
};

const SENHA = "chamadosbr";

/** Grava os chamados importados: substitui apenas os Id Portal presentes no arquivo. */
export const importarSolicitacoes = createServerFn({ method: "POST" })
  .inputValidator((data: { senha: string; rows: ImportRow[] }) => data)
  .handler(async ({ data }) => {
    if (data.senha !== SENHA) {
      throw new Error("Senha incorreta.");
    }
    if (!Array.isArray(data.rows) || data.rows.length === 0) {
      throw new Error("Nenhuma linha válida para importar.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const ids = Array.from(new Set(data.rows.map((r) => r.id_portal).filter(Boolean)));

    // Remove somente os chamados que vieram no arquivo (upsert por Id Portal).
    for (let i = 0; i < ids.length; i += 200) {
      const { error } = await supabaseAdmin
        .from("solicitacoes")
        .delete()
        .in("id_portal", ids.slice(i, i + 200));
      if (error) throw new Error(error.message);
    }

    const batch = 500;
    for (let i = 0; i < data.rows.length; i += batch) {
      const { error } = await supabaseAdmin.from("solicitacoes").insert(data.rows.slice(i, i + batch));
      if (error) throw new Error(error.message);
    }

    return { chamados: ids.length, itens: data.rows.length };
  });
