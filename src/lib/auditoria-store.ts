import { create } from "zustand";
import type { Solicitacao } from "./auditoria-types";
import rawData from "@/data/solicitacoes.json";

interface DataStore {
  rows: Solicitacao[];
  lastUpdate: Date;
  setRows: (rows: Solicitacao[]) => void;
}

// Zustand is not installed; use a simple module-level store with React hook.
import { useSyncExternalStore } from "react";

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _unused = DataStore;
export { create };
