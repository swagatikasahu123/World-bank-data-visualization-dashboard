"""
World Bank API service.
Fetches data from https://api.worldbank.org/v2/
All responses are cached for 5 minutes.
"""
import requests
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)

WB_BASE = "https://api.worldbank.org/v2"

# Indicator definitions
INDICATORS = {
    "gdp_growth":      {"code": "NY.GDP.MKTP.KD.ZG", "label": "GDP Growth (% annual)", "unit": "%"},
    "gdp_per_capita":  {"code": "NY.GDP.PCAP.CD",    "label": "GDP per Capita (USD)",   "unit": "USD"},
    "population":      {"code": "SP.POP.TOTL",        "label": "Total Population",        "unit": "people"},
    "co2_emissions":   {"code": "EN.ATM.CO2E.PC",    "label": "CO₂ Emissions (t/capita)","unit": "tonnes"},
    "life_expectancy": {"code": "SP.DYN.LE00.IN",    "label": "Life Expectancy (years)",  "unit": "years"},
    "internet_users":  {"code": "IT.NET.USER.ZS",    "label": "Internet Users (% pop)",   "unit": "%"},
    "literacy_rate":   {"code": "SE.ADT.LITR.ZS",    "label": "Literacy Rate (%)",         "unit": "%"},
    "unemployment":    {"code": "SL.UEM.TOTL.ZS",    "label": "Unemployment Rate (%)",     "unit": "%"},
}

COUNTRIES = {
    "US": "United States", "CN": "China", "IN": "India", "GB": "United Kingdom",
    "DE": "Germany", "FR": "France", "JP": "Japan", "BR": "Brazil",
    "CA": "Canada", "AU": "Australia", "ZA": "South Africa", "NG": "Nigeria",
    "KR": "South Korea", "MX": "Mexico", "ID": "Indonesia",
}


def _wb_get(path: str, params: dict = None) -> list:
    """Make a cached GET request to the World Bank API."""
    cache_key = f"wb:{path}:{str(params)}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    full_params = {"format": "json", "per_page": 500}
    if params:
        full_params.update(params)

    try:
        resp = requests.get(f"{WB_BASE}/{path}", params=full_params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        # WB API returns [metadata, data]
        result = data[1] if isinstance(data, list) and len(data) > 1 else []
        cache.set(cache_key, result, 300)
        return result
    except Exception as e:
        logger.error(f"World Bank API error: {e}")
        return []


def get_indicator_timeseries(indicator_key: str, country_code: str = "US",
                              start_year: int = 2000, end_year: int = 2023) -> dict:
    """Return time series for one indicator + country."""
    if indicator_key not in INDICATORS:
        return {"error": "Unknown indicator"}
    info = INDICATORS[indicator_key]
    code = info["code"]
    path = f"country/{country_code}/indicator/{code}"
    params = {"date": f"{start_year}:{end_year}", "mrv": end_year - start_year + 1}
    raw = _wb_get(path, params)

    points = []
    for row in (raw or []):
        if row.get("value") is not None:
            points.append({"year": int(row["date"]), "value": round(float(row["value"]), 3)})
    points.sort(key=lambda x: x["year"])

    return {
        "indicator": info["label"],
        "unit": info["unit"],
        "country": COUNTRIES.get(country_code.upper(), country_code),
        "data": points,
    }


def get_multi_country_comparison(indicator_key: str, countries: list,
                                  year: int = 2022) -> dict:
    """Return latest value for multiple countries for a given year."""
    if indicator_key not in INDICATORS:
        return {"error": "Unknown indicator"}
    info = INDICATORS[indicator_key]
    code = info["code"]
    country_str = ";".join(countries)
    path = f"country/{country_str}/indicator/{code}"
    params = {"date": f"{year}:{year}"}
    raw = _wb_get(path, params)

    result = []
    for row in (raw or []):
        if row.get("value") is not None:
            iso = row["countryiso3code"] or row.get("country", {}).get("id", "")
            name = row.get("country", {}).get("value", iso)
            result.append({"country": name, "value": round(float(row["value"]), 3)})

    result.sort(key=lambda x: x["value"], reverse=True)
    return {
        "indicator": info["label"],
        "unit": info["unit"],
        "year": year,
        "data": result,
    }


def get_scatter_data(x_indicator: str, y_indicator: str,
                     countries: list = None, year: int = 2021) -> dict:
    """Return (x, y) pairs for a scatter plot of two indicators."""
    if countries is None:
        countries = list(COUNTRIES.keys())
    country_str = ";".join(countries)

    x_info = INDICATORS.get(x_indicator)
    y_info = INDICATORS.get(y_indicator)
    if not x_info or not y_info:
        return {"error": "Unknown indicator"}

    def fetch(code):
        raw = _wb_get(f"country/{country_str}/indicator/{code}", {"date": f"{year}:{year}"})
        return {r.get("country", {}).get("id", ""): r["value"] for r in (raw or []) if r.get("value") is not None}

    x_data = fetch(x_info["code"])
    y_data = fetch(y_info["code"])

    points = []
    for iso, xv in x_data.items():
        if iso in y_data:
            points.append({
                "country": COUNTRIES.get(iso, iso),
                "x": round(float(xv), 3),
                "y": round(float(y_data[iso]), 3),
            })

    return {
        "x_label": x_info["label"],
        "y_label": y_info["label"],
        "year": year,
        "data": points,
    }


def get_dashboard_summary(country_code: str = "US") -> dict:
    """Return latest values for all key indicators for a country."""
    summary = {}
    for key, info in INDICATORS.items():
        code = info["code"]
        raw = _wb_get(f"country/{country_code}/indicator/{code}", {"mrv": 1})
        if raw:
            row = raw[0]
            summary[key] = {
                "label": info["label"],
                "unit": info["unit"],
                "value": round(float(row["value"]), 3) if row.get("value") is not None else None,
                "year": row.get("date"),
            }
    return {"country": COUNTRIES.get(country_code.upper(), country_code), "indicators": summary}
