import { queryOptions } from "@tanstack/react-query";
import { getSolicitacoes } from "./solicitacoes.functions";
import { rowToSolicitacao } from "./chamados-por-marca";

export const solicitacoesQueryOptions = queryOptions({
  queryKey: ["solicitacoes"],
  queryFn: async () => {
    const r = await getSolicitacoes();
    return { raw: r.raw, rows: r.raw.map(rowToSolicitacao), lastUpdate: r.lastUpdate };
  },
  staleTime: 60_000,
});
