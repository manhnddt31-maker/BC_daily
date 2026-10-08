# Đặc tả tính năng nhập nhận định trực tiếp trên web

## Bối cảnh

Ứng dụng hiện là dashboard Next.js đọc dữ liệu định lượng từ Google Sheets, hiển thị bản tin 1920×1080 và xuất PNG. Ba nội dung định tính gồm Kết luận, Hành động và Nhận định thị trường hiện được lấy từ narrative hoặc hiển thị nội dung mặc định. Người dùng muốn nhập trực tiếp trên web theo kiểu trang tham chiếu `BCCL/index.html`.

## Mục tiêu

Thêm một trình nhập liệu bên trái và bản xem trước bên phải, cho phép người dùng nhập ba nội dung định tính, lưu nháp trong trình duyệt, render lên bản tin và xuất PNG mà không cần chỉnh Google Sheets.

Tín hiệu thành công:

- Ba nội dung có thể nhập và render trực tiếp trên web.
- Nội dung được khôi phục khi mở lại cùng trình duyệt.
- Nội dung của ngày cũ không tự áp dụng cho ngày bản tin mới.
- Form và các nút điều khiển không xuất hiện trong ảnh PNG.
- Dữ liệu ngành, cổ phiếu và MA vẫn tự động cập nhật từ Google Sheets.

## Phạm vi

### Trong phạm vi

- Thanh nhập liệu theo phong cách BCCL, đặt bên trái bản xem trước trên màn hình rộng.
- Ba textarea: Kết luận, Hành động, Nhận định thị trường.
- Tự động lưu nháp bằng Local Storage theo ngày `asOfDate`.
- Nút Render bản tin để áp dụng bản nháp vào bản xem trước.
- Nút Khôi phục nội dung gốc để xóa bản nháp của ngày hiện tại và dùng narrative từ nguồn hoặc nội dung mặc định.
- Giữ nút Xuất PNG 1920×1080 hiện có.
- Bố cục thu gọn phù hợp trên màn hình nhỏ.

### Ngoài phạm vi

- Không ghi nội dung vào Google Sheets.
- Không đồng bộ giữa trình duyệt hoặc thiết bị.
- Không thêm đăng nhập hoặc phân quyền.
- Không cho sửa thủ công ngày, ngành, cổ phiếu, MA hoặc dữ liệu định lượng khác.
- Không thêm nhập hoặc tải JSON trong phiên bản đầu.

## Ràng buộc

- Ứng dụng dùng Next.js App Router, React và TypeScript.
- Dữ liệu định lượng tiếp tục lấy từ `/api/bulletin` và Google Sheets.
- Local Storage chỉ khả dụng phía client; phải xử lý an toàn khi hydration và khi storage không khả dụng.
- Bản nháp phải được phân vùng theo ngày bản tin để tránh dùng nhầm nhận định cũ.
- Khung `#bulletin-canvas` phải giữ nguyên phạm vi xuất PNG; editor nằm ngoài khung này.
- Không thêm dependency nếu API trình duyệt hiện có đáp ứng yêu cầu.

## Các phương án thiết kế

### A. Lưu nháp cục bộ và xuất bản lên Google Sheets

- Ưu điểm: vừa an toàn khi nhập vừa đồng bộ nhiều thiết bị.
- Nhược điểm: cần API ghi, bảo mật và cấu hình quyền Google.

### B. Lưu hoàn toàn trong trình duyệt

- Ưu điểm: đơn giản, không cần credential, gần nhất với web BCCL.
- Nhược điểm: không đồng bộ và có thể mất khi xóa dữ liệu trình duyệt.

### C. Ghi thẳng Google Sheets

- Ưu điểm: dữ liệu lâu dài và dùng chung.
- Nhược điểm: mỗi lần lưu phụ thuộc mạng, cần endpoint ghi và bảo vệ quyền chỉnh sửa.

## Hướng đã chốt

Chọn phương án B. Web dùng thanh nhập liệu giống BCCL, chỉ chỉnh sửa ba nội dung định tính. Mỗi thay đổi được tự lưu vào Local Storage theo ngày bản tin. Người dùng nhấn Render bản tin để áp dụng nội dung vào preview, sau đó dùng chức năng Xuất PNG hiện có.

## Luồng tương tác chính

1. Web tải snapshot tự động từ Google Sheets.
2. Khi biết `asOfDate`, web đọc bản nháp Local Storage tương ứng.
3. Form khởi tạo từ bản nháp nếu có; nếu không, dùng narrative nguồn hoặc nội dung mặc định.
4. Khi nhập, form tự lưu nháp nhưng chưa thay đổi bản xem trước.
5. Khi nhấn Render bản tin, ba trường đã nhập được áp dụng vào snapshot hiển thị.
6. Khi nhấn Xuất PNG, chỉ khung bản tin được xuất.
7. Khi khôi phục nội dung gốc, bản nháp của ngày hiện tại bị xóa và preview quay về narrative nguồn hoặc fallback.

## Khu vực dự kiến ảnh hưởng

- `components/bulletin-dashboard.tsx`
- Component editor mới trong `components/`
- `components/bulletin-canvas.tsx` hoặc contract props narrative
- `app/globals.css`
- Test cho Local Storage, render, reset và ranh giới PNG

## Câu hỏi mở

- Không còn câu hỏi sản phẩm trọng yếu. Chi tiết kích thước sidebar, trạng thái responsive, focus và thông báo lưu sẽ được chốt trong pha `04-ui-design`.
