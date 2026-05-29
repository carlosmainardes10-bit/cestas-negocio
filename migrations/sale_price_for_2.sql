-- Adiciona coluna de preço para 2 pessoas na tabela de cestas
ALTER TABLE baskets ADD COLUMN IF NOT EXISTS sale_price_for_2 numeric NULL;
