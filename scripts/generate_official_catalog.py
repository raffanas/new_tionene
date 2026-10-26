import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('scratch_tours_rates.json', encoding='utf-8') as f:
    tr = json.load(f)

with open('scratch_shared_reference.json', encoding='utf-8') as f:
    sr = json.load(f)

tours = tr['tours']
rates = tr['rates']
zones = sr['zones']
seasons = sr['seasons']

out = []
out.append('// =============================================================================')
out.append('// BASE OFICIAL DE FORNECEDORES, PRODUTOS COMERCIAIS E TARIFAS — v0.1.43')
out.append('// Fonte: Tio_Nene_Phase_1_v0.1.43 (10 planilhas padronizadas + Shared Reference)')
out.append('// 52 Produtos Comerciais | 80 Tarifas Operacionais | 8 Zonas Hoteleiras | 6 Temporadas')
out.append('// =============================================================================\n')
out.append('import {')
out.append('  OfficialSupplier,')
out.append('  CommercialProduct,')
out.append('  SupplierRate,')
out.append('  HotelZoneMapping,')
out.append('  XcaretSeasonWindow')
out.append('} from "@/types/supplier-commercial";\n')

# 10 Suppliers
out.append('export const OFFICIAL_SUPPLIERS: OfficialSupplier[] = [')
out.append('  { id: "sup-bak", code: "BAK", name: "Baktun", trade_name: "Baktun Operadora", category: "Arqueologia & Cultura", currency_default: "USD", notes: "Fornecedor oficial de Chichén Itzá e tours culturais.", active: true, status: "ativo" },')
out.append('  { id: "sup-coc", code: "COC", name: "Coco Bongo", trade_name: "Coco Bongo Show & Disco", category: "Vida Noturna & Shows", currency_default: "USD", notes: "Ingressos oficiais de shows noturnos, packs e open bar em Cancún.", active: true, status: "ativo" },')
out.append('  { id: "sup-env", code: "ENV", name: "Envatours", trade_name: "Envatours Cancún", category: "Operadora Náutica & Passeios", currency_default: "USD", notes: "Barcos de vidro coletivos e privativos (1–10 pax) em Cancún, Isla Mujeres e Cozumel.", active: true, status: "ativo" },')
out.append('  { id: "sup-mig", code: "MIG", name: "Miguel Shuttle", trade_name: "Miguel Shuttle Transfers", category: "Transporte & Privativo", currency_default: "USD", notes: "Transfers privativos aeroporto ↔ hotel em van (1–7 passageiros). Tarifas por trecho e zona.", active: true, status: "ativo" },')
out.append('  { id: "sup-mtz", code: "MTZ", name: "MTZ Tours", trade_name: "MTZ Operações", category: "Receptivo Cancún", currency_default: "USD", notes: "Tours arqueológicos Tulum, Casa Tortuga, cenotes e Cirque du Soleil JOYÀ.", active: true, status: "ativo" },')
out.append('  { id: "sup-mus", code: "MUS", name: "MUSA", trade_name: "MUSA Museu Subaquático", category: "Mergulho & Náutica", currency_default: "USD", notes: "Mergulho com cilindro e museu subaquático em Cancún.", active: true, status: "ativo" },')
out.append('  { id: "sup-pjs", code: "PJS", name: "Parasailing & Jet Ski", trade_name: "Parasailing & Jet Ski Cancún", category: "Aventura & Náutica", currency_default: "USD", notes: "Atividades náuticas de voo panorâmico e jet ski (máx 2 pax/ski).", active: true, status: "ativo" },')
out.append('  { id: "sup-ply", code: "PLY", name: "Playa Mía", trade_name: "Playa Mía Grand Beach Park", category: "Operadora Náutica & Passeios", currency_default: "MXN", notes: "Passeio Cozumel el Cielo com saídas Cancún, Playa del Carmen e Cozumel (manual). Moeda MXN.", active: true, status: "ativo" },')
out.append('  { id: "sup-dol", code: "DOL", name: "The Dolphin Company", trade_name: "The Dolphin Company", category: "Vida Marinha & Parques", currency_default: "USD", notes: "17 produtos oficiais com nado de golfinhos e habitats marinhos.", active: true, status: "ativo" },')
out.append('  { id: "sup-xca", code: "XCA", name: "Xcaret", trade_name: "Grupo Xcaret", category: "Parques & Ecoturismo", currency_default: "USD", notes: "10 produtos oficiais de parques e ecoturismo, 27 tarifas regionais com transporte incluso.", active: true, status: "ativo" }')
out.append('];\n')

# 52 Products
out.append('export const OFFICIAL_COMMERCIAL_PRODUCTS: CommercialProduct[] = [')
for t in tours:
    p_code = t['Tour ID'].split('-')[0]
    out.append('  {')
    out.append(f'    tour_id: {json.dumps(t["Tour ID"] or "", ensure_ascii=False)},')
    out.append(f'    provider: {json.dumps(t["Provider"] or "", ensure_ascii=False)},')
    out.append(f'    provider_code: {json.dumps(p_code, ensure_ascii=False)},')
    out.append(f'    supplier_product_name: {json.dumps(t["Supplier Product Name"] or "", ensure_ascii=False)},')
    out.append(f'    display_name: {json.dumps(t["Display Name"] or "", ensure_ascii=False)},')
    out.append(f'    product_type: {json.dumps(t["Product Type"] or "Tour", ensure_ascii=False)},')
    subtype = t.get('Product Subtype')
    if subtype:
        out.append(f'    product_subtype: {json.dumps(subtype, ensure_ascii=False)},')
    out.append(f'    seller_visible: {json.dumps(t["Seller Visible"] == "Yes")},')
    out.append(f'    status: {json.dumps(t["Status"] or "Active", ensure_ascii=False)}')
    out.append('  },')
