import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ancoraLogo from "@/assets/ancora-logo.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acesso restrito | Rede ANCORA" },
      {
        name: "description",
        content:
          "Entre com sua conta corporativa para acessar o painel de análise de chamados da Rede ANCORA.",
      },
      { property: "og:title", content: "Acesso restrito | Rede ANCORA" },
      {
        property: "og:description",
        content: "Autenticação necessária para consultar os chamados de Crossdocking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setAviso(null);
    setCarregando(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        navigate({ to: "/" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        setAviso("Cadastro realizado. Verifique seu e-mail para confirmar o acesso.");
      }
    } catch {
      setErro("Não foi possível autenticar. Verifique as credenciais e tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA] p-6">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <img src={ancoraLogo} alt="Rede ANCORA" className="mb-6 h-10 object-contain" />
        <h1 className="text-xl font-semibold text-[#083B63]">Acesso restrito</h1>
        <p className="mt-1 text-sm text-slate-500">
          Entre com sua conta corporativa para visualizar os chamados.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              E-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#083B63]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Senha
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#083B63]"
            />
          </div>
          {erro ? <p className="text-sm text-[#CE0E2D]">{erro}</p> : null}
          {aviso ? <p className="text-sm text-[#3DAE2B]">{aviso}</p> : null}
          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-md bg-[#083B63] py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {carregando ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-4 w-full text-center text-sm text-[#083B63] underline"
        >
          {mode === "login" ? "Criar uma conta" : "Já tenho conta"}
        </button>
      </div>
    </div>
  );
}
