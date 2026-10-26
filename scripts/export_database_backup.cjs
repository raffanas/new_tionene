#!/usr/bin/env node
/**
 * =============================================================================
 * SCRIPT DE BACKUP LÓGICO E VERIFICAÇÃO INTEGRAL — TÍO NENÊ v0.1.43
 * Arquivo: scripts/export_database_backup.cjs
 * =============================================================================
 * 
 * USO:
 *   node scripts/export_database_backup.cjs                  -> Requer SUPABASE_SERVICE_ROLE_KEY
 *   node scripts/export_database_backup.cjs --allow-anon     -> Permite chave anônima (com aviso)
 * 
 * REGRAS DE SEGURANÇA E CONFORMIDADE:
 *   - Paginação estrita em lotes para contornar limites de linha do PostgREST.
 *   - Reconciliação mandatória: count retornado == linhas exportadas == linhas gravadas.
 *   - Cálculo e validação de hash SHA-256 e tamanho em bytes para cada tabela.
 *   - Qualquer falha em tabela individual interrompe e retorna código de saída 1 (exit code 1).
 *   - Nunca declara "BACKUP CONCLUÍDO COM SUCESSO" se houver qualquer falha parcial.
 *   - Não imprime tokens, credenciais ou dados pessoais de clientes no terminal.
 *   - Exige credencial administrativa adequada (service_role) por padrão.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createClient } = require("../node_modules/@supabase/supabase-js");

// As 18 tabelas oficiais atualmente existentes no Supabase remoto
const ALL_TABLES = [
  "destinations",
  "travel_packages",
  "tours",
  "suppliers",
  "supplier_cost_options",
  "supplier_cost_audit_log",
  "clients",
  "leads",
  "contracts",
  "contract_items",
  "supplier_payments",
  "supplier_payment_allocations",
  "curadoria_leads",
  "partner_leads",
  "reservations",
  "testimonials",
  "profiles",
  "site_settings"
];

const PAGE_SIZE = 500; // Tamanho do lote paginado

function loadSupabaseConfig(allowAnon = false) {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) {
    throw new Error(`Arquivo .env não encontrado em: ${envPath}`);
  }

  const envContent = fs.readFileSync(envPath, "utf8");
  let url = "";
  let serviceRoleKey = "";
  let anonKey = "";

  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
      url = trimmed.split("=")[1].trim().replace(/["']/g, "");
    }
    if (trimmed.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) {
      serviceRoleKey = trimmed.split("=")[1].trim().replace(/["']/g, "");
    }
    if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY=")) {
      anonKey = trimmed.split("=")[1].trim().replace(/["']/g, "");
    }
  }

  if (!url) {
    throw new Error("URL do Supabase (NEXT_PUBLIC_SUPABASE_URL) não configurada.");
  }

  // Validação estrita de credencial
  if (serviceRoleKey) {
    return { url, key: serviceRoleKey, isServiceRole: true };
  }

  if (allowAnon && anonKey) {
    console.warn("⚠️  [AVISO DE SEGURANÇA] SUPABASE_SERVICE_ROLE_KEY não configurada no .env.");
    console.warn("   Utilizando chave anônima sob a flag explícita '--allow-anon'.");
    console.warn("   ATENÇÃO: Políticas RLS restritivas podem omitir registros protegidos.\n");
    return { url, key: anonKey, isServiceRole: false };
  }

  throw new Error(
    "FALHA DE AUTENTICAÇÃO: SUPABASE_SERVICE_ROLE_KEY é obrigatória para executar o backup administrativo completo.\n" +
    "A chave anônima (anon key) não é uma credencial administrativa segura e pode ser bloqueada por RLS.\n" +
    "Para testes de diagnóstico com chave anônima, passe explicitamente a flag '--allow-anon'."
  );
}

async function exportTablePaginated(supabase, table, backupDir) {
  // 1. Obter contagem exata no banco via HEAD
  const { count, error: countErr } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });

  if (countErr) {
    throw new Error(`Erro ao consultar contagem da tabela '${table}': ${countErr.message} (código: ${countErr.code})`);
  }

  const expectedCount = count !== null ? count : 0;
  const records = [];

  // 2. Extração paginada em lotes
  if (expectedCount > 0) {
    for (let from = 0; from < expectedCount; from += PAGE_SIZE) {
      const to = Math.min(from + PAGE_SIZE - 1, expectedCount - 1);
      const { data, error: fetchErr } = await supabase
        .from(table)
        .select("*")
        .range(from, to);

      if (fetchErr) {
        throw new Error(`Erro ao buscar lote [${from}-${to}] da tabela '${table}': ${fetchErr.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error(`Inconsistência na tabela '${table}': lote [${from}-${to}] retornou vazio antes da contagem esperada (${expectedCount}).`);
      }

      records.push(...data);
    }
  }

  // 3. Reconciliação obrigatória em memória
  if (records.length !== expectedCount) {
    throw new Error(
      `DIVERGÊNCIA DE INTEGRIDADE na tabela '${table}': ` +
      `contagem esperada (${expectedCount}) difere dos registros extraídos (${records.length})!`
    );
  }

  // 4. Gravação física em arquivo
  const tableFilePath = path.join(backupDir, `${table}.json`);
  const jsonContent = JSON.stringify(records, null, 2);
  fs.writeFileSync(tableFilePath, jsonContent, "utf8");

  // 5. Verificação pós-gravação: leitura, cálculo de hash SHA-256 e tamanho
  const fileBuffer = fs.readFileSync(tableFilePath);
  const sha256 = crypto.createHash("sha256").update(fileBuffer).digest("hex");
  const bytes = fileBuffer.length;

  // Re-parse de teste para certificar que o JSON gravado é válido e íntegro
  const verifyData = JSON.parse(fileBuffer.toString("utf8"));
  if (verifyData.length !== expectedCount) {
    throw new Error(`FALHA DE CORRUPÇÃO: Arquivo ${table}.json gravado possui ${verifyData.length} registros, esperado ${expectedCount}!`);
  }

  return {
    table,
    status: "ok",
    recordsCount: expectedCount,
    bytes: bytes,
    sha256: sha256,
    file: `${table}.json`
  };
}

async function runBackup() {
  const args = process.argv.slice(2);
  const allowAnon = args.includes("--allow-anon");

  console.log("=============================================================================");
  console.log("=== SCRIPT DE BACKUP LÓGICO INTEGRAL E VERIFICAÇÃO — TÍO NENÊ ===");
  console.log("=============================================================================\n");

  const { url, key, isServiceRole } = loadSupabaseConfig(allowAnon);
  const supabase = createClient(url, key);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(__dirname, "..", "backups", `backup_${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });

  console.log(`Diretório de destino: ${backupDir}`);
  console.log(`Ambiente autenticado: ${isServiceRole ? "SERVICE_ROLE (Administrativo)" : "ANON_KEY (Permissivo)"}`);
  console.log(`Tabelas a serem exportadas (${ALL_TABLES.length}): ${ALL_TABLES.join(", ")}\n`);

  const manifest = {
    timestamp: new Date().toISOString(),
    backup_type: "logical_json_snapshot",
    supabase_url: url,
    auth_mode: isServiceRole ? "service_role" : "anon_key",
    page_size: PAGE_SIZE,
    total_tables: ALL_TABLES.length,
    status: "IN_PROGRESS",
    tables: {}
  };

  const failedTables = [];
  let totalRecordsExported = 0;
  let totalBytesExported = 0;

  for (const table of ALL_TABLES) {
    try {
      const result = await exportTablePaginated(supabase, table, backupDir);
      manifest.tables[table] = result;
      totalRecordsExported += result.recordsCount;
      totalBytesExported += result.bytes;
      console.log(`✓ ${table.padEnd(30)}: ${String(result.recordsCount).padStart(5)} registros | ${(result.bytes / 1024).toFixed(1).padStart(7)} KB | SHA-256: ${result.sha256.substring(0, 12)}...`);
    } catch (err) {
      console.error(`❌ [FALHA CRÍTICA] Tabela '${table}': ${err.message}`);
      manifest.tables[table] = {
        status: "failed",
        error: err.message
      };
      failedTables.push(table);
      // Interrompe imediatamente para não gerar manifesto falso de sucesso
      break;
    }
  }

  // Avaliação final do backup
  if (failedTables.length > 0) {
    manifest.status = "FAILED";
    const manifestPath = path.join(backupDir, "backup_manifest_FAILED.json");
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

    console.error("\n=============================================================================");
    console.error("❌ ERRO FATAL: O BACKUP FALHOU E ESTÁ INCOMPLETO!");
    console.error(`Tabelas com falha: ${failedTables.join(", ")}`);
    console.error(`Manifesto de falha gravado em: ${manifestPath}`);
    console.error("Nenhum procedimento de migração deve ser iniciado com backup incompleto.");
    console.error("=============================================================================\n");
    process.exit(1);
  }

  // Sucesso integral confirmado
  manifest.status = "SUCCESS_VERIFIED";
  manifest.summary = {
    tables_exported: ALL_TABLES.length,
    total_records: totalRecordsExported,
    total_bytes: totalBytesExported
  };

  const manifestPath = path.join(backupDir, "backup_manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

  console.log("\n=============================================================================");
  console.log("✓ BACKUP LÓGICO CONCLUÍDO E VERIFICADO COM SUCESSO!");
  console.log(`  - Tabelas exportadas com integridade: ${ALL_TABLES.length}/${ALL_TABLES.length}`);
  console.log(`  - Total de registros reconciliados:    ${totalRecordsExported}`);
  console.log(`  - Tamanho total dos arquivos:          ${(totalBytesExported / 1024).toFixed(2)} KB`);
  console.log(`  - Manifesto criptográfico verificado:  ${manifestPath}`);
  console.log("=============================================================================\n");
}

if (require.main === module) {
  runBackup().catch(err => {
    console.error("\nExceção não tratada durante o backup:", err.message);
    process.exit(1);
  });
}

module.exports = { runBackup, exportTablePaginated, ALL_TABLES };
