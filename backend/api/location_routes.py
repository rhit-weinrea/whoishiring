from fastapi import APIRouter, Query
from typing import List

from backend.utilities.location import suggest_locations

location_api = APIRouter(prefix="/locations", tags=["Locations"])


@location_api.get("/suggest", response_model=List[str])
async def suggest_location_matches(
    query: str = Query(..., min_length=2, max_length=120),
    limit: int = Query(5, ge=1, le=10),
):
    return suggest_locations(query, limit)