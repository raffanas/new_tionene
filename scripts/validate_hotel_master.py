import os
import unicodedata
import openpyxl
import json

XLSX_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "Tio_Nene_Phase_1_v0.1.43",
    "Data",
    "Hotel_Master",
    "Ultimate_Tio_Nene_Hotels_Two_Columns.xlsx"
)

CANONICAL_ZONES = [
    "Puerto Juarez",
    "Isla Blanca",
    "Cancun Center",
    "Cancun Hotel Zone",
    "Maya Riviera",
    "Playa del Carmen",
    "Tulum Center",
    "Tulum Hotel Zone"
]

def normalize_text(text):
    if not text:
        return ""
    # Remove accents, lower case, strip whitespace
    nfkd = unicodedata.normalize('NFKD', text)
    no_accent = "".join([c for c in nfkd if not unicodedata.combining(c)])
    return " ".join(no_accent.lower().split())

def validate():
    print(f"=== VALIDACAO DA PLANILHA MESTRE DE HOTEIS ===")
    print(f"Caminho do arquivo: {XLSX_PATH}")
    
    if not os.path.exists(XLSX_PATH):
        print(f"ERRO: Arquivo nao encontrado em {XLSX_PATH}")
        return

    wb = openpyxl.load_workbook(XLSX_PATH, data_only=True)
    sheet_names = wb.sheetnames
    print(f"Abas encontradas ({len(sheet_names)}): {sheet_names}")
    
    sheet = wb["Final Hotel Database"] if "Final Hotel Database" in sheet_names else wb.active
    print(f"Aba em analise: '{sheet.title}'")

    rows = list(sheet.iter_rows(values_only=True))
    if not rows:
        print("ERRO: Planilha vazia!")
        return

    header = rows[0]
    data_rows = rows[1:]
    print(f"Cabecalho detectado: {header}")
    print(f"Linhas totais lidas (excluindo cabecalho): {len(data_rows)}")

    # Validacao de colunas
    col_hotel = header[0]
    col_zone = header[1]
    
    hotels = []
    zone_counts = {z: 0 for z in CANONICAL_ZONES}
    unknown_zones = {}
    
    exact_names = set()
    exact_duplicates = []
    
    norm_names = {}
    norm_duplicates = []
    
    whitespace_issues = []
    empty_rows = 0

    for idx, row in enumerate(data_rows, start=2):
        raw_hotel = row[0]
        raw_zone = row[1]
        
        if raw_hotel is None and raw_zone is None:
            empty_rows += 1
            continue

        hotel_str = str(raw_hotel).strip() if raw_hotel is not None else ""
        zone_str = str(raw_zone).strip() if raw_zone is not None else ""

        if not hotel_str:
            print(f"AVISO: Linha {idx} possui Hotel Name vazio!")
            continue

        # Check leading/trailing spaces
        if raw_hotel != hotel_str:
            whitespace_issues.append((idx, "Hotel Name", repr(raw_hotel), repr(hotel_str)))
        if raw_zone != zone_str:
            whitespace_issues.append((idx, "Zone", repr(raw_zone), repr(zone_str)))

        # Exact duplicate check
        if hotel_str in exact_names:
            exact_duplicates.append((idx, hotel_str))
        else:
            exact_names.add(hotel_str)

        # Normalized duplicate check
        norm = normalize_text(hotel_str)
        if norm in norm_names:
            norm_duplicates.append((idx, hotel_str, norm_names[norm]))
        else:
            norm_names[norm] = (idx, hotel_str)

        # Zone validation
        if zone_str in zone_counts:
            zone_counts[zone_str] += 1
        else:
            unknown_zones[zone_str] = unknown_zones.get(zone_str, 0) + 1

        hotels.append({
            "line": idx,
            "name": hotel_str,
            "zone": zone_str
        })

    print(f"\n--- RESULTADOS DA VERIFICACAO ---")
    print(f"Total de hoteis validos processados: {len(hotels)}")
    print(f"Linhas em branco descartadas no final: {empty_rows}")
    print(f"Duplicatas exatas de nome: {len(exact_duplicates)}")
    if exact_duplicates:
        for d in exact_duplicates[:10]:
            print(f"  - Linha {d[0]}: {d[1]}")

    print(f"Duplicatas normalizadas (case/acento/espaco): {len(norm_duplicates)}")
    if norm_duplicates:
        for d in norm_duplicates[:10]:
            print(f"  - Linha {d[0]} ('{d[1]}') colide com Linha {d[2][0]} ('{d[2][1]}')")

    print(f"Problemas de espacamento (leading/trailing): {len(whitespace_issues)}")
    if whitespace_issues:
        for w in whitespace_issues[:5]:
            print(f"  - Linha {w[0]} em {w[1]}: original {w[2]} -> trimmed {w[3]}")

    print(f"\n--- DISTRIBUICAO POR ZONA CANONICA ---")
    for z in CANONICAL_ZONES:
        print(f"  - {z:20}: {zone_counts[z]:4} hoteis")
    
    total_canonical = sum(zone_counts.values())
    print(f"Total em zonas canonicas: {total_canonical}")

    if unknown_zones:
        print(f"ALERTA: Zonas desconhecidas encontradas ({len(unknown_zones)}):")
        for uz, count in unknown_zones.items():
            print(f"  - '{uz}': {count}")
    else:
        print(f"TODOS os {len(hotels)} hoteis pertencem estritamente as 8 zonas canonicas oficiais!")

    # Save clean JSON export for importer and testing
    json_export_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "hotels_master_validated.json"
    )
    with open(json_export_path, "w", encoding="utf-8") as f:
        json.dump({
            "version": "v0.1.43",
            "source_file": "Ultimate_Tio_Nene_Hotels_Two_Columns.xlsx",
            "sheet_name": sheet.title,
            "total_hotels": len(hotels),
            "zone_distribution": zone_counts,
            "hotels": [{"name": h["name"], "zone": h["zone"]} for h in hotels]
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\nArquivo JSON validado gerado com sucesso em: {json_export_path}")

if __name__ == "__main__":
    validate()
