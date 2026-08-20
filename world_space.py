# ============================================================
# 🌎 SPACE DATA CENTER
# WORLD SPACE R&D
#
# OECD GBARD NABS07
# NABS03 = Exploration and exploitation of space
#
# OECD:
#   NABS03
#   XDC = National currency
#
# Output:
#   data/world-space.json
# ============================================================

import csv
import io
import json
import re
import sys
from pathlib import Path

import requests


# ============================================================
# CONFIG
# ============================================================

START_YEAR = 2010
END_YEAR = 2025

OUTPUT_FILE = Path("data/world-space.json")

OECD_AGENCY = "OECD.STI.STP"
OECD_DATAFLOW = "DSD_RDS_GOV@DF_GBARD_NABS07"
OECD_VERSION = "1.0"

NABS_CODE = "NABS03"

NABS_LABEL = (
    "Exploration and exploitation of space"
)


# ============================================================
# COUNTRIES
# ============================================================

COUNTRIES = [
    "USA",
    "CHN",
    "JPN",
    "KOR",
    "DEU",
    "FRA",
    "GBR",
]


COUNTRY_NAMES = {
    "USA": "United States",
    "CHN": "China",
    "JPN": "Japan",
    "KOR": "Korea",
    "DEU": "Germany",
    "FRA": "France",
    "GBR": "United Kingdom",
}


COUNTRY_CURRENCIES = {
    "USA": "USD",
    "CHN": "CNY",
    "JPN": "JPY",
    "KOR": "KRW",
    "DEU": "EUR",
    "FRA": "EUR",
    "GBR": "GBP",
}


# ============================================================
# ECB
#
# 2026-03-31
#
# 1 EUR = X currency
# ============================================================

ECB_DATE = "2026-03-31"

ECB_RATES = {
    "EUR": 1.0,
    "USD": 1.1498,
    "CNY": 7.9341,
    "JPY": 183.39,
    "KRW": 1753.22,
    "GBP": 0.86833,
}


# ============================================================
# OECD URL
# ============================================================

def build_oecd_url():

    country_key = "+".join(
        COUNTRIES
    )

    sdmx_key = (
        f"{country_key}"
        f".A..{NABS_CODE}"
        f"+_T...XDC.Q+V"
    )

    return (
        "https://sdmx.oecd.org/public/rest/data/"
        f"{OECD_AGENCY},"
        f"{OECD_DATAFLOW},"
        f"{OECD_VERSION}/"
        f"{sdmx_key}"
        f"?startPeriod={START_YEAR}"
        f"&endPeriod={END_YEAR}"
        "&dimensionAtObservation=AllDimensions"
        "&format=csvfile"
    )


# ============================================================
# HTTP
# ============================================================

session = requests.Session()

session.headers.update({
    "User-Agent": "SpaceDataCenter/1.0",
    "Accept": "text/csv",
})


# ============================================================
# DOWNLOAD
# ============================================================

def download_oecd():

    url = build_oecd_url()

    print()
    print("=" * 70)
    print("📡 OECD GBARD NABS03")
    print("=" * 70)

    print()
    print("OECD URL:")
    print(url)

    try:

        response = session.get(
            url,
            timeout=180,
        )

        print()
        print(
            f"HTTP STATUS: "
            f"{response.status_code}"
        )

        response.raise_for_status()

        text = response.text

        if not text.strip():

            raise RuntimeError(
                "OECD response is empty."
            )

        print()
        print(
            "✅ OECD response received"
        )

        print(
            f"Size: "
            f"{len(text):,} bytes"
        )

        return text

    except requests.RequestException as error:

        print()
        print(
            "❌ OECD API request failed"
        )

        print(error)

        return None


# ============================================================
# CSV
# ============================================================

def parse_csv(text):

    reader = csv.DictReader(
        io.StringIO(text)
    )

    if not reader.fieldnames:

        raise RuntimeError(
            "CSV header not found."
        )

    print()
    print("=" * 70)
    print("📄 OECD CSV COLUMNS")
    print("=" * 70)

    for field in reader.fieldnames:

        print(
            f"  {field}"
        )

    rows = list(reader)

    print()
    print(
        f"Rows: {len(rows):,}"
    )

    return reader.fieldnames, rows


# ============================================================
# COLUMN FINDER
# ============================================================

