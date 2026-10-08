"""Mô hình lưu trữ dữ liệu thị trường và snapshot bất biến."""

from datetime import date, datetime
from typing import Any

from sqlalchemy import JSON, Boolean, Date, DateTime, Float, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Sector(Base):
    __tablename__ = "sectors"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)


class Equity(Base):
    __tablename__ = "equities"
    id: Mapped[int] = mapped_column(primary_key=True)
    symbol: Mapped[str] = mapped_column(String(16), unique=True, index=True)
    company_name: Mapped[str] = mapped_column(String(255))
    exchange: Mapped[str] = mapped_column(String(16))
    display_order: Mapped[int] = mapped_column(Integer)
    sector_id: Mapped[int] = mapped_column(ForeignKey("sectors.id"), index=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    universe_checksum: Mapped[str] = mapped_column(String(64))


class DailyPrice(Base):
    __tablename__ = "daily_prices"
    __table_args__ = (UniqueConstraint("equity_id", "trading_date"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    equity_id: Mapped[int] = mapped_column(ForeignKey("equities.id"), index=True)
    trading_date: Mapped[date] = mapped_column(Date, index=True)
    open: Mapped[float] = mapped_column(Float)
    high: Mapped[float] = mapped_column(Float)
    low: Mapped[float] = mapped_column(Float)
    close: Mapped[float] = mapped_column(Float)
    volume: Mapped[float] = mapped_column(Float)
    source: Mapped[str] = mapped_column(String(16), default="VCI")
    checksum: Mapped[str] = mapped_column(String(64))


class DailyIndicator(Base):
    __tablename__ = "daily_indicators"
    __table_args__ = (UniqueConstraint("equity_id", "trading_date"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    equity_id: Mapped[int] = mapped_column(ForeignKey("equities.id"), index=True)
    trading_date: Mapped[date] = mapped_column(Date, index=True)
    roc_9: Mapped[float | None] = mapped_column(Float)
    roc_26: Mapped[float | None] = mapped_column(Float)
    roc_33: Mapped[float | None] = mapped_column(Float)
    roc_52: Mapped[float | None] = mapped_column(Float)
    rs_raw: Mapped[float | None] = mapped_column(Float)
    rs_ranking: Mapped[float | None] = mapped_column(Float)
    ma_10: Mapped[float | None] = mapped_column(Float)
    ma_20: Mapped[float | None] = mapped_column(Float)
    ma_50: Mapped[float | None] = mapped_column(Float)
    ma_200: Mapped[float | None] = mapped_column(Float)
    high_average_4: Mapped[float | None] = mapped_column(Float)
    volume_average_10: Mapped[float | None] = mapped_column(Float)
    volume_ratio: Mapped[float | None] = mapped_column(Float)
    ma_50_slope_5: Mapped[float | None] = mapped_column(Float)


class SectorMetric(Base):
    __tablename__ = "sector_metrics"
    __table_args__ = (UniqueConstraint("sector_id", "trading_date"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    sector_id: Mapped[int] = mapped_column(ForeignKey("sectors.id"), index=True)
    trading_date: Mapped[date] = mapped_column(Date, index=True)
    average_roc_26: Mapped[float] = mapped_column(Float)
    member_count: Mapped[int] = mapped_column(Integer)


class MarketBreadthModel(Base):
    __tablename__ = "market_breadth"
    trading_date: Mapped[date] = mapped_column(Date, primary_key=True)
    ma_10: Mapped[float] = mapped_column(Float)
    ma_20: Mapped[float] = mapped_column(Float)
    ma_50: Mapped[float] = mapped_column(Float)
    ma_200: Mapped[float] = mapped_column(Float)
    denominators: Mapped[dict[str, int]] = mapped_column(JSON)


class IngestionRun(Base):
    __tablename__ = "ingestion_runs"
    __table_args__ = (Index("ix_ingestion_runs_status_requested", "status", "requested_at"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    status: Mapped[str] = mapped_column(String(32), index=True)
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    target_date: Mapped[date | None] = mapped_column(Date)
    source: Mapped[str] = mapped_column(String(16), default="VCI")
    error_code: Mapped[str | None] = mapped_column(String(64))
    error_message: Mapped[str | None] = mapped_column(Text)
    statistics: Mapped[dict[str, Any] | None] = mapped_column(JSON)


class BulletinSnapshot(Base):
    __tablename__ = "bulletin_snapshots"
    __table_args__ = (UniqueConstraint("as_of_date", "revision"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    as_of_date: Mapped[date] = mapped_column(Date, index=True)
    revision: Mapped[int] = mapped_column(Integer)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    ingestion_run_id: Mapped[int] = mapped_column(ForeignKey("ingestion_runs.id"))
    payload: Mapped[dict[str, Any]] = mapped_column(JSON)
