#!/usr/bin/env node
/**
 * =============================================================================
 * SUÍTE DE TESTES AUTOMATIZADOS LOCAIS: BASE DE HOTÉIS — v0.1.43
 * Arquivo: scripts/test_hotels_validation.cjs
 * Requisitos: V38-001, QC42-001, QC42-002, QC42-003, SC-184
 * =============================================================================
 * 
 * Regra: Execução 100% local, em memória e análise estática, sem escrita remota.
 */

const fs = require("fs");
const path = require("path");

const CANONICAL_ZONES = [
  "Puerto Juarez",
  "Isla Blanca",
  "Cancun Center",
  "Cancun Hotel Zone",
  "Maya Riviera",
  "Playa del Carmen",
  "Tulum Center",
  "Tulum Hotel Zone"
];

const EXPECTED_ZONE_DISTRIBUTION = {
  "Puerto Juarez": 2,
  "Isla Blanca": 21,
  "Cancun Center": 6,
  "Cancun Hotel Zone": 72,
  "Maya Riviera": 265,
  "Playa del Carmen": 405,
  "Tulum Center": 224,
  "Tulum Hotel Zone": 130
};

function runTests() {
  console.log("=============================================================================");
  console.log("=== SUÍTE DE TESTES LOCAIS — VALIDAÇÃO DA BASE MESTRE DE HOTÉIS ===");
  console.log("=============================================================================\n");

  const jsonPath = path.join(__dirname, "hotels_master_validated.json");
  const migrationPath = path.join(__dirname, "..", "supabase", "migrations", "20261022_create_hotels_master.sql");
  const backupScriptPath = path.join(__dirname, "export_database_backup.cjs");
  const importScriptPath = path.join(__dirname, "import_hotels_master.cjs");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = "") {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} -> ${details}`);
      failed++;
    }
  }

  // --- GRUPO 1: VALIDAÇÃO DO DATASET DE HOTÉIS ---
  console.log("[GRUPO 1] Integridade do Dataset de Hotéis (JSON Validado)");

  // Teste 1: Existência do arquivo validado
  assert(fs.existsSync(jsonPath), "T01: Arquivo JSON de hotéis validado existe", jsonPath);
  if (!fs.existsSync(jsonPath)) {
    console.error("Abortando testes restantes.");
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const hotels = data.hotels || [];

  // Teste 2: Contagem Exata de 1.125 Hotéis (QC42-001 / SC-184)
  assert(hotels.length === 1125, "T02: Contagem total é exatamente 1.125 hotéis", `Encontrados: ${hotels.length}`);

  // Teste 3: Ausência de Nomes Vazios ou Nulos
  const emptyNames = hotels.filter(h => !h.name || typeof h.name !== "string" || !h.name.trim());
  assert(emptyNames.length === 0, "T03: Ausência de nomes de hotéis vazios ou inválidos", `Vazios: ${emptyNames.length}`);

  // Teste 4: Ausência de Espaços Supérfluos nos Nomes
  const untrimmedNames = hotels.filter(h => h.name !== h.name.trim());
  assert(untrimmedNames.length === 0, "T04: Todos os nomes estão devidamente higienizados (trimmed)", `Inconsistentes: ${untrimmedNames.length}`);

  // Teste 5: Unicidade Estrita de Nomes (Sem Duplicações Exatas)
  const namesMap = new Map();
  const exactDuplicates = [];
  hotels.forEach((h, idx) => {
    if (namesMap.has(h.name)) {
      exactDuplicates.push({ name: h.name, first: namesMap.get(h.name), second: idx });
    } else {
      namesMap.set(h.name, idx);
    }
  });
  assert(exactDuplicates.length === 0, "T05: Unicidade estrita de nomes (Zero duplicações exatas)", JSON.stringify(exactDuplicates));

  // Teste 6: Unicidade Normalizada (Case/Espaço/Acentos)
  const normMap = new Map();
  const normDuplicates = [];
  hotels.forEach((h, idx) => {
    const norm = h.name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
    if (normMap.has(norm)) {
      normDuplicates.push({ norm, first: normMap.get(norm), second: h.name });
    } else {
      normMap.set(norm, h.name);
    }
  });
  assert(normDuplicates.length === 0, "T06: Unicidade normalizada (Zero colisões por acento ou caixa)", JSON.stringify(normDuplicates));

  // Teste 7: Todas as Zonas Pertencem às 8 Zonas Canônicas (QC42-002)
  const invalidZones = hotels.filter(h => !CANONICAL_ZONES.includes(h.zone));
  assert(invalidZones.length === 0, "T07: Todas as zonas pertencem às 8 zonas canônicas homologadas", `Inválidas: ${invalidZones.length}`);

  // Teste 8: Distribuição Exata por Zona Canônica
  const actualDistribution = {};
  CANONICAL_ZONES.forEach(z => actualDistribution[z] = 0);
  hotels.forEach(h => actualDistribution[h.zone]++);

  let distributionMatches = true;
  for (const z of CANONICAL_ZONES) {
    if (actualDistribution[z] !== EXPECTED_ZONE_DISTRIBUTION[z]) {
      distributionMatches = false;
      console.error(`  Divergência na zona ${z}: esperado ${EXPECTED_ZONE_DISTRIBUTION[z]}, obtido ${actualDistribution[z]}`);
    }
  }
  assert(distributionMatches, "T08: Distribuição quantitativa por zona coincide com a especificação oficial", JSON.stringify(actualDistribution));

  // Teste 9: Idempotência de Simulação em Memória (Ressalva: teste simulado, não banco real)
  const memoryDb = new Map();
  hotels.forEach(h => memoryDb.set(h.name, { ...h, id: "uuid-" + h.name }));
  const countPass1 = memoryDb.size;
  hotels.forEach(h => memoryDb.set(h.name, { ...h, id: memoryDb.get(h.name).id }));
  const countPass2 = memoryDb.size;
  assert(countPass1 === 1125 && countPass2 === 1125, "T09: [SIMULAÇÃO EM MEMÓRIA] Idempotência do algoritmo local de upsert em Map");

  // Teste 10 e 11: Amostragem de Resolução de Hotéis Frequentes
  const hrHotel = hotels.find(h => h.name === "Hard Rock Hotel Riviera Maya");
  assert(!!hrHotel && hrHotel.zone === "Maya Riviera", "T10: Resolução de zona para 'Hard Rock Hotel Riviera Maya' -> 'Maya Riviera'");

  const cbHotel = hotels.find(h => h.name === "Cancun Bay Hotel");
  assert(!!cbHotel && cbHotel.zone === "Cancun Hotel Zone", "T11: Resolução de zona para 'Cancun Bay Hotel' -> 'Cancun Hotel Zone'");

  // --- GRUPO 2: VALIDAÇÃO ESTÁTICA DA MIGRAÇÃO SQL ---
  console.log("\n[GRUPO 2] Validação de Segurança e Integridade da Migração SQL");
  assert(fs.existsSync(migrationPath), "T12: Arquivo da migração SQL existe", migrationPath);
  const migrationSql = fs.readFileSync(migrationPath, "utf8");

  // Verifica proteção contra mascaramento de schema
  const hasSchemaPrecheck = migrationSql.includes("INCOMPATIBILIDADE DETECTADA: A tabela public.hotels já existe") ||
                            migrationSql.includes("information_schema.tables");
  assert(hasSchemaPrecheck, "T13: Migração possui verificação prévia contra mascaramento de schema incompatível");

  // Verifica que NÃO confia em user_metadata no código SQL ativo (desconsiderando comentários)
  const sqlWithoutComments = migrationSql
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
  const hasUserMetadata = sqlWithoutComments.includes("user_metadata");
  assert(!hasUserMetadata, "T14: Migração NÃO utiliza 'user_metadata' em código SQL ativo");

  // Verifica que escrita é restrita a service_role
  const hasServiceRoleWrite = migrationSql.includes("TO service_role") && migrationSql.includes("FOR ALL");
  assert(hasServiceRoleWrite, "T15: Escrita na tabela restrita estritamente a 'service_role'");

  // Verifica que leitura anônima não foi concedida
  const hasAnonRead = migrationSql.includes("TO anon");
  assert(!hasAnonRead, "T16: Leitura pública para anônimo ('TO anon') NÃO concedida");

  // Verifica que leitura está restrita a usuários autenticados
  const hasAuthenticatedRead = migrationSql.includes("TO authenticated") && migrationSql.includes("FOR SELECT");
  assert(hasAuthenticatedRead, "T17: Leitura restrita a 'authenticated' (Sellers e Admins)");

  // Verifica presença das 8 zonas no CHECK
  let allZonesInCheck = true;
  for (const z of CANONICAL_ZONES) {
    if (!migrationSql.includes(`'${z}'`)) {
      allZonesInCheck = false;
      break;
    }
  }
  assert(allZonesInCheck, "T18: Constraint CHECK da migração contempla todas as 8 zonas canônicas");

  // --- GRUPO 3: VALIDAÇÃO ESTÁTICA DOS SCRIPTS DE APOIO ---
  console.log("\n[GRUPO 3] Validação de Segurança dos Scripts de Backup e Importação");
  assert(fs.existsSync(backupScriptPath), "T19: Script de backup existe", backupScriptPath);
  const backupCode = fs.readFileSync(backupScriptPath, "utf8");

  const backupHasPagination = backupCode.includes(".range(") && backupCode.includes("PAGE_SIZE");
  assert(backupHasPagination, "T20: Script de backup implementa paginação explícita com .range()");

  const backupHasReconciliation = backupCode.includes("crypto.createHash") && backupCode.includes("records.length !== expectedCount");
  assert(backupHasReconciliation, "T21: Script de backup compara contagens e valida hashes SHA-256");

  const backupFailsOnError = backupCode.includes("backup_manifest_FAILED.json") && backupCode.includes("process.exit(1)");
  assert(backupFailsOnError, "T22: Script de backup gera manifesto de falha e retorna código de saída 1 em erros");

  assert(fs.existsSync(importScriptPath), "T23: Script de importador existe", importScriptPath);
  const importCode = fs.readFileSync(importScriptPath, "utf8");

  const importRequiresServiceRole = importCode.includes("SUPABASE_SERVICE_ROLE_KEY") && importCode.includes("isExecute");
  assert(importRequiresServiceRole, "T24: Importador exige SUPABASE_SERVICE_ROLE_KEY para o modo --execute");

  const importHasPagination = importCode.includes(".range(") && importCode.includes("PAGE_SIZE");
  assert(importHasPagination, "T25: Importador consulta hotéis remotos com paginação explícita");

  const importPreservesActive = importCode.includes("existing.active") && importCode.includes("existing.id");
  assert(importPreservesActive, "T26: Importador preserva status 'active' administrativo e UUID em reexecuções");

  const importHasPostCheck = importCode.includes("verifyDatabaseIntegrityPostImport");
  assert(importHasPostCheck, "T27: Importador implementa verificação pós-importação obrigatória");

  console.log("\n-----------------------------------------------------------------------------");
  console.log(`TOTAL DE TESTES EXECUTADOS: ${passed + failed}`);
  console.log(`TESTES APROVADOS:          ${passed}`);
  console.log(`TESTES REPROVADOS:         ${failed}`);
  console.log("-----------------------------------------------------------------------------\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
