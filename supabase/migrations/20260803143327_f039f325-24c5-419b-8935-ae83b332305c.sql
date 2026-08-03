DROP POLICY IF EXISTS "Allow public read" ON public.solicitacoes;
REVOKE ALL ON public.solicitacoes FROM anon;
GRANT SELECT ON public.solicitacoes TO authenticated;
GRANT ALL ON public.solicitacoes TO service_role;
CREATE POLICY "Authenticated users can read solicitacoes"
ON public.solicitacoes
FOR SELECT
TO authenticated
USING (true);