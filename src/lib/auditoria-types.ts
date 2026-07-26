export interface Solicitacao {
  Data: string | null;
  "Id Portal": number | string | null;
  "Número Benner": number | string | null;
  NFD: number | string | null;
  Cliente: string | null;
  "Região": string | null;
  CD: string | null;
  CD_Full: string | null;
  NF: number | string | null;
  Valor: number | null;
  Modalidade: string | null;
  Tipo: string | null;
  "Causa Raiz": string | null;
  Status: string | null;
  "Entrada Devolução": string | number | null;
  "Situação": string | number | null;
  "Status Auditoria": string | null;
  "Data de validação": string | null;
  Validador: string | number | null;
  "OBS REPROVAÇÃO/APROVAÇÃO:": string | null;
  Ano: number | null;
}

export const STATUS_LIST = [
  "Pago",
  "Reprovado",
  "Aprovado",
  "Aguardando pagamento",
  "Revisão necessária",
] as const;

export type StatusKey = (typeof STATUS_LIST)[number];

export const STATUS_COLORS: Record<StatusKey, string> = {
  Pago: "#3B6FE0",
  Reprovado: "#E63946",
  Aprovado: "#2ECC71",
  "Aguardando pagamento": "#F5A623",
  "Revisão necessária": "#9B59B6",
};
