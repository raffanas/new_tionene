# RELATÓRIO DE REVISÃO DE SEGURANÇA E BACKUP PRÉ-MIGRAÇÃO DE HOTÉIS — TÍO NENÊ v0.1.43

**Documento:** `RELATORIO_REVISAO_PRE_MIGRACAO_HOTEIS_V0143.md`  
**Data:** 21 de Outubro de 2026  
**Status:** CONCLUÍDO (Pronto para decisão de autorização da Tarefa 05B)  
**Ambiente:** Supabase Projeto Único (`pfsgpsvbsfowrtcyckcm`) — Fase de Testes / Pré-Operação  

---

## 1. PROBLEMAS ENCONTRADOS NA REVISÃO TÉCNICA

A auditoria de segurança e robustez realizada sobre os artefatos da Tarefa 05A identificou quatro frentes com fragilidades que precisavam de correção imediata antes de qualquer alteração no banco de dados:

### 1.1. Script de Backup Lógico (`scripts/export_database_backup.cjs`)
1. **Ausência de Paginação Explícita:** A consulta original realizava `.select("*")` sem controle de offset/range. Em instâncias Supabase / PostgREST, requisições sem paginação são limitadas pelo parâmetro `max_rows` (normalmente 1.000 linhas), o que provocaria truncamento silencioso em tabelas maiores.
2. **Ausência de Reconciliação Física dos Arquivos:** O manifesto anterior registrava a contagem informada pela API sem validar se a totalidade dos bytes e objetos havia sido gravada em disco de forma íntegra.
3. **Falso Positivo de Sucesso:** Em caso de erro em uma tabela intermediária (ex: bloqueio de RLS ou timeout), o script registrava a falha mas continuava o laço e emitia a mensagem `"BACKUP CONCLUÍDO COM SUCESSO"`.
4. **Código de Saída Incorreto:** O processo finalizava com código `0` (sucesso para o sistema operacional) mesmo que tabelas obrigatórias tivessem falhado.
5. **Uso Indevido de Chave Anônima (`anon_key`):** O script utilizava a chave pública do frontend silenciosamente, correndo o risco de não exportar dados sensíveis protegidos por RLS sem alertar o operador.
6. **Escopo Limitado de Dados Lógicos:** O script exporta dados em formato JSON, mas não gerava o dump estrutural (DDL de tabelas, índices, triggers, funções e políticas RLS).

### 1.2. Políticas de Segurança RLS de Hotéis (`supabase/migrations/20261022_create_hotels_master.sql`)
1. **Confiança Vulnerável em `user_metadata`:** A política anterior verificava `(auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'`. No Supabase Auth, o payload de `user_metadata` pode ser modificado pelo próprio usuário final via API do cliente (`supabase.auth.updateUser({ data: ... })`), o que viabilizaria escalação de privilégios.
2. **Confusão de Papéis Técnicos e de Negócio:** Tratava-se o papel `authenticated` como garantia administrativa, quando na verdade qualquer usuário autenticado (incluindo futuros clientes ou vendedores sem privilégio) possui o token JWT `authenticated`.
3. **Leitura Pública Aberta para Usuários Anônimos (`anon`):** Concedia `SELECT` público aos hotéis, o que era desnecessário para a fase atual do sistema (backoffice restrito de emissão de contratos e itinerários).
4. **Mascaramento por `CREATE TABLE IF NOT EXISTS`:** Se uma tabela `public.hotels` já existisse previamente no banco com colunas incompatíveis ou sem as constraints de integridade, a declaração `CREATE TABLE IF NOT EXISTS` passaria em silêncio sem aplicar as restrições necessárias.

### 1.3. Script de Importação (`scripts/import_hotels_master.cjs`)
1. **Consulta Prévia Não Paginada:** A verificação de hotéis existentes no banco executava `.select("id, name, zone")` sem paginação.
2. **Execução sem Trava de Credencial Administrativa:** O importador tentava rodar em modo real (`--execute`) mesmo sem a presença de `SUPABASE_SERVICE_ROLE_KEY`, o que resultaria em falha por violação de RLS.
3. **Sobrescrita Indevida de Customizações Administrativas:** O importador forçava `active: true` em todos os registros no upsert, ignorando se um administrador havia desativado manualmente um hotel (`active: false`).
4. **Falta de Detecção de Importação Parcial:** Caso ocorresse falha no lote 5 de 12, o script não relatava com clareza o estado intermediário do banco.
5. **Ausência de Verificação Pós-Carga no Banco:** O script considerava o sucesso apenas pelo retorno local dos lotes, sem reconsultar o PostgreSQL para certificar que os 1.125 hotéis e as 8 zonas canônicas estavam com contagens exatas.

