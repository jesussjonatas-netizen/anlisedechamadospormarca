import { useSyncExternalStore } from "react";
import type { Solicitacao } from "./auditoria-types";
import rawData from "@/data/solicitacoes.json";

const listeners = new Set<() => void>();
let state: { rows: Solicitacao[]; lastUpdate: Date } = {
  rows: rawData as unknown as Solicitacao[],
  lastUpdate: new Date(),
};

// Stable snapshot used during SSR and the first client render (hydration),
// so the "Última atualização" timestamp does not mismatch between server
// and client. After hydration, useSyncExternalStore switches to getSnapshot.
const serverSnapshot = {
  rows: rawData as unknown as Solicitacao[],
  lastUpdate: new Date(0),
};

function emit() {
  listeners.forEach((l) => l());
}

export function setRows(rows: Solicitacao[]) {
  state = { rows, lastUpdate: new Date() };
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return serverSnapshot;
}

export function useAuditoriaData() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
