#!/usr/bin/env python3
"""
importar-precos.py
Reads two Excel purchase files (May and June 2026) and generates a JSON
with normalized product prices for use in the cardapio system.
"""

import json
import re
import unicodedata
from datetime import date
from collections import defaultdict

import openpyxl

# ── File paths ────────────────────────────────────────────────────────────────
UPLOAD_DIR = "/root/.claude/uploads/355c707a-c345-5e5c-a6e6-ccc665872fd2"
MAIO_FILE  = f"{UPLOAD_DIR}/6f1de140-Compras_de_alimenacao_funcionario_Maio26.xlsx"
JUNHO_FILE = f"{UPLOAD_DIR}/2807cbb4-Compras_de_alimenacao_funcionario_Junho26.xlsx"
OUTPUT_FILE = "/home/user/tatasushireservas/src/lib/cardapio/precos-compras.json"

# ── Name normalisation ────────────────────────────────────────────────────────
# Patterns to strip (applied sequentially before final cleanup)
# Order matters: strip "FUNCIONARIO/S" chunks and unit suffixes

_STRIP_PATTERNS = [
    # Remove "- FUNCIONARIO(S)" or "FUNCIONARIO(S)" with optional dash/space before
    r'[\s\-]*\bFUNCIONARIOS?\b',
    # Remove unit suffixes at end of string (with optional leading dash/space)
    r'[\s\-]+\bKILO\b\s*$',
    r'[\s\-]+\bKG\b\s*$',
    r'[\s\-]+\bUN\b\s*$',
    r'[\s\-]+\bL\b\s*$',
    # Remove trailing standalone numbers / codes at very end
    r'\s+\d+\s*$',
]

_COMPILED = [(re.compile(p, re.IGNORECASE), '') for p in _STRIP_PATTERNS]


def normalize_name(raw: str) -> str:
    """Normalize a product name according to the project rules."""
    name = raw.strip().upper()

    # Apply strip patterns
    for pattern, repl in _COMPILED:
        name = pattern.sub(repl, name)

    # Lowercase
    name = name.lower().strip()

    # Remove accents (NFD → ASCII letters only)
    name = unicodedata.normalize('NFD', name)
    name = ''.join(
        c for c in name
        if unicodedata.category(c) != 'Mn'  # drop combining marks
    )

    # Keep only letters, digits, and spaces  (keep digits inside words, e.g. "5kg")
    name = re.sub(r'[^a-z0-9 ]', ' ', name)

    # Collapse multiple spaces
    name = re.sub(r'\s+', ' ', name).strip()

    return name


# ── Excel reader ──────────────────────────────────────────────────────────────
def parse_date(value) -> str | None:
    """Return ISO date string from a cell value (date object or 'DD/MM/YYYY' string)."""
    if value is None:
        return None
    if isinstance(value, (date,)):
        return value.isoformat()
    if hasattr(value, 'date'):          # datetime
        return value.date().isoformat()
    s = str(value).strip()
    m = re.match(r'^(\d{1,2})/(\d{1,2})/(\d{4})$', s)
    if m:
        d, mo, y = m.groups()
        return f"{y}-{mo.zfill(2)}-{d.zfill(2)}"
    return None


def parse_float(value) -> float:
    """Parse a cell value to float, handling comma decimals."""
    if value is None:
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value).replace(',', '.').strip()
    try:
        return float(s)
    except ValueError:
        return 0.0


def read_purchases(filepath: str, mes_label: str) -> list[dict]:
    """
    Read one Excel file and return a list of purchase records.
    Expected columns (row 1 = headers):
      A: Código  B: Nome do Produto  C: UN  D: Entrada  E: Quantidade
      F: Valor Unitário  G: Valor Total
    """
    wb = openpyxl.load_workbook(filepath, data_only=True)
    ws = wb.active

    rows_iter = ws.iter_rows(values_only=True)

    # Find header row (skip until we see "Nome do Produto" or similar)
    header = None
    col_map = {}
    for row in rows_iter:
        # Try to detect header by looking for known column names
        row_vals = [str(c).strip().upper() if c is not None else '' for c in row]
        if any('NOME' in v for v in row_vals):
            header = row_vals
            break

    if header is None:
        raise ValueError(f"Could not find header row in {filepath}")

    # Map column names to indices
    name_aliases    = {'NOME', 'NOME DO PRODUTO', 'PRODUTO'}
    un_aliases      = {'UN', 'UNIDADE', 'UND'}
    entrada_aliases = {'ENTRADA', 'DATA', 'DT ENTRADA'}
    qtd_aliases     = {'QTD', 'QUANTIDADE', 'QTDE'}
    vunit_aliases   = {'VALOR UNITÁRIO', 'VALOR UNITARIO', 'VL UNIT', 'UNIT', 'VR UNIT'}
    vtotal_aliases  = {'VALOR TOTAL', 'VL TOTAL', 'TOTAL'}

    def find_col(aliases):
        for i, h in enumerate(header):
            for a in aliases:
                if a in h:
                    return i
        return None

    idx_nome   = find_col(name_aliases)
    idx_un     = find_col(un_aliases)
    idx_data   = find_col(entrada_aliases)
    idx_qtd    = find_col(qtd_aliases)
    idx_vunit  = find_col(vunit_aliases)
    idx_vtotal = find_col(vtotal_aliases)

    print(f"  [{mes_label}] columns → nome={idx_nome} un={idx_un} data={idx_data} "
          f"qtd={idx_qtd} vunit={idx_vunit} vtotal={idx_vtotal}")

    records = []
    for row in rows_iter:
        if all(c is None for c in row):
            continue
        nome_raw = row[idx_nome] if idx_nome is not None else None
        if nome_raw is None or str(nome_raw).strip() == '':
            continue

        un_raw    = row[idx_un]    if idx_un    is not None else None
        data_raw  = row[idx_data]  if idx_data  is not None else None
        qtd_raw   = row[idx_qtd]   if idx_qtd   is not None else None
        vunit_raw = row[idx_vunit] if idx_vunit is not None else None
        vtotal_raw= row[idx_vtotal]if idx_vtotal is not None else None

        nome_norm = normalize_name(str(nome_raw))
        if not nome_norm:
            continue

        records.append({
            'mes':      mes_label,
            'nome_orig': str(nome_raw).strip(),
            'nome':     nome_norm,
            'un':       str(un_raw).strip().upper() if un_raw else 'UN',
            'data':     parse_date(data_raw),
            'qtd':      parse_float(qtd_raw),
            'vunit':    parse_float(vunit_raw),
            'vtotal':   parse_float(vtotal_raw),
        })

    wb.close()
    print(f"  [{mes_label}] {len(records)} purchase rows read.")
    return records


