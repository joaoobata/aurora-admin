-- Adicionar constraint única para permitir UPSERT na tabela videos
-- Isso garante que não teremos vídeos duplicados para a mesma conta com o mesmo ID externo
ALTER TABLE videos 
ADD CONSTRAINT videos_account_id_external_id_key 
UNIQUE (account_id, external_id);

-- Opcional: Se já existirem duplicatas, o comando acima falhará.
-- Nesse caso, precisariamos limpar as duplicatas antes.
-- Mas como o insert falhou todas as vezes até agora, a tabela deve estar limpa ou sem conflitos.