def find_column(
    fieldnames,
    candidates,
):

    normalized = {}

    for field in fieldnames:

        key = (
            field
            .strip()
            .upper()
            .replace(
                " ",
                "_",
            )
        )

        normalized[key] = field

    for candidate in candidates:

        key = (
            candidate
            .strip()
            .upper()
            .replace(
                " ",
                "_",
            )
        )

        if key in normalized:

            return normalized[key]

    return None


# ============================================================
# COLUMNS
# ============================================================

def get_columns(fieldnames):

    columns = {

        "country": find_column(
            fieldnames,
            [
                "REF_AREA",
            ],
        ),

        "seo": find_column(
            fieldnames,
            [
                "SEO",
            ],
        ),

        "unit": find_column(
            fieldnames,
            [
                "UNIT_MEASURE",
            ],
        ),

        "price": find_column(
            fieldnames,
            [
                "PRICE_BASE",
            ],
        ),

        "year": find_column(
            fieldnames,
            [
                "TIME_PERIOD",
            ],
        ),

        "value": find_column(
            fieldnames,
            [
                "OBS_VALUE",
            ],
        ),

    }

    print()
    print("=" * 70)
    print("🔎 DETECTED COLUMNS")
    print("=" * 70)

    for key, value in columns.items():

        if value:

            print(
                f"✅ {key}: {value}"
            )

        else:

            print(
                f"❌ {key}: NOT FOUND"
            )

    return columns


# ============================================================
# SHOW REAL VALUES
# ============================================================

def show_real_values(
    rows,
    columns,
):

    print()
    print("=" * 70)
    print("🔬 ACTUAL OECD VALUES")
    print("=" * 70)

    # --------------------------------------------------------
    # SEO
    # --------------------------------------------------------

    seo_values = sorted(
        {
            str(
                row.get(
                    columns["seo"],
                    "",
                )
            ).strip()
            for row in rows
        }
    )

    print()
    print("SEO:")

    for value in seo_values:

        if value:

            print(
                f"  {value}"
            )

    # --------------------------------------------------------
    # UNIT
    # --------------------------------------------------------

    unit_values = sorted(
        {
            str(
                row.get(
                    columns["unit"],
                    "",
                )
            ).strip()
            for row in rows
        }
    )

    print()
    print("UNIT_MEASURE:")

    for value in unit_values:

        if value:

            print(
                f"  {value}"
            )

    # --------------------------------------------------------
    # PRICE
    # --------------------------------------------------------

    price_values = sorted(
        {
            str(
                row.get(
                    columns["price"],
                    "",
                )
            ).strip()
            for row in rows
        }
    )

    print()
    print("PRICE_BASE:")

    for value in price_values:

        if value:

            print(
                f"  {value}"
            )

    # --------------------------------------------------------
    # TIME
    # --------------------------------------------------------

    time_values = sorted(
        {
            str(
                row.get(
                    columns["year"],
                    "",
                )
            ).strip()
            for row in rows
        }
    )

    print()
    print("TIME_PERIOD:")

    for value in time_values:

        if value:

            print(
                f"  {value}"
            )

        if len(time_values) > 30:

            break


# ============================================================
# PARSE YEAR
# ============================================================

def parse_year(value):

    if value is None:

        return None

    text = str(
        value
    ).strip()

    # --------------------------------------------------------
    # 2024
    # 2024-Q1
    # 2024-01
    # 2024-01-01
    # --------------------------------------------------------

    match = re.match(
        r"^(\d{4})",
        text,
    )

    if not match:

        return None

    year = int(
        match.group(1)
    )

    if (
        START_YEAR
        <= year
        <= END_YEAR
    ):

        return year

    return None


# ============================================================
# NUMBER
# ============================================================

def parse_number(value):

    if value is None:

        return None

    text = str(
        value
    ).strip()

    if not text:

        return None

    if text.upper() in {
        ".",
        "..",
        "...",
        "NA",
        "N/A",
        "NULL",
    }:

        return None

    text = (
        text
        .replace(
            ",",
            "",
        )
        .replace(
            " ",
            "",
        )
    )

    try:

        return float(text)

    except ValueError:

        return None


# ============================================================
# FIND CURRENT-PRICE CODE
# ============================================================