# ── Aggregation helpers ───────────────────────────────────────────────────────

def latest_price(records: list[dict]) -> tuple[float, str]:
    """
    From a list of purchase records for the same item/month,
    return (unit_price, unidade) for the latest date.
    Tie-break: largest quantity, then first occurrence.
    """
    sorted_recs = sorted(
        records,
        key=lambda r: (r['data'] or '0000-00-00', r['qtd']),
        reverse=True
    )
    best = sorted_recs[0]
    return best['vunit'], best['un']


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("Reading Excel files…")
    maio_records  = read_purchases(MAIO_FILE,  'Maio26')
    junho_records = read_purchases(JUNHO_FILE, 'Junho26')
    all_records   = maio_records + junho_records

    # Group historico by normalized name
    historico_raw: dict[str, list[dict]] = defaultdict(list)
    for r in all_records:
        historico_raw[r['nome']].append(r)

    # Build historico (sorted by date asc)
    historico = {}
    for nome, recs in historico_raw.items():
        sorted_recs = sorted(recs, key=lambda r: (r['data'] or '0000-00-00'))
        historico[nome] = [
            {
                'data':  rec['data'],
                'valor': rec['vunit'],
                'qtd':   rec['qtd'],
                'unid':  rec['un'],
                'mes':   rec['mes'],
            }
            for rec in sorted_recs
        ]

    # Build precos and unidades:
    #   - If item appears in June → use latest June price
    #   - Otherwise → use latest May price
    junho_by_nome: dict[str, list[dict]] = defaultdict(list)
    maio_by_nome:  dict[str, list[dict]] = defaultdict(list)
    for r in junho_records:
        junho_by_nome[r['nome']].append(r)
    for r in maio_records:
        maio_by_nome[r['nome']].append(r)

    all_names = set(historico_raw.keys())
    precos   = {}
    unidades = {}
    for nome in sorted(all_names):
        if nome in junho_by_nome:
            price, unid = latest_price(junho_by_nome[nome])
        else:
            price, unid = latest_price(maio_by_nome[nome])
        precos[nome]   = round(price, 4)
        unidades[nome] = unid

    # Build comparativo: items in both months with >1% variation
    items_in_both = set(junho_by_nome.keys()) & set(maio_by_nome.keys())
    comparativo_list = []
    for nome in items_in_both:
        preco_maio, unid_maio   = latest_price(maio_by_nome[nome])
        preco_junho, _          = latest_price(junho_by_nome[nome])
        if preco_maio == 0:
            continue
        variacao = round((preco_junho - preco_maio) / preco_maio * 100, 2)
        if abs(variacao) > 1.0:
            comparativo_list.append({
                'item':     nome,
                'maio':     round(preco_maio, 4),
                'junho':    round(preco_junho, 4),
                'variacao': variacao,
                'unid':     unid_maio,
            })
    comparativo_list.sort(key=lambda x: abs(x['variacao']), reverse=True)

    # Monthly spend
    gasto_maio  = round(sum(r['vtotal'] for r in maio_records), 2)
    gasto_junho = round(sum(r['vtotal'] for r in junho_records), 2)

    # Assemble output
    output = {
        "geradoEm": "2026-06-18",
        "fontes":   ["Maio26", "Junho26"],
        "precos":   precos,
        "unidades": unidades,
        "historico": historico,
        "comparativo": comparativo_list,
        "gastoMensal": {
            "maio":  gasto_maio,
            "junho": gasto_junho,
        },
    }

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\nJSON written to: {OUTPUT_FILE}")

    # ── Summary ──────────────────────────────────────────────────────────────
    total_unique  = len(all_names)
    total_junho   = len(junho_by_nome)
    total_maio_only = len(all_names) - len(items_in_both)
    price_alerts  = sum(1 for c in comparativo_list if abs(c['variacao']) > 5.0)

    print("\n── SUMMARY ──────────────────────────────────────────────")
    print(f"  Total unique items:        {total_unique}")
    print(f"  Items with June price:     {total_junho}")
    print(f"  May-only items:            {total_maio_only}")
    print(f"  Price alerts (>5% change): {price_alerts}")
    print(f"  Gasto Maio:   R$ {gasto_maio:,.2f}")
    print(f"  Gasto Junho:  R$ {gasto_junho:,.2f}")
    print(f"  Comparativo entries (>1%): {len(comparativo_list)}")

    print("\n── FIRST 20 ENTRIES IN 'precos' ─────────────────────────")
    for i, (k, v) in enumerate(list(precos.items())[:20]):
        print(f"  {k!r:45s}: {v}")

    print("\nDone.")


if __name__ == '__main__':
    main()