### 1.4. Estratégia de Reversão / Rollback
1. **Uso Perigoso de `CASCADE` Automático:** A documentação anterior sugeria `DROP TABLE IF EXISTS public.hotels CASCADE;`. Em bancos relacionais, o modificador `CASCADE` destrói automaticamente chaves estrangeiras, triggers e visões dependentes sem confirmação prévia, expondo o banco a perda catastrófica de dependências.

---

## 2. CORREÇÕES REALIZADAS

Todas as correções foram implementadas nos arquivos locais, em estrita conformidade com as regras (nenhuma escrita remota foi efetuada no Supabase):

### 2.1. Refatoração do Script de Backup ([`scripts/export_database_backup.cjs`](file:///d:/Z_UEB/TIONENE/scripts/export_database_backup.cjs))
- **Paginação Obrigatória:** Implementada paginação em lotes de 500 registros via `.range(from, to)`.
- **Reconciliação Tríplice de Integridade:** O script valida se `count_banco == registros_em_memoria == registros_arquivo_gravado`. Qualquer discrepância aborta o processo.
- **Hash Criptográfico SHA-256 e Bytes:** Para cada uma das 18 tabelas exportadas, calcula-se o hash SHA-256 e o tamanho em bytes do arquivo JSON gerado.
- **Tolerância Zero a Falhas Parciais:** Se qualquer tabela falhar, o script gera o manifesto `backup_manifest_FAILED.json`, emite alerta sonoro/visual no terminal e finaliza com `process.exit(1)`.
- **Exigência de Credencial Administrativa:** Exige `SUPABASE_SERVICE_ROLE_KEY` por padrão. O uso de chave anônima foi bloqueado e só pode ser ativado mediante flag explícita `--allow-anon` com aviso de segurança em destaque.
- **Proteção contra Vazamento de Segredos:** Tokens, URLs privadas e senhas são mascarados no terminal.

### 2.2. Correção da Migração SQL ([`supabase/migrations/20261022_create_hotels_master.sql`](file:///d:/Z_UEB/TIONENE/supabase/migrations/20261022_create_hotels_master.sql))
- **Eliminação Total do `user_metadata`:** Nenhuma política RLS consulta metadados do cliente.
- **Escrita Exclusiva para `service_role`:**
  ```sql
  CREATE POLICY "Allow service_role manage hotels"
  ON public.hotels
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
  ```
  O cliente frontend (navegador) possui ZERO permissão de escrita (INSERT, UPDATE, DELETE). Apenas rotinas autenticadas com a credencial de servidor ou Server Actions futuras poderão gerenciar hotéis.
- **Leitura Restrita a Autenticados:** Removida a permissão de leitura para `anon`. Apenas usuários logados no backoffice (`authenticated`) podem consultar o catálogo de hotéis.
- **Proteção Contra Mascaramento de Schema:** Adicionado bloco PL/pgSQL que verifica se a tabela já existe com schema incompatível (ex: sem `name` ou `zone`), levantando exceção (`RAISE EXCEPTION`) para impedir corrupção.
- **Garantia de Constraints Canônicas:** Bloco PL/pgSQL complementar que injeta explicitamente as constraints `hotels_name_unique` e `hotels_zone_check` mesmo se a tabela tiver sido criada previamente sem elas.

### 2.3. Refatoração do Script de Importador ([`scripts/import_hotels_master.cjs`](file:///d:/Z_UEB/TIONENE/scripts/import_hotels_master.cjs))
- **Paginação de Leitura:** Função `fetchAllExistingHotels` consulta o banco remoto de 500 em 500 registros.
- **Preservação de Alterações Administrativas:** No upsert, se o registro já existe no banco com `active: false`, o script preserva o valor `false` (não reativa hotéis desativados pelo operador).
- **Preservação de UUIDs:** Mantém o `id` original de cada hotel caso ele já exista no banco, garantindo idempotência absoluta sem regeneração de chaves primárias.
- **Exigência de `service_role` no Modo `--execute`:** O script verifica a chave administrativa e aborta imediatamente com `process.exit(1)` se for executado com chave anônima.
- **Isolamento de Erros e Detecção Parcial:** Se um lote falhar durante a importação, o script informa a quantidade exata já processada e aborta sem emitir declaração de sucesso.
- **Verificação Pós-Importação Remota:** Ao finalizar a carga de lotes, executa a função `verifyDatabaseIntegrityPostImport`, que lê a tabela remota e confere:
  1. Se a contagem total no banco é rigorosamente 1.125 registros.
  2. Se a contagem em cada uma das 8 zonas canônicas é rigorosamente igual à documentação oficial.

