# Đặc tả nhập ngày bản tin thủ công

## Mục tiêu

Cho phép người vận hành nhập ngày hiển thị trên bản tin trực tiếp trong editor, tự lưu tại trình duyệt và chỉ áp dụng lên preview/PNG sau khi bấm **Render bản tin**, giống nội dung Kết luận.

## Quyết định đã chốt

- Dùng ô nhập native `type="date"` với nhãn **Ngày hiển thị trên bản tin**.
- Ngày mặc định là ngày hiện tại của máy tính.
- Draft ngày được lưu theo `snapshot.asOfDate`, không ghi vào Google Sheets.
- Nhập ngày chỉ thay draft; bấm Render mới cập nhật nhãn ngày trên canvas và tên file PNG.
- Khôi phục nội dung gốc xóa draft ngày và đưa ngày về ngày hiện tại của máy tính.
- Nếu ngày trống hoặc sai định dạng ISO, không Render và hiển thị lỗi trong vùng trạng thái.

## Tiêu chí chấp nhận

- Editor hiển thị ô ngày có thể nhập bằng chuột và bàn phím.
- Ngày nhập được tự lưu và nạp lại đúng theo phiên dữ liệu.
- Canvas không đổi trước Render và đổi đúng sau Render.
- Reset khôi phục ngày hiện tại.
- Xuất PNG dùng ngày đã Render.
- Không làm thay đổi luồng tải dữ liệu Google Sheets.

