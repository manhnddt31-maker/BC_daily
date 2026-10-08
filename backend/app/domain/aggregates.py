"""Tổng hợp sức mạnh ngành và độ rộng thị trường."""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from math import isfinite
from statistics import fmean


@dataclass(frozen=True, slots=True)
class SectorObservation:
    sector: str
    roc_26: float | None


@dataclass(frozen=True, slots=True)
class SectorStrength:
    name: str
    average_percent: float
    member_count: int


@dataclass(frozen=True, slots=True)
class BreadthObservation:
    close: float
    ma_10: float | None
    ma_20: float | None
    ma_50: float | None
    ma_200: float | None


@dataclass(frozen=True, slots=True)
class BreadthPoint:
    percentage: float
    numerator: int
    denominator: int


@dataclass(frozen=True, slots=True)
class MarketBreadth:
    ma_10: BreadthPoint
    ma_20: BreadthPoint
    ma_50: BreadthPoint
    ma_200: BreadthPoint


def aggregate_sector_strength(
    observations: list[SectorObservation],
) -> list[SectorStrength]:
    values_by_sector: dict[str, list[float]] = defaultdict(list)
    for observation in observations:
        if observation.roc_26 is not None and isfinite(observation.roc_26):
            values_by_sector[observation.sector].append(observation.roc_26)
    result = [
        SectorStrength(
            name=sector,
            average_percent=fmean(values),
            member_count=len(values),
        )
        for sector, values in values_by_sector.items()
        if values
    ]
    return sorted(result, key=lambda item: (-item.average_percent, item.name))


def _breadth_point(
    observations: list[BreadthObservation],
    attribute: str,
) -> BreadthPoint:
    eligible = [
        (observation.close, getattr(observation, attribute))
        for observation in observations
        if getattr(observation, attribute) is not None
        and isfinite(observation.close)
        and isfinite(getattr(observation, attribute))
    ]
    denominator = len(eligible)
    if denominator == 0:
        return BreadthPoint(percentage=0.0, numerator=0, denominator=0)
    numerator = sum(close > ma for close, ma in eligible)
    return BreadthPoint(
        percentage=numerator / denominator * 100.0,
        numerator=numerator,
        denominator=denominator,
    )


def calculate_market_breadth(
    observations: list[BreadthObservation],
) -> MarketBreadth:
    return MarketBreadth(
        ma_10=_breadth_point(observations, "ma_10"),
        ma_20=_breadth_point(observations, "ma_20"),
        ma_50=_breadth_point(observations, "ma_50"),
        ma_200=_breadth_point(observations, "ma_200"),
    )
