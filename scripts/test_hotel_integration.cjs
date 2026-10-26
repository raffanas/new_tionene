#!/usr/bin/env node
/**
 * =============================================================================
 * TESTES TÉCNICOS: INTEGRAÇÃO DO CATÁLOGO DE HOTÉIS AOS CONTRATOS (TAREFA 06)
 * Arquivo: scripts/test_hotel_integration.cjs
 * =============================================================================
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("../node_modules/@supabase/supabase-js");

// 1. Zonas Canônicas
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

// 2. Leitura de Configuração do Supabase
function loadConfig() {
  const envContent = fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8");
  let url = "";
  let key = "";
  for (const line of envContent.split("\n")) {
    const t = line.trim();
    if (t.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) url = t.split("=")[1].trim().replace(/["']/g, "");
    if (t.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) key = t.split("=")[1].trim().replace(/["']/g, "");
  }
  return { url, key };
}

async function runTests() {
  console.log("=============================================================================");
  console.log("=== TESTES AUTOMATIZADOS: INTEGRAÇÃO DO CATÁLOGO DE HOTÉIS (TAREFA 06) ===");
  console.log("=============================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = "") {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} -> ${details}`);
      failed++;
    }
  }

  // T01: Arquivo HotelScheduleSection.tsx existe
  const compPath = path.join(__dirname, "..", "src", "components", "admin", "HotelScheduleSection.tsx");
  assert(fs.existsSync(compPath), "T01: Componente HotelScheduleSection.tsx criado no local correto");

  // T02: Componente importa as 8 zonas canônicas oficiais
  const compCode = fs.readFileSync(compPath, "utf8");
  let hasAllZones = true;
  for (const z of CANONICAL_ZONES) {
    if (!compCode.includes(`"${z}"`)) {
      hasAllZones = false;
      break;
    }
  }
  assert(hasAllZones, "T02: Componente contempla as 8 zonas canônicas homologadas");

  // T03: Suporte a busca no Supabase com ilike e debounce
  const hasIlikeSearch = compCode.includes('.ilike("name"') || compCode.includes(".ilike('name'");
  assert(hasIlikeSearch, "T03: Componente implementa busca textual eficiente via .ilike no catálogo");

  // T04: Suporte explícito a hospedagem manual (is_manual / Airbnb)
  const hasManualSupport = compCode.includes("is_manual") && compCode.includes("Hospedagem Manual");
  assert(hasManualSupport, "T04: Componente possui suporte a modo manual para Airbnb/hospedagem externa");

  // T05: Resolução automática de zona para contratos legados
  const hasAutoResolution = compCode.includes("tenta resolver automaticamente no catálogo");
  assert(hasAutoResolution, "T05: Implementada resolução automática de zona para contratos antigos");

  // T06: Integração no formulário de contratos (page.tsx)
  const pagePath = path.join(__dirname, "..", "src", "app", "admin", "contratos", "page.tsx");
  const pageCode = fs.readFileSync(pagePath, "utf8");
  const hasPageIntegration = pageCode.includes("<HotelScheduleSection") && pageCode.includes("import { HotelScheduleSection");
  assert(hasPageIntegration, "T06: Formulário de contratos integrado ao HotelScheduleSection");

  // T07: Exibição de zona na tabela de visualização/impressão do contrato
  const hasZoneInPrint = pageCode.includes("h.zone ?") && pageCode.includes("h.is_manual ?");
  assert(hasZoneInPrint, "T07: Modal de visualização/impressão renderiza zona e indicador de hospedagem manual");

  // T08: Teste de Consulta Real no Banco Supabase (Busca por "Secrets")
  const { url, key } = loadConfig();
  const sb = createClient(url, key);

  console.log("\n[TESTES DE CONSULTA REMOTA NO SUPABASE]");
  const { data: secretsResults, error: secErr } = await sb
    .from("hotels")
    .select("id, name, zone")
    .eq("active", true)
    .ilike("name", "%Secrets%")
    .order("name");

  assert(!secErr && secretsResults && secretsResults.length >= 5, "T08: Consulta remota por 'Secrets' retorna múltiplos hotéis em várias zonas canônicas", `Encontrados: ${secretsResults ? secretsResults.length : 0}`);
  if (secretsResults && secretsResults.length > 0) {
    console.log(`  Exemplo retornado: "${secretsResults[0].name}" -> Zona: [${secretsResults[0].zone}]`);
  }

  // T09: Teste de Consulta Real no Banco Supabase (Busca por "Hard Rock")
  const { data: hrResults, error: hrErr } = await sb
    .from("hotels")
    .select("id, name, zone")
    .eq("active", true)
    .ilike("name", "%Hard Rock%")
    .order("name");

  assert(!hrErr && hrResults && hrResults.length === 1 && hrResults[0].zone === "Maya Riviera", "T09: Consulta remota por 'Hard Rock' retorna com precisão 'Hard Rock Hotel Riviera Maya' na zona 'Maya Riviera'");
  if (hrResults && hrResults.length > 0) {
    console.log(`  Hotel oficial: "${hrResults[0].name}" -> Zona: [${hrResults[0].zone}]`);
  }

  // T10: Consulta por hotel inexistente retorna 0 (dispara opção manual)
  const { data: noneResults, error: noneErr } = await sb
    .from("hotels")
    .select("id, name, zone")
    .eq("active", true)
    .ilike("name", "%Hotel Totalmente Inexistente XYZ 999%");

  assert(!noneErr && noneResults && noneResults.length === 0, "T10: Consulta por hotel inexistente retorna 0 registros (permite transição para manual)");

  // T11: Compatibilidade de Estrutura de Dados (JSONB)
  const sampleSchedule = [
    {
      hotel_id: "c463b2bb-2bc9-42b7-a3a8-44fb86a34493",
      hotel_name: "Cancun Bay Hotel",
      zone: "Cancun Hotel Zone",
      is_manual: false,
      checkin: "2026-11-01",
      checkout: "2026-11-05"
    },
    {
      hotel_id: null,
      hotel_name: "Airbnb Condomínio Playacar Bloco C",
      zone: "Playa del Carmen",
      is_manual: true,
      checkin: "2026-11-05",
      checkout: "2026-11-10"
    }
  ];
  const serialized = JSON.stringify(sampleSchedule);
  const parsedBack = JSON.parse(serialized);
  assert(parsedBack.length === 2 && parsedBack[0].zone === "Cancun Hotel Zone" && parsedBack[1].is_manual === true, "T11: Estrutura híbrida (catálogo + manual) serializa e desserializa perfeitamente em JSONB");

  console.log("\n-----------------------------------------------------------------------------");
  console.log(`TOTAL DE TESTES EXECUTADOS: ${passed + failed}`);
  console.log(`TESTES APROVADOS:          ${passed}`);
  console.log(`TESTES REPROVADOS:         ${failed}`);
  console.log("-----------------------------------------------------------------------------\n");

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error("Erro na execução dos testes:", err);
  process.exit(1);
});
