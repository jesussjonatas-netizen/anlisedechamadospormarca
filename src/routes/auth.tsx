import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ancoraLogo from "@/assets/ancora-logo.png";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Acesso | Análise de Chamados Rede ANCORA" },
      {
        name: "description",
        content: "Faça login para acessar o dashboard de auditoria de chamados da Rede ANCORA.",
      },
      { property: "og:title", content: "Acesso | Análise de Chamados Rede ANCORA" },
      {
        property: "og:description",
        content: "Faça login para acessar o dashboard de auditoria de chamados da Rede ANCORA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/chamados-marca" });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setMsg(null);
    setCarregando(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        navigate({ to: "/chamados-marca" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { emailRedirectTo: `${window.location.origin}/chamados-marca` },
        });
        if (error) throw error;
        setMsg("Conta criada. Verifique seu e-mail para confirmar o acesso.");
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível concluir a operação.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F1F4F8] px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <img src={ancoraLogo} alt="Rede ANCORA" className="mb-6 h-9 object-contain" />
        <h1 className="text-lg font-semibold text-[#083B63]">Acesso ao dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Entre com sua conta corporativa para consultar os chamados.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="text-xs font-medium text-slate-600">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#083B63]"
            />
          </div>
          <div>
            <label htmlFor="senha" className="text-xs font-medium text-slate-600">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              required
              minLength={6}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#083B63]"
            />
          </div>

          {erro && <p className="text-sm text-[#CE0E2D]">{erro}</p>}
          {msg && <p className="text-sm text-[#3DAE2B]">{msg}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-md bg-[#083B63] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {carregando ? "Aguarde..." : modo === "entrar" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setModo(modo === "entrar" ? "criar" : "entrar");
            setErro(null);
            setMsg(null);
          }}
          className="mt-4 w-full text-center text-xs text-slate-500 underline-offset-2 hover:underline"
        >
          {modo === "entrar" ? "Não tem conta? Criar acesso" : "Já tenho conta. Entrar"}
        </button>
      </div>
    </main>
  );
}
