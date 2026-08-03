GRANT SELECT ON public.solicitacoes TO anon;
DROP POLICY IF EXISTS "Public can read solicitacoes" ON public.solicitacoes;
CREATE POLICY "Public can read solicitacoes" ON public.solicitacoes FOR SELECT TO anon USING (true);