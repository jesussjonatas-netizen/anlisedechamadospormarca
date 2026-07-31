import { queryOptions } from "@tanstack/react-query";
import { getSolicitacoes } from "./solicitacoes.functions";

export const solicitacoesQueryOptions = queryOptions({
  queryKey: ["solicitacoes"],
  queryFn: () => getSolicitacoes(),
  staleTime: 60_000,
});