def find_current_price_code(
    rows,
    columns,
):

    values = {}

    for row in rows:

        price = str(
            row.get(
                columns["price"],
                "",
            )
        ).strip()

        if price:

            values[price] = (
                values.get(
                    price,
                    0,
                )
                + 1
            )

    print()
    print("=" * 70)
    print("💰 PRICE_BASE ANALYSIS")
    print("=" * 70)

    for code, count in sorted(
        values.items()
    ):

        print(
            f"  {code}: "
            f"{count} rows"
        )

    # --------------------------------------------------------
    # OECD current-price convention
    #
    # If Q exists, use Q.
    # Otherwise select the only available
    # PRICE_BASE value returned by the exact
    # NABS03/XDC query.
    # --------------------------------------------------------

    if "Q" in values:

        print()
        print(
            "✅ Current price code: Q"
        )

        return "Q"

    if len(values) == 1:

        code = next(
            iter(values)
        )

        print()
        print(
            "ℹ️ OECD returned one "
            "PRICE_BASE code:"
        )

        print(
            f"   {code}"
        )

        print(
            "   Using this code."
        )

        return code

    print()
    print(
        "❌ Could not determine "
        "current PRICE_BASE."
    )

    return None


# ============================================================
# FILTER
# ============================================================

def filter_data(
    rows,
    columns,
):

    print()
    print("=" * 70)
    print("🎯 FILTERING")
    print("=" * 70)

    current_price_code = (
        find_current_price_code(
            rows,
            columns,
        )
    )

    if current_price_code is None:

        return {}

    data = {}

    counters = {
        "total": 0,
        "country": 0,
        "seo": 0,
        "unit": 0,
        "price": 0,
        "year": 0,
        "value": 0,
    }

    for row in rows:

        counters["total"] += 1

        # ----------------------------------------------------
        # COUNTRY
        # ----------------------------------------------------

        country = str(
            row.get(
                columns["country"],
                "",
            )
        ).strip().upper()

        if country not in COUNTRIES:

            continue

        counters["country"] += 1

        # ----------------------------------------------------
        # SEO
        # ----------------------------------------------------

        seo = str(
            row.get(
                columns["seo"],
                "",
            )
        ).strip().upper()

        if seo != NABS_CODE:

            continue

        counters["seo"] += 1

        # ----------------------------------------------------
        # UNIT
        # ----------------------------------------------------

        unit = str(
            row.get(
                columns["unit"],
                "",
            )
        ).strip().upper()

        if unit != "XDC":

            continue

        counters["unit"] += 1

        # ----------------------------------------------------
        # PRICE
        # ----------------------------------------------------

        price = str(
            row.get(
                columns["price"],
                "",
            )
        ).strip()

        if price != current_price_code:

            continue

        counters["price"] += 1

        # ----------------------------------------------------
        # YEAR
        # ----------------------------------------------------

        year = parse_year(
            row.get(
                columns["year"],
                "",
            )
        )

        if year is None:

            continue

        counters["year"] += 1

        # ----------------------------------------------------
        # VALUE
        # ----------------------------------------------------

        value = parse_number(
            row.get(
                columns["value"],
                "",
            )
        )

        if value is None:

            continue

        counters["value"] += 1

        data[
            (
                country,
                year,
            )
        ] = {

            "country": country,

            "year": year,

            "value": value,

            "seo": seo,

            "unit": unit,

            "price_base": price,

        }

    print()
    print(
        f"전체 CSV: {counters['total']}"
    )

    print(
        f"국가: {counters['country']}"
    )

    print(
        f"NABS03: {counters['seo']}"
    )

    print(
        f"XDC: {counters['unit']}"
    )

    print(
        f"Current price: {counters['price']}"
    )

    print(
        f"연도: {counters['year']}"
    )

    print(
        f"최종 값: {counters['value']}"
    )

    print()

    for country in COUNTRIES:

        years = sorted(
            year
            for (
                code,
                year
            ) in data
            if code == country
        )

        if years:

            print(
                f"✅ {country}: "
                f"{years[0]}~{years[-1]} "
                f"({len(years)}개)"
            )

        else:

            print(
                f"❌ {country}: NO DATA"
            )

    return data


# ============================================================
# CONVERT
# ============================================================

def convert_to_usd(
    value,
    currency,
):

    if currency not in ECB_RATES:

        raise RuntimeError(
            f"No ECB rate: "
            f"{currency}"
        )

    # local million
    # -> EUR million
    eur_million = (
        value
        / ECB_RATES[
            currency
        ]
    )

    # EUR million
    # -> USD million
    usd_million = (
        eur_million
        * ECB_RATES[
            "USD"
        ]
    )

    return usd_million


