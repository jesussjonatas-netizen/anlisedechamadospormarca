REVOKE INSERT, UPDATE, DELETE ON public.solicitacoes FROM authenticated;
DROP POLICY IF EXISTS "Allow authenticated full access" ON public.solicitacoes;