### 2.4. Correção da Estratégia de Reversão
- Eliminada a instrução `DROP TABLE IF EXISTS public.hotels CASCADE;`.
- Substituída por procedimento seguro com verificação prévia de dependências e uso de `RESTRICT` (ver Seção 7).

---

## 3. ARQUIVOS MODIFICADOS E CRIADOS

| Arquivo | Status | Finalidade |
|---|---|---|
| [`scripts/export_database_backup.cjs`](file:///d:/Z_UEB/TIONENE/scripts/export_database_backup.cjs) | Modificado | Script de backup com paginação, reconciliação, hashes SHA-256 e falha estrita |
| [`supabase/migrations/20261022_create_hotels_master.sql`](file:///d:/Z_UEB/TIONENE/supabase/migrations/20261022_create_hotels_master.sql) | Modificado | DDL da migração com proteção de schema, RLS seguro (`service_role` apenas) e constraints oficiais |
| [`scripts/import_hotels_master.cjs`](file:///d:/Z_UEB/TIONENE/scripts/import_hotels_master.cjs) | Modificado | Importador oficial com paginação, preservação de UUID/status, trava de credencial e validação pós-carga |
| [`scripts/test_hotels_validation.cjs`](file:///d:/Z_UEB/TIONENE/scripts/test_hotels_validation.cjs) | Modificado | Suíte local de 27 testes cobrindo dataset, DDL SQL, RLS, backup e importador |
| [`scripts/hotels_master_validated.json`](file:///d:/Z_UEB/TIONENE/scripts/hotels_master_validated.json) | Preservado | Base limpa e validada de 1.125 hotéis nas 8 zonas canônicas |
| [`RELATORIO_REVISAO_PRE_MIGRACAO_HOTEIS_V0143.md`](file:///d:/Z_UEB/TIONENE/RELATORIO_REVISAO_PRE_MIGRACAO_HOTEIS_V0143.md) | Criado | Relatório formal de auditoria técnica pré-migração |

---

## 4. TESTES EXECUTADOS E RESULTADOS

Foi executada a suíte ampliada de testes locais (`scripts/test_hotels_validation.cjs`), composta por 27 testes automatizados, complementada por testes funcionais de linha de comando.

### 4.1. Suíte de Testes Automatizados Locais (27/27 APROVADOS)

```text
=============================================================================
=== SUÍTE DE TESTES LOCAIS — VALIDAÇÃO DA BASE MESTRE DE HOTÉIS ===
=============================================================================

[GRUPO 1] Integridade do Dataset de Hotéis (JSON Validado)
[PASS] T01: Arquivo JSON de hotéis validado existe
[PASS] T02: Contagem total é exatamente 1.125 hotéis
[PASS] T03: Ausência de nomes de hotéis vazios ou inválidos
[PASS] T04: Todos os nomes estão devidamente higienizados (trimmed)
[PASS] T05: Unicidade estrita de nomes (Zero duplicações exatas)
[PASS] T06: Unicidade normalizada (Zero colisões por acento ou caixa)
[PASS] T07: Todas as zonas pertencem às 8 zonas canônicas homologadas
[PASS] T08: Distribuição quantitativa por zona coincide com a especificação oficial
[PASS] T09: [SIMULAÇÃO EM MEMÓRIA] Idempotência do algoritmo local de upsert em Map
[PASS] T10: Resolução de zona para 'Hard Rock Hotel Riviera Maya' -> 'Maya Riviera'
[PASS] T11: Resolução de zona para 'Cancun Bay Hotel' -> 'Cancun Hotel Zone'

[GRUPO 2] Validação de Segurança e Integridade da Migração SQL
[PASS] T12: Arquivo da migração SQL existe
[PASS] T13: Migração possui verificação prévia contra mascaramento de schema incompatível
[PASS] T14: Migração NÃO utiliza 'user_metadata' em código SQL ativo
[PASS] T15: Escrita na tabela restrita estritamente a 'service_role'
[PASS] T16: Leitura pública para anônimo ('TO anon') NÃO concedida
[PASS] T17: Leitura restrita a 'authenticated' (Sellers e Admins)
[PASS] T18: Constraint CHECK da migração contempla todas as 8 zonas canônicas

[GRUPO 3] Validação de Segurança dos Scripts de Backup e Importação
[PASS] T19: Script de backup existe
[PASS] T20: Script de backup implementa paginação explícita com .range()
[PASS] T21: Script de backup compara contagens e valida hashes SHA-256
[PASS] T22: Script de backup gera manifesto de falha e retorna código de saída 1 em erros
[PASS] T23: Script de importador existe
[PASS] T24: Importador exige SUPABASE_SERVICE_ROLE_KEY para o modo --execute
[PASS] T25: Importador consulta hotéis remotos com paginação explícita
[PASS] T26: Importador preserva status 'active' administrativo e UUID em reexecuções
[PASS] T27: Importador implementa verificação pós-importação obrigatória

-----------------------------------------------------------------------------
TOTAL DE TESTES EXECUTADOS: 27
TESTES APROVADOS:          27
TESTES REPROVADOS:         0
-----------------------------------------------------------------------------
```

### 4.2. Teste Funcional de Bloqueio de Escrita sem Credencial
Executou-se o comando `node scripts/import_hotels_master.cjs --execute` no ambiente atual (onde `SUPABASE_SERVICE_ROLE_KEY` não está configurada):
- **Resultado:** O script abortou no passo de verificação, emitiu a mensagem de bloqueio por RLS e finalizou com código `1`. Nenhuma requisição de escrita foi disparada contra o Supabase.

### 4.3. Teste Funcional do Modo Simulação (Dry-Run)
Executou-se o comando `node scripts/import_hotels_master.cjs`:
- **Resultado:** O script conectou em modo somente-leitura, detectou que a tabela `public.hotels` ainda não existe no banco remoto, calculou que 1.125 hotéis serão inseridos na execução real e encerrou com código `0`, sem efetuar mutações.

---

## 5. LIMITAÇÕES AINDA EXISTENTES

1. **Testes Locais vs. Integração no Banco Real:** Os testes automatizados foram executados em memória e via análise estática de código/SQL. A validação das constraints físicas do PostgreSQL (`hotels_name_unique` e `hotels_zone_check`) só ocorrerá no momento em que a migração for efetivamente aplicada na Tarefa 05B.
2. **Ambiente Supabase Compartilhado:** Há apenas um projeto Supabase configurado (`pfsgpsvbsfowrtcyckcm`), o que reforça a necessidade de obter o dump completo antes de aplicar a migração.
3. **Escopo do Backup via API REST:** O script `export_database_backup.cjs` faz o backup lógico de dados em formato JSON. Ele não captura schemas de banco, rotinas de triggers, extensões instaladas ou políticas RLS criadas no Supabase. Para uma recuperação de desastre completa, deve-se utilizar o `pg_dump` oficial (Seção 6).
4. **Estrutura Definitiva de RBAC Pendente:** A tabela `profiles` com roles de negócio (`admin`, `seller`) ainda não foi migrada. Por essa razão, a escrita na tabela `hotels` foi temporariamente restringida ao `service_role` (segurança máxima, sem escrita pelo frontend).

---

## 6. PROCEDIMENTO DE BACKUP RECOMENDADO

Para garantir proteção integral antes da execução da Tarefa 05B, recomenda-se a execução de duas camadas de backup:

### 6.1. Camada 1: Dump Completo do PostgreSQL (Schema + Dados + DDL + RLS)
Este é o procedimento oficial e prioritário para recuperação total de desastre.

#### Parâmetros de Conexão Supabase:
- **Host do Pooler (Session Mode):** `aws-0-sa-east-1.pooler.supabase.com` (porta `5432`) ou Direct Connection (`db.pfsgpsvbsfowrtcyckcm.supabase.co`, porta `5432`).
- **Usuário:** `postgres.pfsgpsvbsfowrtcyckcm` (no pooler) ou `postgres` (conexão direta).
- **Banco:** `postgres`.

#### Comando Recomendado (`pg_dump` Binário com Custom Format):
```bash
pg_dump -h aws-0-sa-east-1.pooler.supabase.com \
        -p 5432 \
        -U postgres.pfsgpsvbsfowrtcyckcm \
        -d postgres \
        -F c \
        -b \
        -v \
        -f "backups/backup_completo_tionene_pre_migracao.dump"
```

#### Comando Alternativo em Formato SQL Texto:
```bash
pg_dump -h aws-0-sa-east-1.pooler.supabase.com \
        -p 5432 \
        -U postgres.pfsgpsvbsfowrtcyckcm \
        -d postgres \
        --clean \
        --if-exists \
        -f "backups/backup_completo_tionene_pre_migracao.sql"
```

#### Procedimento de Restauração (Restore):
Caso seja necessário restaurar o banco a partir do arquivo `.dump`:
```bash
pg_restore -h aws-0-sa-east-1.pooler.supabase.com \
           -p 5432 \
           -U postgres.pfsgpsvbsfowrtcyckcm \
           -d postgres \
           -v \
           --clean \
           "backups/backup_completo_tionene_pre_migracao.dump"
```

---

### 6.2. Camada 2: Backup Lógico Tabular com Paginação e Hash
Caso o desenvolvedor não tenha acesso direto via `pg_dump` no momento da execução, utiliza-se o script corrigido:

1. Configurar temporariamente a chave `SUPABASE_SERVICE_ROLE_KEY` no arquivo `.env`.
2. Executar o comando:
   ```bash
   node scripts/export_database_backup.cjs
   ```
3. O script exportará todas as 18 tabelas para uma pasta com carimbo de data/hora (`backups/backup_YYYY-MM-DDTHH-MM-SS/`), gerando os arquivos `.json`, os hashes SHA-256 e o manifesto de validação `backup_manifest.json`.
4. Verificar se a saída termina com a mensagem de validação sem erros e código de retorno `0`.

---

## 7. ESTRATÉGIA DE RECUPERAÇÃO E ROLLBACK SEGURO

Fica expressamente **PROIBIDO** o uso automatizado de `DROP TABLE IF EXISTS public.hotels CASCADE;`.

A estratégia de recuperação foi dividida em três cenários com regras de isolamento:

### Cenário A: Falha ou Erro na Carga de Dados (Tabela Criada com Sucesso)
Se a tabela foi criada, mas a importação de hotéis falhou no meio do processo ou os dados ficaram inconsistentes:
1. **NÃO DROPAR A TABELA.**
2. Realizar a limpeza controlada dos dados através de `TRUNCATE` com cláusula `RESTRICT`:
   ```sql
   TRUNCATE TABLE public.hotels RESTRICT;
   ```
   *Justificativa:* O comando `RESTRICT` impede a exclusão se qualquer outra tabela do banco estiver fazendo referência de chave estrangeira a `hotels`, evitando danos colaterais.
3. Corrigir o problema e reiniciar o importador oficial `import_hotels_master.cjs`.

### Cenário B: Falha Estrutural na Migração (Necessidade de Desfazer o Schema)
Se a migração de schema apresentou incompatibilidade e precisa ser desfeita:
1. Verificar previamente no catálogo do PostgreSQL se existem dependências ativas:
   ```sql
   SELECT tc.table_schema, tc.table_name, kcu.column_name
   FROM information_schema.table_constraints tc
   JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
   JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
   WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'hotels';
   ```
2. Se nenhuma dependência existir, executar o drop estrito (sem cascade):
   ```sql
   DROP TABLE public.hotels RESTRICT;
   DROP FUNCTION IF EXISTS public.update_hotels_timestamp() RESTRICT;
   ```

### Cenário C: Restauração Completa de Emergência
Em caso de corrupção geral:
1. Restaurar o snapshot anterior através do procedimento de restauração da Seção 6.1 (`pg_restore`).

---

## 8. CONDIÇÕES NECESSÁRIAS PARA AUTORIZAR A TAREFA 05B

Para que a **Tarefa 05B (Execução da Migração e Carga Oficial da Base Mestre de Hotéis)** seja autorizada e iniciada com segurança, as seguintes pré-condições devem ser atendidas:

1. **[ ] Realização do Backup Pré-Migração:** Executar o procedimento de backup (Camada 1 via `pg_dump` ou Camada 2 via `export_database_backup.cjs`).
2. **[ ] Configuração da Chave Administrativa:** Disponibilizar ou configurar no ambiente a variável `SUPABASE_SERVICE_ROLE_KEY` (necessária para que o importador consiga inserir os dados sob as políticas RLS de servidor).
3. **[ ] Autorização Formal da Aplicação da Migração:** O desenvolvedor deve aprovar formalmente a execução do arquivo `supabase/migrations/20261022_create_hotels_master.sql` no Supabase.
4. **[ ] Autorização Formal da Execução do Importador:** O desenvolvedor deve aprovar formalmente a execução do comando `node scripts/import_hotels_master.cjs --execute`.

---

**Fim do Relatório.** Aguardando autorização e orientações do desenvolvedor para os próximos passos.
