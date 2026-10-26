#!/usr/bin/env node
/**
 * =============================================================================
 * SCRIPT DE IMPORTAÇÃO DA BASE MESTRE DE HOTÉIS — TÍO NENÊ v0.1.43
 * Arquivo: scripts/import_hotels_master.cjs
 * Fonte de Dados: scripts/hotels_master_validated.json
 * Requisitos: V38-001, QC42-001, QC42-002, QC42-003, SC-184
 * =============================================================================
 * 
 * USO:
 *   node scripts/import_hotels_master.cjs              -> Modo Simulação (DRY-RUN) padrão
 *   node scripts/import_hotels_master.cjs --dry-run    -> Modo Simulação explícito
 *   node scripts/import_hotels_master.cjs --execute    -> Execução real (Requer SUPABASE_SERVICE_ROLE_KEY)
 * 
 * REGRAS DE SEGURANÇA E INTEGRIDADE:
 *   - Simulação (dry-run) por padrão; nenhuma escrita ocorre sem --execute.
 *   - Modo --execute EXIGE SUPABASE_SERVICE_ROLE_KEY (RLS restringe escrita a service_role).
 *   - Paginação estrita em todas as consultas (SELECT com .range() de 500 em 500).
 *   - Idempotente: preserva UUIDs existentes em reexecuções.
 *   - Preserva status 'active' modificado por administradores (não reativa cegamente).
 *   - Interrompe imediatamente se qualquer lote de 100 falhar e relata estado parcial.
 *   - Validação pós-importação obrigatória: confere total (1.125) e distribuição nas 8 zonas.
 *   - Retorna exit code 1 em caso de qualquer falha ou divergência.
 *   - Zero credenciais embutidas no código ou impressas no terminal.
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("../node_modules/@supabase/supabase-js");

// 1. Zonas Canônicas Oficiais e Distribuição Esperada (v0.1.43)
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

// 2. Leitura Segura de Configurações
function loadSupabaseConfig(isExecute) {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

  const envPath = path.join(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!url && (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_URL=") || trimmed.startsWith("SUPABASE_URL="))) {
        url = trimmed.split("=")[1].trim().replace(/["']/g, "");
      }
      if (!serviceRoleKey && trimmed.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) {
        serviceRoleKey = trimmed.split("=")[1].trim().replace(/["']/g, "");
      }
      if (!anonKey && (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY=") || trimmed.startsWith("SUPABASE_ANON_KEY="))) {
        anonKey = trimmed.split("=")[1].trim().replace(/["']/g, "");
      }
    }
  }

  if (!url) {
    throw new Error("URL do Supabase não configurada (NEXT_PUBLIC_SUPABASE_URL ausente).");
  }

  if (isExecute) {
    // Para escrita real, a política RLS restringe estritamente a service_role
    if (!serviceRoleKey) {
      throw new Error(
        "A execução real (--execute) exige obrigatoriamente a chave administrativa SUPABASE_SERVICE_ROLE_KEY.\n" +
        "As políticas de segurança RLS (v0.1.43) bloqueiam qualquer escrita por chaves anônimas (anon_key).\n" +
        "Configure SUPABASE_SERVICE_ROLE_KEY no ambiente ou no arquivo .env antes de prosseguir."
      );
    }
    return { url, key: serviceRoleKey, keyType: "service_role" };
  }

  // No modo simulação (dry-run), priorizar service_role se houver, ou usar anon para leitura
  const key = serviceRoleKey || anonKey;
  if (!key) {
    throw new Error("Nenhuma chave do Supabase encontrada para conexão de leitura (service_role ou anon).");
  }

  return {
    url,
    key,
    keyType: serviceRoleKey ? "service_role" : "anon"
  };
}

// 3. Validação Rigorosa da Base Pré-Importação (Local)
function loadAndValidateHotelData() {
  const jsonPath = path.join(__dirname, "hotels_master_validated.json");
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Arquivo validado não encontrado em: ${jsonPath}. Execute a preparação prévia.`);
  }

  const rawData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const hotels = rawData.hotels || [];

  if (hotels.length !== 1125) {
    throw new Error(`FALHA DE VALIDAÇÃO: Quantidade de hotéis (${hotels.length}) difere dos 1.125 oficiais!`);
  }

  const namesSet = new Set();
  const zoneCounts = {};
  CANONICAL_ZONES.forEach(z => zoneCounts[z] = 0);

  for (let i = 0; i < hotels.length; i++) {
    const h = hotels[i];
    if (!h.name || typeof h.name !== "string" || !h.name.trim()) {
      throw new Error(`FALHA DE VALIDAÇÃO: Hotel no índice ${i} possui nome vazio!`);
    }
    if (!CANONICAL_ZONES.includes(h.zone)) {
      throw new Error(`FALHA DE VALIDAÇÃO: Hotel '${h.name}' possui zona inválida: '${h.zone}'!`);
    }
    if (namesSet.has(h.name.trim())) {
      throw new Error(`FALHA DE VALIDAÇÃO: Hotel duplicado detectado: '${h.name}'!`);
    }
    namesSet.add(h.name.trim());
    zoneCounts[h.zone]++;
  }

  // Validar conformidade de distribuição quantitativa
  for (const z of CANONICAL_ZONES) {
    if (zoneCounts[z] !== EXPECTED_ZONE_DISTRIBUTION[z]) {
      throw new Error(`FALHA DE VALIDAÇÃO: Divergência na zona '${z}': esperado ${EXPECTED_ZONE_DISTRIBUTION[z]}, encontrado ${zoneCounts[z]}`);
    }
  }

  return { hotels, zoneCounts };
}

// 4. Consulta Paginada de Hotéis Existentes no Banco Remoto
async function fetchAllExistingHotels(supabase) {
  let allRows = [];
  let from = 0;
  const PAGE_SIZE = 500;

  while (true) {
    const { data: page, error } = await supabase
      .from("hotels")
      .select("id, name, zone, active")
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      if (error.code === "PGRST205" || error.message.includes("Could not find the table")) {
        return { exists: false, records: [] };
      }
      throw new Error(`Erro ao consultar hotéis remotos (offset ${from}): ${error.message}`);
    }

    if (!page || page.length === 0) {
      break;
    }

    allRows = allRows.concat(page);
    if (page.length < PAGE_SIZE) {
      break;
    }
    from += PAGE_SIZE;
  }

  return { exists: true, records: allRows };
}

// 5. Verificação Pós-Importação no Supabase (em modo --execute)
async function verifyDatabaseIntegrityPostImport(supabase) {
  console.log("\n[VERIFICAÇÃO PÓS-IMPORTAÇÃO]");
  console.log("  Consultando tabela remota 'public.hotels' com paginação...");

  const { exists, records } = await fetchAllExistingHotels(supabase);

  if (!exists) {
    throw new Error("Tabela 'public.hotels' não foi encontrada após importação!");
  }

  console.log(`  Registros totais no banco remoto: ${records.length} (Esperado: 1125)`);
  if (records.length !== 1125) {
    throw new Error(`DIVERGÊNCIA PÓS-IMPORTAÇÃO: Banco contém ${records.length} registros, esperado 1.125!`);
  }

  const actualZoneCounts = {};
  CANONICAL_ZONES.forEach(z => actualZoneCounts[z] = 0);

  for (const r of records) {
    if (!actualZoneCounts.hasOwnProperty(r.zone)) {
      throw new Error(`DIVERGÊNCIA PÓS-IMPORTAÇÃO: Registro contém zona não-canônica: '${r.zone}'!`);
    }
    actualZoneCounts[r.zone]++;
  }

  let distributionOk = true;
  for (const z of CANONICAL_ZONES) {
    const actual = actualZoneCounts[z];
    const expected = EXPECTED_ZONE_DISTRIBUTION[z];
    const status = (actual === expected) ? "✓ OK" : "✗ ERRO";
    console.log(`  - ${z.padEnd(20)}: ${actual.toString().padStart(4)} / ${expected.toString().padStart(4)} [${status}]`);
    if (actual !== expected) {
      distributionOk = false;
    }
  }

  if (!distributionOk) {
    throw new Error("DIVERGÊNCIA PÓS-IMPORTAÇÃO: Distribuição por zona no banco diverge da documentação oficial!");
  }

  console.log("✓ Verificação pós-importação aprovada com 100% de conformidade!");
}

async function main() {
  const args = process.argv.slice(2);
  const isExecute = args.includes("--execute");
  const isDryRun = !isExecute;

  console.log("=============================================================================");
  console.log("=== IMPORTADOR OFICIAL DA BASE MESTRE DE HOTÉIS — TÍO NENÊ v0.1.43 ===");
  console.log(`=== MODO DE OPERAÇÃO: ${isExecute ? "EXECUÇÃO REAL NO BANCO" : "SIMULAÇÃO (DRY-RUN - SEGURO)"} ===`);
  console.log("=============================================================================\n");

  // A. Carregar e Validar Dados Locais
  console.log("[1/4] Validando integridade local da base oficial...");
  const { hotels, zoneCounts } = loadAndValidateHotelData();
  console.log("✓ Base local íntegra: exatamente 1.125 hotéis nas 8 zonas canônicas.");

  // B. Conectar ao Supabase
  console.log("\n[2/4] Conectando ao Supabase para leitura diagnóstica...");
  const { url, key, keyType } = loadSupabaseConfig(isExecute);
  console.log(`  URL: ${url}`);
  console.log(`  Tipo de credencial: ${keyType}`);
  const supabase = createClient(url, key);

  // C. Carregar Registros Existentes com Paginação
  console.log("\n[3/4] Consultando registros existentes com paginação estrita (.range())...");
  const { exists, records: existingRecords } = await fetchAllExistingHotels(supabase);

  if (!exists) {
    console.log("ℹ A tabela 'public.hotels' AINDA NÃO EXISTE no banco remoto.");
    console.log("  A migração 'supabase/migrations/20261022_create_hotels_master.sql' deve ser aplicada antes da importação.");
    if (isExecute) {
      throw new Error("Abortando execução real: a tabela 'public.hotels' precisa ser criada antes da importação.");
    }
  } else {
    console.log(`✓ Tabela 'public.hotels' detectada. Registros existentes: ${existingRecords.length}`);
  }

  // Mapear registros existentes por nome normalizado
  const existingMap = new Map();
  existingRecords.forEach(h => {
    existingMap.set(h.name.toLowerCase().trim(), h);
  });

  // Analisar impacto registro a registro
  let toInsert = 0;
  let toUpdateZone = 0;
  let unchanged = 0;
  let deactivatedPreserved = 0;

  for (const h of hotels) {
    const existing = existingMap.get(h.name.toLowerCase().trim());
    if (!existing) {
      toInsert++;
    } else {
      if (existing.active === false) {
        deactivatedPreserved++;
      }
      if (existing.zone !== h.zone) {
        toUpdateZone++;
      } else {
        unchanged++;
      }
    }
  }

  console.log("\n[ANÁLISE DE IMPACTO]");
  console.log(`  - Novos hotéis a inserir:               ${toInsert}`);
  console.log(`  - Hotéis com zona a atualizar:          ${toUpdateZone}`);
  console.log(`  - Hotéis idênticos (sem alteração):     ${unchanged}`);
  console.log(`  - Hotéis desativados preservados (fals): ${deactivatedPreserved}`);

  // D. Conclusão da Simulação (Dry-Run)
  if (isDryRun) {
    console.log("\n[4/4] Finalizando modo de simulação...");
    console.log("=============================================================================");
    console.log("RELATÓRIO DE SIMULAÇÃO (DRY-RUN):");
    console.log("  - NENHUMA alteração foi realizada no banco remoto.");
    console.log("  - A validação dos 1.125 hotéis foi 100% aprovada.");
    console.log("  - Para executar a importação quando autorizado na Tarefa 05B:");
    console.log("    node scripts/import_hotels_master.cjs --execute");
    console.log("=============================================================================");
    return;
  }

  // E. Execução Real (--execute)
  console.log("\n[4/4] Executando importação real no Supabase em lotes de 100...");
  const BATCH_SIZE = 100;
  let processedCount = 0;
  const now = new Date().toISOString();

  for (let i = 0; i < hotels.length; i += BATCH_SIZE) {
    const slice = hotels.slice(i, i + BATCH_SIZE);
    const batch = slice.map(h => {
      const existing = existingMap.get(h.name.toLowerCase().trim());
      const record = {
        name: h.name,
        zone: h.zone,
        // Preserva status 'active' caso o administrador tenha desativado manualmente
        active: existing && existing.active !== undefined ? existing.active : true,
        updated_at: now
      };
      // Preserva o UUID existente se o registro já constava no banco
      if (existing && existing.id) {
        record.id = existing.id;
      }
      return record;
    });

    const { error: upsertErr } = await supabase
      .from("hotels")
      .upsert(batch, { onConflict: "name" });

    if (upsertErr) {
      console.error(`\n[ERRO CRÍTICO] Falha no lote de registros ${i + 1} a ${i + batch.length}:`);
      console.error(`  Mensagem do banco: ${upsertErr.message}`);
      console.error(`  Código: ${upsertErr.code || "N/A"}`);
      console.error(`  ESTADO PARCIAL: Apenas ${processedCount} de ${hotels.length} foram processados antes da falha.`);
      throw new Error(`Importação abortada no lote ${i / BATCH_SIZE + 1}: ${upsertErr.message}`);
    }

    processedCount += batch.length;
    process.stdout.write(`  Progresso: ${processedCount}/${hotels.length} hotéis processados...\r`);
  }

  console.log(`\n✓ Todos os ${processedCount} hotéis foram enviados com sucesso em ${Math.ceil(hotels.length / BATCH_SIZE)} lotes.`);

  // F. Verificação pós-importação obrigatória
  await verifyDatabaseIntegrityPostImport(supabase);

  console.log("\n=============================================================================");
  console.log("=== IMPORTAÇÃO E VERIFICAÇÃO CONCLUÍDAS COM SUCESSO ABSOLUTO! ===");
  console.log("=============================================================================");
}

main().catch(err => {
  console.error("\n=============================================================================");
  console.error("FALHA NA EXECUÇÃO DO IMPORTADOR:");
  console.error(err.message);
  console.error("=============================================================================");
  process.exit(1);
});
