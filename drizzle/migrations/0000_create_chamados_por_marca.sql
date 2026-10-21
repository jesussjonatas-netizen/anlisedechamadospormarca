CREATE TABLE public.chamados_por_marca (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_entrada date,
  id_portal text NOT NULL,
  numero_benner text,
  cliente text,
  documento text,
  regiao text,
  cd text,
  nf text,
  valor numeric,
  modalidade text,
  tipo text,
  status text,
  conf_expedicao text,
  conf_checkout text,
  conf_separacao text,
  causa_raiz text,
  no_status_atual text,
  tempo_aberto text,
  cna text,
  codigo text,
  nome text,
  marca text,
  quantidade numeric,
  quantidade_desejada numeric,
  quantidade_a_retornar numeric,
  nf_devolucao text,
  nfe_transportadora text,
  nfe_fabricante text,
  -- colunas legadas (não vêm da planilha; preservadas no update)
  nfd text,
  cd_full text,
  entrada_devolucao text,
  situacao text,
  status_auditoria text,
  data_validacao date,
  validador text,
  obs_reprovacao_aprovacao text,
  procedencia text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chamados_por_marca_chave_idx ON public.chamados_por_marca (id_portal, codigo);

GRANT SELECT ON public.chamados_por_marca TO anon, authenticated;
GRANT ALL ON public.chamados_por_marca TO service_role;
ALTER TABLE public.chamados_por_marca ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública de chamados_por_marca" ON public.chamados_por_marca FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.chamados_por_marca (
  data_entrada, id_portal, numero_benner, cliente, regiao, cd, nf, valor, modalidade, tipo, status,
  conf_expedicao, causa_raiz, cna, codigo, nome, marca,
  nfd, cd_full, entrada_devolucao, situacao, status_auditoria, data_validacao, validador, obs_reprovacao_aprovacao, procedencia, created_at
)
SELECT data, id_portal, numero_benner, cliente, regiao, cd, nf, valor, modalidade, tipo, status,
  conferente, causa_raiz, cna, codigo, nome, marca,
  nfd, cd_full, entrada_devolucao, situacao, status_auditoria, data_validacao, validador, obs_reprovacao_aprovacao, procedencia, created_at
FROM public.solicitacoes WHERE id_portal IS NOT NULL;

CREATE TABLE public.chamados_por_marca_meta (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.chamados_por_marca_meta TO anon, authenticated;
GRANT ALL ON public.chamados_por_marca_meta TO service_role;
ALTER TABLE public.chamados_por_marca_meta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública de chamados_por_marca_meta" ON public.chamados_por_marca_meta FOR SELECT TO anon, authenticated USING (true);
INSERT INTO public.chamados_por_marca_meta (id, atualizado_em) SELECT 1, now();

-- Gravação atômica: tudo ou nada.
CREATE OR REPLACE FUNCTION public.importar_chamados_por_marca(_rows jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  r jsonb;
  alvo uuid;
  ins integer := 0;
  upd integer := 0;
  agora timestamptz := now();
BEGIN
  FOR r IN SELECT * FROM jsonb_array_elements(_rows) LOOP
    alvo := NULLIF(r->>'_alvo', '')::uuid;
    IF alvo IS NOT NULL THEN
      UPDATE public.chamados_por_marca SET
        data_entrada = (r->>'data_entrada')::date,
        numero_benner = r->>'numero_benner', cliente = r->>'cliente', documento = r->>'documento',
        regiao = r->>'regiao', cd = r->>'cd', nf = r->>'nf', valor = (r->>'valor')::numeric,
        modalidade = r->>'modalidade', tipo = r->>'tipo', status = r->>'status',
        conf_expedicao = r->>'conf_expedicao', conf_checkout = r->>'conf_checkout', conf_separacao = r->>'conf_separacao',
        causa_raiz = r->>'causa_raiz', no_status_atual = r->>'no_status_atual', tempo_aberto = r->>'tempo_aberto',
        cna = r->>'cna', nome = r->>'nome', marca = r->>'marca',
        quantidade = (r->>'quantidade')::numeric, quantidade_desejada = (r->>'quantidade_desejada')::numeric,
        quantidade_a_retornar = (r->>'quantidade_a_retornar')::numeric,
        nf_devolucao = r->>'nf_devolucao', nfe_transportadora = r->>'nfe_transportadora', nfe_fabricante = r->>'nfe_fabricante',
        updated_at = agora
      WHERE id = alvo AND id_portal = r->>'id_portal' AND codigo IS NOT DISTINCT FROM r->>'codigo';
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Registro % / % não encontrado para atualização. Recarregue a página e tente novamente.', r->>'id_portal', r->>'codigo';
      END IF;
      upd := upd + 1;
    ELSE
      INSERT INTO public.chamados_por_marca (
        data_entrada, id_portal, numero_benner, cliente, documento, regiao, cd, nf, valor, modalidade, tipo, status,
        conf_expedicao, conf_checkout, conf_separacao, causa_raiz, no_status_atual, tempo_aberto, cna, codigo, nome, marca,
        quantidade, quantidade_desejada, quantidade_a_retornar, nf_devolucao, nfe_transportadora, nfe_fabricante, cd_full
      ) VALUES (
        (r->>'data_entrada')::date, r->>'id_portal', r->>'numero_benner', r->>'cliente', r->>'documento', r->>'regiao', r->>'cd',
        r->>'nf', (r->>'valor')::numeric, r->>'modalidade', r->>'tipo', r->>'status',
        r->>'conf_expedicao', r->>'conf_checkout', r->>'conf_separacao', r->>'causa_raiz', r->>'no_status_atual', r->>'tempo_aberto',
        r->>'cna', r->>'codigo', r->>'nome', r->>'marca',
        (r->>'quantidade')::numeric, (r->>'quantidade_desejada')::numeric, (r->>'quantidade_a_retornar')::numeric,
        r->>'nf_devolucao', r->>'nfe_transportadora', r->>'nfe_fabricante', r->>'cd'
      );
      ins := ins + 1;
    END IF;
  END LOOP;

  INSERT INTO public.chamados_por_marca_meta (id, atualizado_em) VALUES (1, agora)
  ON CONFLICT (id) DO UPDATE SET atualizado_em = EXCLUDED.atualizado_em;

  RETURN jsonb_build_object('inseridos', ins, 'atualizados', upd, 'atualizado_em', agora);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.importar_chamados_por_marca(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.importar_chamados_por_marca(jsonb) TO service_role;