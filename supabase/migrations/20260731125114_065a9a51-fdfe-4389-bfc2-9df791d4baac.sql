CREATE TABLE public.solicitacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date,
  id_portal text,
  numero_benner text,
  nfd text,
  cliente text,
  regiao text,
  cd text,
  cd_full text,
  nf text,
  valor numeric,
  modalidade text,
  tipo text,
  causa_raiz text,
  status text,
  entrada_devolucao text,
  situacao text,
  status_auditoria text,
  data_validacao date,
  validador text,
  obs_reprovacao_aprovacao text,
  ano integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.solicitacoes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.solicitacoes TO authenticated;
GRANT ALL ON public.solicitacoes TO service_role;

ALTER TABLE public.solicitacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read"
ON public.solicitacoes
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow authenticated full access"
ON public.solicitacoes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);