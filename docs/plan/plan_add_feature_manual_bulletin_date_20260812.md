# Kế hoạch triển khai ngày bản tin thủ công

## Yêu cầu EARS

- Khi snapshot sẵn sàng, hệ thống phải khởi tạo ngày nhập bằng draft đã lưu hoặc ngày hiện tại của máy tính.
- Khi người dùng thay đổi ngày, hệ thống phải đánh dấu thay đổi chưa Render và tự lưu draft theo ngày dữ liệu nguồn.
- Khi người dùng Render một ngày ISO hợp lệ, hệ thống phải cập nhật ngày trên canvas và tên PNG.
- Nếu ngày không hợp lệ, hệ thống phải giữ nguyên preview và báo lỗi.
- Khi người dùng Reset, hệ thống phải xóa draft ngày và khôi phục ngày hiện tại.

## Phạm vi file

1. `lib/bulletin-date.ts`: kiểm tra ngày ISO và lưu/đọc/xóa draft ngày.
2. `components/narrative-editor.tsx`: thêm ô nhập ngày.
3. `components/bulletin-dashboard.tsx`: điều phối draft/render/reset/autosave.
4. `app/globals.css`: style ô ngày theo editor hiện tại.
5. `tests/bulletin-date.test.ts`, `tests/narrative-editor.test.ts`: test hồi quy.

## Thứ tự

1. TDD Red cho storage/validation và markup ô ngày.
2. Triển khai logic ngày và UI.
3. Chạy test mục tiêu, toàn bộ test, lint, build.
4. Review diff và xác minh giao diện/preview.

## Rủi ro

- Draft cũ không có ngày: dùng ngày máy tính, không phá dữ liệu cũ.
- Refresh định kỳ: không được ghi đè ngày thủ công đã Render.
- Chuyển sang snapshot mới: không mang draft ngày cũ sang phiên mới.

