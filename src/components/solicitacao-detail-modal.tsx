import type { Solicitacao } from "@/lib/auditoria-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  });

const statusClasses: Record<string, string> = {
  Pago: "bg-blue-500 hover:bg-blue-500",
  Reprovado: "bg-red-500 hover:bg-red-500",
  Aprovado: "bg-green-500 hover:bg-green-500",
  "Aguardando pagamento": "bg-amber-500 hover:bg-amber-500",
  "Revisão necessária": "bg-purple-500 hover:bg-purple-500",
  "Aguardando Auditoria": "bg-yellow-500 hover:bg-yellow-500",
};

interface SolicitacaoDetailModalProps {
  row: Solicitacao | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SolicitacaoDetailModal({
  row,
  open,
  onOpenChange,
}: SolicitacaoDetailModalProps) {
  if (!row) return null;

  const status = row["Status Auditoria"] || "Aguardando Auditoria";
  const badgeClass = statusClasses[status] || "bg-gray-500 hover:bg-gray-500";

  const fields = [
    { label: "Id Portal", value: row["Id Portal"] },
    { label: "Número Benner", value: row["Número Benner"] },
    { label: "NFD", value: row.NFD },
    { label: "Cliente", value: row.Cliente },
    { label: "Região", value: row["Região"] },
    { label: "CD", value: row.CD },
    { label: "CD Completo", value: row.CD_Full },
    { label: "NF", value: row.NF },
    { label: "Valor", value: row.Valor != null ? fmtBRL(Number(row.Valor)) : "-" },
    { label: "Modalidade", value: row.Modalidade },
    { label: "Tipo", value: row.Tipo },
    { label: "Causa Raiz", value: row["Causa Raiz"] },
    { label: "Data", value: row.Data ? new Date(row.Data).toLocaleDateString("pt-BR") : "-" },
    { label: "Ano", value: row.Ano },
    { label: "Entrada Devolução", value: row["Entrada Devolução"] },
    { label: "Situação", value: row["Situação"] },
    { label: "Status", value: row.Status },
    { label: "Validador", value: row.Validador },
    { label: "Data de Validação", value: row["Data de validação"] ? new Date(row["Data de validação"]).toLocaleDateString("pt-BR") : "-" },
    { label: "OBS Reprovação/Aprovação", value: row["OBS REPROVAÇÃO/APROVAÇÃO:"] },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white">Detalhes da Solicitação</DialogTitle>
          <DialogDescription>
            Informações completas do chamado {row["Id Portal"] ? `#${row["Id Portal"]}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 overflow-y-auto pr-1">
          <div className="mb-4">
            <Badge className={`${badgeClass} text-white`}>{status}</Badge>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.label} className="rounded-md border border-border bg-secondary/50 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {f.label}
                </div>
                <div className="mt-1 break-words text-sm text-foreground">
                  {f.value == null || f.value === "" ? "-" : String(f.value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
