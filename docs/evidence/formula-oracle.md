# Bộ đối chiếu công thức dữ liệu bản tin

Tài liệu này giải thích nguồn expected value trong
`backend/tests/fixtures/indicator_cases.json` và
`backend/tests/fixtures/filter_cases.json`.

## Chuỗi tuyến tính

- Có 205 phiên, `Close` chạy từ 1 đến 205.
- `High = Close + 1`.
- `Volume` chạy từ 1.000 đến 205.000, bước 1.000.
- Mọi rolling window kết thúc tại phiên 205 và bao gồm phiên hiện tại.
- `MA50-TB5D` so sánh MA50 tại phiên 205 với MA50 tại phiên 200.

Các expected value được giữ ở độ chính xác đầy đủ. Production chỉ được làm tròn
khi serialize payload hiển thị.

## Percentile RS

Với bốn điểm `10, 20, 20, 40`, hạng tăng dần trung bình là `1, 2.5, 2.5, 4`.
Công thức `(rank - 1) / (N - 1) * 100` cho kết quả `0, 50, 50, 100`.
Nếu chỉ có một mã hợp lệ, giá trị quy ước là 100.

## Bộ lọc

- Thanh khoản `Volume > 300000` là điều kiện cứng, không được nới khi bổ sung.
- Mã nghiêm ngặt luôn đứng trước mã gần ngưỡng.
- Danh sách mạnh bổ sung theo khoảng cách ROC với VNINDEX rồi mới xét RS.
- Danh sách tiềm năng bổ sung theo số nhóm điều kiện trượt, tổng khoảng cách
  chuẩn hóa và các khóa sức mạnh.
- Biên RS 75–90, ROC26 10–20 và volume ratio 1,5 là biên đóng; riêng volume
  đúng 300.000 không đạt.
