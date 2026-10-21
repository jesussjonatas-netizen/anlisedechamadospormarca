import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, CheckCircle2, Loader2, Upload, X } from "lucide-react";
import { compararComBase, normalizarPlanilha, type ChamadoRow } from "@/lib/chamados-por-marca";
import { importarChamadosPorMarca } from "@/lib/import-solicitacoes.functions";

type Analise = ReturnType<typeof compararComBase> & { ignoradasSemId: number; arquivo: string };

export function ImportModal({ existentes, onClose }: { existentes: ChamadoRow[]; onClose: () => void }) {
  const [analise, setAnalise] = useState<Analise | null>(null);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<{ inseridos: number; atualizados: number } | null>(null);
  const queryClient = useQueryClient();
  const gravar = useServerFn(importarChamadosPorMarca);

  const lerArquivo = async (file: File) => {
    setErro(null);
    setCarregando(true);
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]!]!;
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });
      const { registros, ignoradasSemId } = normalizarPlanilha(raw);
      if (registros.length === 0) throw new Error("O arquivo não possui linhas com Id Portal.");
      setAnalise({ ...compararComBase(registros, existentes), ignoradasSemId, arquivo: file.name });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível ler o arquivo.");
    } finally {
      setCarregando(false);
    }
  };

  const confirmar = async () => {
    if (!analise) return;
    setErro(null);
    setCarregando(true);
    try {
      const res = await gravar({ data: { senha, registros: analise.envio } });
      setResultado(res);
      await queryClient.invalidateQueries({ queryKey: ["solicitacoes"] });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao gravar os dados.");
    } finally {
      setCarregando(false);
    }
  };

  const nadaParaGravar = !analise || analise.envio.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-xl bg-[var(--cx-card)] text-[var(--cx-text,inherit)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--cx-border)] px-5 py-3">
          <h2 className="text-base font-bold text-[var(--cx-blue)]">Importar base de chamados</h2>
          <button type="button" aria-label="Fechar" onClick={onClose} className="opacity-60 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4 text-sm">
          {resultado ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-semibold text-[var(--cx-green)]">
                <CheckCircle2 className="h-5 w-5" /> Base atualizada
              </div>
              <p className="opacity-80">
                {resultado.inseridos.toLocaleString("pt-BR")} itens novos e {resultado.atualizados.toLocaleString("pt-BR")} atualizados.
              </p>
              <button type="button" onClick={onClose} className="w-full rounded-md bg-[var(--cx-blue)] px-3 py-2 font-semibold text-white">
                Fechar
              </button>
            </div>
          ) : !analise ? (
            <div className="space-y-3">
              <p className="opacity-80">Selecione o arquivo Excel (.xlsx) ou CSV. A primeira aba será lida.</p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                disabled={carregando}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void lerArquivo(f);
                }}
                className="w-full rounded-md border border-[var(--cx-border)] p-2"
              />
              {carregando && (
                <div className="flex items-center gap-2 opacity-70">
                  <Loader2 className="h-4 w-4 animate-spin" /> Lendo e comparando...
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="font-semibold">{analise.arquivo}</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { l: "Novos", v: analise.novos },
                  { l: "Atualizados", v: analise.atualizados },
                  { l: "Sem alteração", v: analise.semAlteracao },
                ].map((c) => (
                  <div key={c.l} className="rounded-md border border-[var(--cx-border)] p-2">
                    <div className="text-lg font-bold text-[var(--cx-blue)]">{c.v.toLocaleString("pt-BR")}</div>
                    <div className="text-xs opacity-70">{c.l} (itens)</div>
                  </div>
                ))}
              </div>
              <ul className="space-y-1 opacity-80">
                <li>Chamados (Id Portal) com item novo ou atualizado: {analise.chamadosAfetados.toLocaleString("pt-BR")}</li>
                <li>Linhas ignoradas sem Id Portal: {analise.ignoradasSemId.toLocaleString("pt-BR")}</li>
              </ul>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide opacity-70">Senha</span>
                <input
                  type="password"
                  autoComplete="off"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[var(--cx-border)] px-3 py-2"
                  placeholder="Digite a senha para confirmar"
                />
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={onClose} className="flex-1 rounded-md border border-[var(--cx-border)] px-3 py-2 font-semibold">
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={carregando || nadaParaGravar || senha === ""}
                  onClick={() => void confirmar()}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-[var(--cx-green)] px-3 py-2 font-semibold text-white disabled:opacity-60"
                >
                  {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Confirmar e atualizar
                </button>
              </div>
            </div>
          )}

          {erro && (
            <div className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 p-2 text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ImportModal;
