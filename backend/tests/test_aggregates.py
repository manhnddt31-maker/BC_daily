from backend.app.domain.aggregates import (
    BreadthObservation,
    SectorObservation,
    aggregate_sector_strength,
    calculate_market_breadth,
)


def test_aggregate_sector_strength_uses_equal_weight_and_skips_missing_roc() -> None:
    # R14: Sức mạnh ngành là trung bình ROC26 của các mã hợp lệ, không theo vốn hóa.
    result = aggregate_sector_strength(
        [
            SectorObservation("Công nghệ", 10.0),
            SectorObservation("Công nghệ", 20.0),
            SectorObservation("Ngân hàng", -5.0),
            SectorObservation("Ngân hàng", None),
        ]
    )

    assert [(item.name, item.average_percent, item.member_count) for item in result] == [
        ("Công nghệ", 15.0, 2),
        ("Ngân hàng", -5.0, 1),
    ]


def test_calculate_market_breadth_uses_a_separate_denominator_for_each_ma() -> None:
    # R15: Mã thiếu MA dài không được làm sai mẫu số của MA ngắn.
    result = calculate_market_breadth(
        [
            BreadthObservation(close=10.0, ma_10=9.0, ma_20=11.0, ma_50=None, ma_200=None),
            BreadthObservation(close=8.0, ma_10=8.0, ma_20=7.0, ma_50=6.0, ma_200=None),
            BreadthObservation(close=5.0, ma_10=None, ma_20=None, ma_50=4.0, ma_200=6.0),
        ]
    )

    assert (result.ma_10.percentage, result.ma_10.denominator) == (50.0, 2)
    assert (result.ma_20.percentage, result.ma_20.denominator) == (50.0, 2)
    assert (result.ma_50.percentage, result.ma_50.denominator) == (100.0, 2)
    assert (result.ma_200.percentage, result.ma_200.denominator) == (0.0, 1)
