"""Đồng bộ snapshot đã công bố lên Supabase qua REST API."""

from __future__ import annotations

import json
from typing import Any
from urllib.request import Request, urlopen


def publish_snapshot(
    snapshot: dict[str, Any],
    *,
    base_url: str,
    secret_key: str,
    timeout: float,
) -> None:
    """Upsert snapshot vào row công khai `latest`; secret chỉ nằm trong header."""
    as_of_date = snapshot.get("asOfDate")
    generated_at = snapshot.get("generatedAt")
    if not isinstance(as_of_date, str) or not isinstance(generated_at, str):
        raise ValueError("INVALID_BULLETIN_SNAPSHOT")

    body = json.dumps(
        {
            "slug": "latest",
            "as_of_date": as_of_date,
            "generated_at": generated_at,
            "payload": snapshot,
        },
        allow_nan=False,
    ).encode("utf-8")
    request = Request(
        f"{base_url.rstrip('/')}/rest/v1/bulletin_publications?on_conflict=slug",
        data=body,
        method="POST",
        headers={
            "apikey": secret_key,
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates",
        },
    )
    with urlopen(request, timeout=timeout) as response:
        if response.status not in (200, 201, 204):
            raise RuntimeError("SUPABASE_PUBLISH_FAILED")