# ============================================================
# JSON
# ============================================================

def build_json(data):

    result = {

        "title": "World Space R&D",

        "source": (
            "OECD Government Budget "
            "Allocations for R&D"
        ),

        "dataset": (
            f"{OECD_AGENCY},"
            f"{OECD_DATAFLOW},"
            f"{OECD_VERSION}"
        ),

        "indicator": {

            "code": NABS_CODE,

            "label": NABS_LABEL,

        },

        "filters": {

            "SEO": NABS_CODE,

            "UNIT_MEASURE": "XDC",

            "PRICE_BASE": "Current prices",

        },

        "original_unit": (
            "National currency, Millions"
        ),

        "output_unit": (
            "USD million"
        ),

        "oecd_last_updated": (
            "2026-03-31 22:25:37"
        ),

        "exchange_rate_source": (
            "ECB"
        ),

        "exchange_rate_date": ECB_DATE,

        "exchange_rates": ECB_RATES,

        "countries": [],

    }

    for country in COUNTRIES:

        currency = (
            COUNTRY_CURRENCIES[
                country
            ]
        )

        country_result = {

            "code": country,

            "name": (
                COUNTRY_NAMES[
                    country
                ]
            ),

            "currency": currency,

            "data": [],

        }

        for year in range(
            START_YEAR,
            END_YEAR + 1,
        ):

            key = (
                country,
                year,
            )

            if key not in data:

                continue

            original = data[
                key
            ]["value"]

            usd = convert_to_usd(
                original,
                currency,
            )

            country_result[
                "data"
            ].append({

                "year": year,

                "value_original": round(
                    original,
                    6,
                ),

                "currency": currency,

                "value_usd_million": round(
                    usd,
                    2,
                ),

                "exchange_rate_date": (
                    ECB_DATE
                ),

                "exchange_rate": (
                    ECB_RATES[
                        currency
                    ]
                ),

            })

        result[
            "countries"
        ].append(
            country_result
        )

    return result


# ============================================================
# SAVE
# ============================================================

def save_json(result):

    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    with open(
        OUTPUT_FILE,
        "w",
        encoding="utf-8",
    ) as f:

        json.dump(
            result,
            f,
            ensure_ascii=False,
            indent=2,
        )

    print()
    print(
        "💾 Saved:"
    )

    print(
        OUTPUT_FILE
    )


# ============================================================
# MAIN
# ============================================================

def main():

    print()
    print("=" * 70)
    print("🚀 SPACE DATA CENTER")
    print("🌎 WORLD SPACE R&D")
    print("=" * 70)

    print()
    print(
        f"Countries: "
        f"{', '.join(COUNTRIES)}"
    )

    print(
        f"Period: "
        f"{START_YEAR}-{END_YEAR}"
    )

    print(
        f"NABS: "
        f"{NABS_CODE}"
    )

    print(
        f"ECB date: "
        f"{ECB_DATE}"
    )

    # --------------------------------------------------------
    # OECD
    # --------------------------------------------------------

    text = download_oecd()

    if text is None:

        sys.exit(1)

    # --------------------------------------------------------
    # CSV
    # --------------------------------------------------------

    try:

        fieldnames, rows = parse_csv(
            text
        )

    except Exception as error:

        print(
            f"❌ CSV parsing failed: "
            f"{error}"
        )

        sys.exit(1)

    # --------------------------------------------------------
    # COLUMNS
    # --------------------------------------------------------

    columns = get_columns(
        fieldnames
    )

    # --------------------------------------------------------
    # DEBUG
    # --------------------------------------------------------

    show_real_values(
        rows,
        columns,
    )

    # --------------------------------------------------------
    # FILTER
    # --------------------------------------------------------

    data = filter_data(
        rows,
        columns,
    )

    if not data:

        print()
        print(
            "❌ No matching observations."
        )

        print()
        print(
            "OECD returned the data, "
            "but no usable year/value "
            "observations were found."
        )

        sys.exit(1)

    # --------------------------------------------------------
    # BUILD
    # --------------------------------------------------------

    result = build_json(
        data
    )

    # --------------------------------------------------------
    # SAVE
    # --------------------------------------------------------

    save_json(
        result
    )

    print()
    print("=" * 70)
    print(
        "✅ WORLD SPACE UPDATE COMPLETE"
    )
    print("=" * 70)


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":
    main()