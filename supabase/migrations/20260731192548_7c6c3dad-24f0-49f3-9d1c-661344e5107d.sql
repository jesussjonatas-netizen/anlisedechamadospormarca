ALTER TABLE public.solicitacoes
  ADD COLUMN IF NOT EXISTS marca text,
  ADD COLUMN IF NOT EXISTS conferente text,
  ADD COLUMN IF NOT EXISTS cna text,
  ADD COLUMN IF NOT EXISTS codigo text,
  ADD COLUMN IF NOT EXISTS nome text,
  ADD COLUMN IF NOT EXISTS procedencia text;