out.append('];\n')

# 80 Rates
out.append('export const OFFICIAL_SUPPLIER_RATES: SupplierRate[] = [')
for r in rates:
    out.append('  {')
    out.append(f'    rate_id: {json.dumps(r["Rate ID"] or "", ensure_ascii=False)},')
    out.append(f'    tour_id: {json.dumps(r["Tour ID"] or "", ensure_ascii=False)},')
    out.append(f'    supplier_rate_name: {json.dumps(r["Supplier Rate Name"] or "", ensure_ascii=False)},')
    out.append(f'    pricing_basis: {json.dumps(r["Pricing Basis"] or "Person", ensure_ascii=False)},')
    
    # Costs
    ac = r.get('Adult Cost')
    cc = r.get('Child Cost')
    fc = r.get('Fixed Cost')
    out.append(f'    adult_cost: {ac if ac is not None and ac != "" else "null"},')
    out.append(f'    child_cost: {cc if cc is not None and cc != "" else "null"},')
    out.append(f'    fixed_cost: {fc if fc is not None and fc != "" else "null"},')
    out.append(f'    currency: {json.dumps(r["Currency"] or "USD", ensure_ascii=False)},')
    
    if r.get('Tariff Region'):
        out.append(f'    tariff_region: {json.dumps(r["Tariff Region"], ensure_ascii=False)},')
    if r.get('Season'):
        out.append(f'    season: {json.dumps(r["Season"], ensure_ascii=False)},')
    if r.get('Days of Week'):
        out.append(f'    days_of_week: {json.dumps(r["Days of Week"], ensure_ascii=False)},')
    if r.get('Departure Area'):
        out.append(f'    departure_area: {json.dumps(r["Departure Area"], ensure_ascii=False)},')
    if r.get('Route'):
        out.append(f'    route: {json.dumps(r["Route"], ensure_ascii=False)},')
    if r.get('Minimum Passengers') is not None and r.get('Minimum Passengers') != '':
        out.append(f'    min_passengers: {r.get("Minimum Passengers")},')
    if r.get('Maximum Passengers') is not None and r.get('Maximum Passengers') != '':
        out.append(f'    max_passengers: {r.get("Maximum Passengers")},')
    out.append(f'    transportation_included: {json.dumps(r.get("Transportation Included") == "Yes")},')
    if r.get('Additional Charges'):
        out.append(f'    additional_charges: {json.dumps(r["Additional Charges"], ensure_ascii=False)},')
    if r.get('Effective From'):
        out.append(f'    effective_from: {json.dumps(str(r["Effective From"]), ensure_ascii=False)},')
    if r.get('Effective To'):
        out.append(f'    effective_to: {json.dumps(str(r["Effective To"]), ensure_ascii=False)},')
    out.append(f'    rate_status: {json.dumps(r["Rate Status"] or "Active", ensure_ascii=False)},')
    if r.get('Notes'):
        out.append(f'    notes: {json.dumps(r["Notes"], ensure_ascii=False)},')
    out.append('  },')
out.append('];\n')

# Zone mappings
out.append('export const OFFICIAL_HOTEL_ZONE_MAPPINGS: HotelZoneMapping[] = [')
for z in zones:
    out.append('  {')
    out.append(f'    hotel_zone: {json.dumps(z["Tío Nenê Hotel Zone"], ensure_ascii=False)},')
    out.append(f'    miguel_tariff_name: {json.dumps(z["Miguel Supplier Tariff"], ensure_ascii=False)},')
    out.append(f'    miguel_rate_id: {json.dumps(z["Miguel Rate ID"], ensure_ascii=False)},')
    out.append(f'    miguel_usd_vehicle: {z["Miguel USD / Vehicle / One Way"]},')
    out.append(f'    playa_mia_departure: {json.dumps(z["Playa Mía Departure"], ensure_ascii=False)},')
    out.append(f'    playa_mia_rate_id: {json.dumps(z["Playa Mía Rate ID"], ensure_ascii=False)},')
    out.append(f'    xcaret_core_region: {json.dumps(z["Xcaret Core Region"], ensure_ascii=False)},')
    out.append(f'    xcaret_de_noche_region: {json.dumps(z["Xcaret de Noche Region"], ensure_ascii=False)},')
    out.append(f'    xoximilco_region: {json.dumps(z["Xoximilco Region"], ensure_ascii=False)}')
    out.append('  },')
out.append('];\n')

# Xcaret seasons
out.append('export const OFFICIAL_XCARET_SEASONS_2026: XcaretSeasonWindow[] = [')
for s in seasons:
    app_tours = [tid.strip() for tid in str(s["Applies to Tour IDs"]).split(';') if tid.strip()]
    out.append('  {')
    out.append(f'    from_date: {json.dumps(str(s["From (inclusive)"]), ensure_ascii=False)},')
    out.append(f'    to_date: {json.dumps(str(s["To (inclusive)"]), ensure_ascii=False)},')
    out.append(f'    season: {json.dumps(s["Season"], ensure_ascii=False)},')
    out.append(f'    applicable_tour_ids: {json.dumps(app_tours, ensure_ascii=False)}')
    out.append('  },')
out.append('];\n')

code = '\n'.join(out)
with open('src/data/official-supplier-catalog.ts', 'w', encoding='utf-8') as f:
    f.write(code)

print(f'Wrote src/data/official-supplier-catalog.ts ({len(code)} bytes)')
