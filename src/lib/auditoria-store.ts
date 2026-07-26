import { useSyncExternalStore } from "react";
import type { Solicitacao } from "./auditoria-types";
import rawData from "@/data/solicitacoes.json";

const listeners = new Set<() => void>();
let state: { rows: Solicitacao[]; lastUpdate: Date } = {
  rows: rawData as unknown as Solicitacao[],
  lastUpdate: new Date(),
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

export function useAuditoriaData() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
