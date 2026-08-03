import { createFileRoute } from "@tanstack/react-router";
import { solicitacoesQueryOptions } from "@/lib/solicitacoes-queries";
import ChamadosPorMarca from "@/components/chamados-marca-dashboard";

export const Route = createFileRoute("/chamados-marca")({
  head: () => ({
    meta: [
      { title: "Análise de Chamados por Marca | Rede ANCORA" },
      {
        name: "description",
        content:
          "Dashboard corporativo dos chamados de Crossdocking da Rede ANCORA: procedência, ranking de marcas e itens, evolução e exportação.",
      },
      { property: "og:title", content: "Análise de Chamados por Marca | Rede ANCORA" },
      {
        property: "og:description",
        content:
          "Dashboard corporativo dos chamados de Crossdocking da Rede ANCORA: procedência, ranking de marcas e itens, evolução e exportação.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  ssr: false,

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

