from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from typing import Optional, List

from geopy.extra.rate_limiter import RateLimiter
from geopy.geocoders import Nominatim

from backend.core.configuration import fetch_environment_config


@dataclass(frozen=True)
class NormalizedLocation:
    raw: str
    normalized: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    country: Optional[str] = None
    region: Optional[str] = None
    city: Optional[str] = None


config = fetch_environment_config()
_geocoder = Nominatim(user_agent=config.GEOCODER_USER_AGENT, timeout=10)
_geocode = RateLimiter(_geocoder.geocode, min_delay_seconds=1, swallow_exceptions=True)


def _normalize_from_address(address: dict) -> NormalizedLocation:
    city = address.get("city") or address.get("town") or address.get("village")
    region = address.get("state") or address.get("region")
    country = address.get("country")
    parts = [p for p in [city, region, country] if p]
    normalized = ", ".join(parts) if parts else ""
    return NormalizedLocation(raw="", normalized=normalized, city=city, region=region, country=country)


@lru_cache(maxsize=512)
def _geocode_cached(query: str):
    return _geocode(query, addressdetails=True)


def normalize_location(raw: Optional[str]) -> Optional[NormalizedLocation]:
    if not raw:
        return None

    cleaned = raw.strip()
    if not cleaned:
        return None

    lower = cleaned.lower()
    if "remote" in lower or "anywhere" in lower:
        return NormalizedLocation(raw=cleaned, normalized="Remote")

    result = _geocode_cached(cleaned)
    if not result:
        return NormalizedLocation(raw=cleaned, normalized=cleaned)

    address = result.raw.get("address", {})
    normalized = _normalize_from_address(address)

    normalized_value = normalized.normalized or result.address or cleaned
    return NormalizedLocation(
        raw=cleaned,
        normalized=normalized_value,
        latitude=getattr(result, "latitude", None),
        longitude=getattr(result, "longitude", None),
        country=normalized.country,
        region=normalized.region,
        city=normalized.city,
    )


@lru_cache(maxsize=256)
def _suggest_cached(query: str, limit: int) -> List[str]:
    results = _geocode(query, addressdetails=True, exactly_one=False, limit=limit)
    if not results:
        return []
    suggestions: List[str] = []
    for result in results:
        address = result.raw.get("address", {}) if hasattr(result, "raw") else {}
        normalized = _normalize_from_address(address).normalized
        label = normalized or getattr(result, "address", None) or query
        if label and label not in suggestions:
            suggestions.append(label)
    return suggestions


def suggest_locations(raw: Optional[str], limit: int = 5) -> List[str]:
    if not raw:
        return []
    cleaned = raw.strip()
    if len(cleaned) < 2:
        return []
    return _suggest_cached(cleaned, limit)
