import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { ChamadoRow } from "./chamados-por-marca";

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(init?.headers);
    if (supabaseKey.startsWith("sb_") && headers.get("Authorization") === `Bearer ${supabaseKey}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

/** Lê toda a base chamados_por_marca (somente leitura pública) e a data da última atualização. */
export const getSolicitacoes = createServerFn({ method: "GET" }).handler(async () => {
  const supabaseKey = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const supabase = createClient(process.env["SUPABASE_URL"]!, supabaseKey, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: { fetch: createSupabaseFetch(supabaseKey) },
  });
  const raw: ChamadoRow[] = [];
  const pageSize = 1000;
  let start = 0;
  while (true) {
    const { data, error } = await supabase
      .from("chamados_por_marca")
      .select("*")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(start, start + pageSize - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    raw.push(...(data as unknown as ChamadoRow[]));
    if (data.length < pageSize) break;
    start += pageSize;
  }
  const { data: meta } = await supabase.from("chamados_por_marca_meta").select("atualizado_em").eq("id", 1).maybeSingle();
  return { raw, lastUpdate: meta?.atualizado_em ?? new Date().toISOString() };
});
