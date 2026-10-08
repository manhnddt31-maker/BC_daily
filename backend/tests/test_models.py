from sqlalchemy import UniqueConstraint

from backend.app.models import Base


def test_metadata_contains_approved_tables_and_idempotency_constraints() -> None:
    # R16: Schema phải khóa dữ liệu giá/chỉ báo theo mã-ngày và snapshot theo ngày-revision.
    expected_tables = {
        "sectors",
        "equities",
        "daily_prices",
        "daily_indicators",
        "sector_metrics",
        "market_breadth",
        "ingestion_runs",
        "bulletin_snapshots",
    }
    assert expected_tables.issubset(Base.metadata.tables)

    for table_name, expected_columns in {
        "daily_prices": {"equity_id", "trading_date"},
        "daily_indicators": {"equity_id", "trading_date"},
        "sector_metrics": {"sector_id", "trading_date"},
        "bulletin_snapshots": {"as_of_date", "revision"},
    }.items():
        constraints = {
            frozenset(column.name for column in constraint.columns)
            for constraint in Base.metadata.tables[table_name].constraints
            if isinstance(constraint, UniqueConstraint)
        }
        assert frozenset(expected_columns) in constraints
