from datetime import datetime
from zoneinfo import ZoneInfo
from backend.app.worker import refresh_due


def test_refresh_due_only_after_close_once_each_weekday():
    # Lịch 16:30 giờ Việt Nam; tránh tải lặp trong cùng ngày và cuối tuần.
    zone = ZoneInfo('Asia/Ho_Chi_Minh')
    before = datetime(2026, 9, 23, 16, 29, tzinfo=zone)
    after = datetime(2026, 9, 23, 16, 31, tzinfo=zone)
    assert not refresh_due(before, None, 16, 30)
    assert refresh_due(after, None, 16, 30)
    assert not refresh_due(after, after, 16, 30)
    assert not refresh_due(datetime(2026, 9, 26, 17, tzinfo=zone), None, 16, 30)
