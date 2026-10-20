const fs = require("fs");
const path = require("path");
const { createClient } = require("d:/Z_UEB/TIONENE/node_modules/@supabase/supabase-js");

// Read .env
const envContent = fs.readFileSync("d:/Z_UEB/TIONENE/.env", "utf8");
let url = "https://pfsgpsvbsfowrtcyckcm.supabase.co";
let key = "";

for (const line of envContent.split("\n")) {
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
    url = line.split("=")[1].trim().replace(/["']/g, "");
  }
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY=")) {
    key = line.split("=")[1].trim().replace(/["']/g, "");
  }
}

const supabase = createClient(url, key);

// Read supplier catalog TypeScript file and extract data
const catalogTs = fs.readFileSync("d:/Z_UEB/TIONENE/src/data/supplier-catalog.ts", "utf8");

// Parse SUPPLIER_COST_OPTIONS from TS using a regex-based extractor or evaluation
function extractCatalogOptions() {
  const jsonStr = catalogTs
    .replace(/^[\s\S]*?export const SUPPLIER_COST_OPTIONS: SupplierCostOption\[\] = /m, "")
    .replace(/;\s*$/, "");
  
  // Safe evaluation in isolated context
  const fn = new Function(`return ${jsonStr}`);
  return fn();
}

async function run() {
  console.log("=== INÍCIO DA ETAPA 2: IMPORTAÇÃO E SINCRONIZAÇÃO DO CATÁLOGO ===");
  const options = extractCatalogOptions();
  console.log(`Carregadas ${options.length} opções canônicas de src/data/supplier-catalog.ts`);

  // 1. Obter fornecedores cadastrados no Supabase
  const { data: dbSuppliers, error: suppErr } = await supabase.from("suppliers").select("id, name, active");
  if (suppErr) {
    console.error("Erro ao buscar fornecedores:", suppErr);
    return;
  }
  console.log(`Encontrados ${dbSuppliers.length} fornecedores no Supabase.`);
  const supplierMap = new Map();
  dbSuppliers.forEach((s) => supplierMap.set(s.name.toLowerCase().trim(), s.id));

  // 2. Construir SQL completo para inserção em lote com subquery para supplier_id
  let sqlStatements = [];
  sqlStatements.push(`-- =============================================================================`);
  sqlStatements.push(`-- TIO NENÊ - ETAPA 2: CARGA DOS 42 REGISTROS CANÔNICOS (TN-001 A TN-042)`);
  sqlStatements.push(`-- Inserção idempotente com ON CONFLICT (code) DO UPDATE`);
  sqlStatements.push(`-- =============================================================================\n`);

  for (const opt of options) {
    const code = opt.code;
    const supName = opt.supplierName;
    const serviceName = (opt.serviceName || "").replace(/'/g, "''");
    const variant = opt.variant ? `'${opt.variant.replace(/'/g, "''")}'` : "NULL";
    const pricingModel = opt.pricingModel || "per_person";
    const costAdult = opt.costAdult !== undefined ? opt.costAdult : "NULL";
    const costChild = opt.costChild !== undefined ? opt.costChild : "NULL";
    const costInfant = opt.costInfant !== undefined ? opt.costInfant : "NULL";
    const costFixed = opt.costFixed !== undefined ? opt.costFixed : "NULL";
    const currency = opt.currency || "USD";
    const pricingRule = opt.pricingRule ? `'${opt.pricingRule.replace(/'/g, "''")}'` : "NULL";
    const extFees = opt.externalFeesNote ? `'${opt.externalFeesNote.replace(/'/g, "''")}'` : "NULL";
    const opDays = opt.operationDays ? `'${opt.operationDays.replace(/'/g, "''")}'` : "NULL";
    const opHours = opt.operationHours ? `'${opt.operationHours.replace(/'/g, "''")}'` : "NULL";
    const duration = opt.duration ? `'${opt.duration.replace(/'/g, "''")}'` : "NULL";
    const description = opt.description ? `'${opt.description.replace(/'/g, "''")}'` : "NULL";
    const included = opt.included ? `'${opt.included.replace(/'/g, "''")}'` : "NULL";
    const notIncluded = opt.notIncluded ? `'${opt.notIncluded.replace(/'/g, "''")}'` : "NULL";
    const opNotes = opt.operationalNotes ? `'${opt.operationalNotes.replace(/'/g, "''")}'` : "NULL";
    const commNotes = opt.commercialNotes ? `'${opt.commercialNotes.replace(/'/g, "''")}'` : "NULL";
    const pendingIssues = opt.pendingIssues ? `'${opt.pendingIssues.replace(/'/g, "''")}'` : "NULL";
    const sourceRef = opt.sourceReference ? `'${opt.sourceReference.replace(/'/g, "''")}'` : "'Prompt_Antigravity_Tio_Nene.md'";
    const valStatus = opt.validationStatus || "revisado";
    const publicSlug = opt.publicTourSlug ? `'${opt.publicTourSlug.replace(/'/g, "''")}'` : "NULL";

    const insertSql = `INSERT INTO public.supplier_cost_options (
  code, supplier_id, supplier_name, service_name, variant,
  pricing_model, cost_adult, cost_child, cost_infant, cost_fixed, currency,
  pricing_rule, external_fees_note, operation_days, operation_hours, duration,
  description, included, not_included, operational_notes, commercial_notes,
  pending_issues, source_reference, validation_status, public_tour_slug, active
) VALUES (
  '${code}',
  (SELECT id FROM public.suppliers WHERE LOWER(TRIM(name)) = LOWER(TRIM('${supName}')) LIMIT 1),
  '${supName}',
  '${serviceName}',
  ${variant},
  '${pricingModel}',
  ${costAdult},
  ${costChild},
  ${costInfant},
  ${costFixed},
  '${currency}',
  ${pricingRule},
  ${extFees},
  ${opDays},
  ${opHours},
  ${duration},
  ${description},
  ${included},
  ${notIncluded},
  ${opNotes},
  ${commNotes},
  ${pendingIssues},
  ${sourceRef},
  '${valStatus}',
  ${publicSlug},
  true
)
ON CONFLICT (code) DO UPDATE SET
  supplier_name = EXCLUDED.supplier_name,
  service_name = EXCLUDED.service_name,
  variant = EXCLUDED.variant,
  pricing_model = EXCLUDED.pricing_model,
  cost_adult = EXCLUDED.cost_adult,
  cost_child = EXCLUDED.cost_child,
  cost_infant = EXCLUDED.cost_infant,
  cost_fixed = EXCLUDED.cost_fixed,
  currency = EXCLUDED.currency,
  pricing_rule = EXCLUDED.pricing_rule,
  external_fees_note = EXCLUDED.external_fees_note,
  operation_days = EXCLUDED.operation_days,
  operation_hours = EXCLUDED.operation_hours,
  duration = EXCLUDED.duration,
  description = EXCLUDED.description,
  included = EXCLUDED.included,
  not_included = EXCLUDED.not_included,
  operational_notes = EXCLUDED.operational_notes,
  commercial_notes = EXCLUDED.commercial_notes,
  pending_issues = EXCLUDED.pending_issues,
  source_reference = EXCLUDED.source_reference,
  validation_status = EXCLUDED.validation_status,
  public_tour_slug = EXCLUDED.public_tour_slug,
  active = EXCLUDED.active,
  updated_at = now();`;

    sqlStatements.push(insertSql);
  }

  // 3. Atualizar o arquivo migration consolidado
  const existingMigration = fs.readFileSync("d:/Z_UEB/TIONENE/supabase/migrations/20261020_supplier_catalog_v2.sql", "utf8");
  const cutOffIndex = existingMigration.indexOf("-- -----------------------------------------------------------------------------\n-- 8. CARGA DAS 42 OPÇÕES CANÔNICAS");
  let headerSql = existingMigration;
  if (cutOffIndex !== -1) {
    headerSql = existingMigration.substring(0, cutOffIndex);
  }

  const fullSqlContent = `${headerSql.trim()}

-- -----------------------------------------------------------------------------
-- 8. CARGA DAS 42 OPÇÕES CANÔNICAS (TN-001 A TN-042)
-- -----------------------------------------------------------------------------
${sqlStatements.join("\n\n")}
`;

  fs.writeFileSync("d:/Z_UEB/TIONENE/supabase/migrations/20261020_supplier_catalog_v2.sql", fullSqlContent, "utf8");
  console.log("Arquivo supabase/migrations/20261020_supplier_catalog_v2.sql atualizado com DDL + 42 Inserts!");

  // 4. Testar se a tabela supplier_cost_options já existe no Supabase e tentar upsert direto via JS
  console.log("Testando se a tabela supplier_cost_options existe para inserção direta via Supabase JS...");
  const { data: testData, error: testErr } = await supabase.from("supplier_cost_options").select("id").limit(1);
  if (testErr) {
    console.log("Status da tabela supplier_cost_options:", testErr.message);
    console.log("=> A tabela ainda precisa ser criada executando o script SQL no painel Supabase.");
  } else {
    console.log("Tabela supplier_cost_options já existe! Executando upsert dos 42 registros via Supabase Client...");
    let inserted = 0;
    for (const opt of options) {
      const supId = supplierMap.get(opt.supplierName.toLowerCase().trim());
      const row = {
        code: opt.code,
        supplier_id: supId,
        supplier_name: opt.supplierName,
        service_name: opt.serviceName,
        variant: opt.variant || null,
        pricing_model: opt.pricingModel,
        cost_adult: opt.costAdult !== undefined ? opt.costAdult : null,
        cost_child: opt.costChild !== undefined ? opt.costChild : null,
        cost_infant: opt.costInfant !== undefined ? opt.costInfant : null,
        cost_fixed: opt.costFixed !== undefined ? opt.costFixed : null,
        currency: opt.currency,
        pricing_rule: opt.pricingRule || null,
        external_fees_note: opt.externalFeesNote || null,
        operation_days: opt.operationDays || null,
        operation_hours: opt.operationHours || null,
        duration: opt.duration || null,
        description: opt.description || null,
        included: opt.included || null,
        not_included: opt.notIncluded || null,
        operational_notes: opt.operationalNotes || null,
        commercial_notes: opt.commercialNotes || null,
        pending_issues: opt.pendingIssues || null,
        source_reference: opt.sourceReference || "Prompt_Antigravity_Tio_Nene.md",
        validation_status: opt.validationStatus,
        public_tour_slug: opt.publicTourSlug || null,
        active: true,
      };

      const { error: upsertErr } = await supabase.from("supplier_cost_options").upsert(row, { onConflict: "code" });
      if (upsertErr) {
        console.error(`Erro ao inserir ${opt.code}:`, upsertErr.message);
      } else {
        inserted++;
      }
    }
    console.log(`Sucesso: ${inserted}/42 registros sincronizados diretamente no Supabase!`);
  }
}

run().catch(console.error);
