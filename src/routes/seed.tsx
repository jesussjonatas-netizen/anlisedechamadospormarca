import { createFileRoute } from "@tanstack/react-router";
import { seedFromJsonFile } from "@/lib/solicitacoes.functions";

export const Route = createFileRoute("/seed")({
  loader: async () => {
    const result = await seedFromJsonFile();
    return result;
  },
  component: () => <div>Seed complete</div>,
});
