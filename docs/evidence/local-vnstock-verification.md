# Kiểm chứng vnstock trên máy local — 24/09/2026

## Kết quả

- Web: http://localhost:3000; FastAPI: http://127.0.0.1:8000.
- PostgreSQL local: cổng 55432, chỉ lắng nghe loopback.
- Snapshot thực tế: phiên 23/09/2026, tạo lúc 01:22:13 UTC ngày 24/09/2026.
- 255/265 mã hợp lệ (96,23%); 10 mã lỗi nguồn được loại và hiển thị cảnh báo.
- 29 ngành, 10 cổ phiếu mạnh, 10 cổ phiếu tiềm năng; 177.248 dòng giá được lưu.
- API trả nguồn vnstock, stale=false; endpoint backend không có token trả 401.
- Worker chạy nền, lên lịch 16:30 ngày thường khi máy và tiến trình đang hoạt động.

## Kiểm tra

- Backend: 25 test đạt.
- Frontend: 70 test đạt, 14 tệp.
- Build Next.js và ESLint đạt; compileall backend đạt.
- Kiểm tra giao diện bằng Cốc Cốc headless: dữ liệu thật xuất hiện, đủ 29 ngành, không cắt dòng cuối.
- Ảnh kiểm chứng local: `.local/bulletin-local-final.png` (không đưa lên Git).
- Chưa kiểm tra thao tác xuất PNG thực tế.

## Phạm vi còn lại

Đây là xác nhận chạy local, không phải nghiệm thu toàn bộ migration production. Còn cần hoàn thiện Alembic/Docker, triển khai production và lưu các bảng chỉ báo/độ rộng riêng theo kế hoạch. Hiện đã lưu universe, giá, lượt ingestion và snapshot. Coverage đang tính trên toàn bộ danh mục cấu hình. Không commit/push trong lượt xử lý này.

Khởi động lại local bằng `backend/scripts/start-local.ps1`. Bí mật kết nối nằm trong các tệp môi trường bị Git bỏ qua; không chép vào tài liệu hoặc commit.
