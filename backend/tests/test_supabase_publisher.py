import json
from unittest.mock import patch


def test_publish_snapshot_upserts_latest_with_secret_key() -> None:
    # Snapshot hợp lệ phải được upsert vào đúng một row latest bằng secret key.
    from backend.app.supabase_publisher import publish_snapshot

    snapshot = {
        "asOfDate": "2026-09-23",
        "generatedAt": "2026-09-24T01:22:13+00:00",
        "sectors": [],
        "strongStocks": [],
        "potentialStocks": [],
        "marketBreadth": {"ma10": 0, "ma20": 0, "ma50": 0, "ma200": 0},
    }

    with patch("backend.app.supabase_publisher.urlopen") as urlopen:
        response = urlopen.return_value.__enter__.return_value
        response.status = 201

        publish_snapshot(
            snapshot,
            base_url="https://project.supabase.co/",
            secret_key="sb_secret_test",
            timeout=7,
        )

    request = urlopen.call_args.args[0]
    body = json.loads(request.data.decode("utf-8"))
    assert request.full_url == (
        "https://project.supabase.co/rest/v1/bulletin_publications?on_conflict=slug"
    )
    assert request.get_header("Apikey") == "sb_secret_test"
    assert request.get_header("Authorization") is None
    assert request.get_header("Prefer") == "resolution=merge-duplicates"
    assert body == {
        "slug": "latest",
        "as_of_date": "2026-09-23",
        "generated_at": "2026-09-24T01:22:13+00:00",
        "payload": snapshot,
    }
    assert urlopen.call_args.kwargs["timeout"] == 7
