# Báo cáo probe nguồn vnstock

- Phiên bản: `4.0.8`
- Nguồn: `vci`
- Số mã kiểm tra: 265
- Số mã đạt: 255
- Độ phủ: 96.23%
- VNINDEX: PASS
- Bằng chứng giá điều chỉnh: EMPIRICAL_PASS
- Kết luận: PASS

## Đối chiếu sự kiện doanh nghiệp

- FPT 2024-06-13: PASS — max |return| = 0.04337425
- FPT 2025-07-22: PASS — max |return| = 0.01634488

`EMPIRICAL_PASS` chỉ là bằng chứng thực nghiệm trên các sự kiện đã biết. Mỗi lần
nâng phiên bản package hoặc đổi nguồn phải chạy lại probe.

## Mã không đạt

- CEO: ValueError: High nhỏ hơn giá thành phần
- IDC: ValueError: Low lớn hơn giá thành phần
- MBS: ValueError: Low lớn hơn giá thành phần
- PVS: ValueError: High nhỏ hơn giá thành phần
- LAS: ValueError: Low lớn hơn giá thành phần
- KSV: ValueError: High nhỏ hơn giá thành phần
- F88: ValueError: Chỉ có 279 phiên, cần tối thiểu 300
- VGS: ValueError: High nhỏ hơn giá thành phần
- NTP: ValueError: High nhỏ hơn giá thành phần
- L40: ValueError: Low lớn hơn giá thành phần
