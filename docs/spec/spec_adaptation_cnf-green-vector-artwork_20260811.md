# Đặc tả thích nghi giao diện: CNF Green Vector Artwork

## Bối cảnh

Bản tin thị trường hiện tại sử dụng các minh họa SVG đơn giản và nhiều chi tiết xanh dương/cyan chưa đồng nhất với nhận diện xanh lá của CNF. Biểu đồ đầu trang chưa có cấu trúc nến chi tiết, minh họa cuối trang còn ít lớp, biểu tượng loa là ký tự văn bản và toàn bộ 22 ngành đang dùng chung một biểu tượng quân cờ.

Người dùng đã cung cấp hình tham chiếu và phê duyệt hướng thiết kế dùng SVG vector chi tiết với bảng màu xanh lá CNF.

## Mục tiêu

- Tăng mức độ chi tiết và chất lượng thị giác của các minh họa trang trí.
- Đồng nhất các chi tiết được chỉ định với nhận diện xanh lá CNF.
- Giữ hình ảnh sắc nét trong bản web và ảnh PNG 1920×1080.
- Tạo biểu tượng riêng, dễ nhận diện cho từng ngành.
- Không làm thay đổi dữ liệu, bộ lọc hoặc logic Google Sheets.

Tín hiệu thành công là bản tin giữ nguyên bố cục và khả năng đọc, nhưng phần đầu trang, cuối trang, biểu tượng loa và danh sách ngành có độ hoàn thiện gần với hình tham chiếu, không còn các mảng xanh dương đậm được đánh dấu.

## Phạm vi

### Trong phạm vi

- Vẽ lại quả địa cầu bằng SVG nhiều lớp, có lưới và hiệu ứng phát sáng.
- Vẽ lại biểu đồ đầu trang với nến, bóng nến, lưới dữ liệu, đường xu hướng, điểm nút và mũi tên tăng trưởng.
- Vẽ lại minh họa cuối trang với biểu đồ cột, biểu tượng ngân hàng và mạng dữ liệu.
- Thay ký tự loa bằng biểu tượng loa SVG.
- Tạo biểu tượng SVG riêng cho 22 ngành.
- Áp dụng bảng màu CNF Green cho các thành phần trên.
- Bổ sung kiểm tra render SVG và kiểm tra hồi quy giao diện phù hợp với kiến trúc test hiện có.

### Ngoài phạm vi

- Không thay đổi dữ liệu hoặc tiêu chí lọc cổ phiếu.
- Không thay đổi kết nối Google Sheets.
- Không thay đổi màu dữ liệu tăng/giảm, bảng nhiệt ngành hoặc thẻ cổ phiếu tiềm năng.
- Không thay đổi bố cục chính, kích thước canvas 1920×1080 hoặc luồng xuất PNG.
- Không thêm thư viện biểu tượng, thư viện đồ họa hoặc ảnh tải từ bên ngoài.
- Không thay đổi trình nhập nhận định và các nút thao tác.

## Ràng buộc

- Dự án dùng Next.js 16, React 19 và SVG dựng trực tiếp trong component.
- Minh họa phải render ổn định khi chuyển DOM thành PNG bằng `html-to-image`.
- Các SVG trang trí phải dùng `aria-hidden`; tên ngành bằng văn bản vẫn là nguồn thông tin chính.
- Độ tương phản phải đủ trên nền xanh đen hiện tại.
- Hiệu ứng glow không được làm mờ chữ hoặc lấn sang các panel dữ liệu.
- Các màu dùng lặp lại cần được quản lý bằng token CSS thay vì rải rác không kiểm soát.

## Các phương án thiết kế

### A. SVG vector chi tiết

Vẽ toàn bộ minh họa bằng SVG code-native, gồm header, footer, loa và 22 biểu tượng ngành.

- Ưu điểm: sắc nét, nhẹ, dễ đổi màu, phù hợp xuất PNG và không phụ thuộc tài nguyên ngoài.
- Hạn chế: cần thiết kế nhiều path và kiểm tra kỹ ở kích thước thu nhỏ.

### B. Ảnh PNG

Dùng ảnh raster được dựng sẵn cho các vùng trang trí.

- Ưu điểm: có thể đạt độ phức tạp hình ảnh nhanh.
- Hạn chế: khó đổi màu, dễ giảm nét và phụ thuộc kích thước ảnh nguồn.

### C. Kết hợp PNG và SVG

Dùng ảnh cho header/footer, SVG cho loa và biểu tượng ngành.

- Ưu điểm: cân bằng tốc độ và khả năng chỉnh sửa.
- Hạn chế: phong cách và độ sắc nét có thể thiếu đồng nhất.

## Hướng đã chốt

Chọn phương án A: SVG vector chi tiết.

Lý do: phương án này phù hợp nhất với bản tin cố định 1920×1080, giữ độ sắc nét khi xuất PNG, không thêm dependency và cho phép áp dụng bảng màu CNF Green nhất quán.

### Hệ màu được duyệt

- Xanh lá chính: `#16C85D`
- Xanh lá phát sáng: `#39FF70`
- Xanh ngọc phụ: `#00CFA6`
- Xanh lá chiều sâu: `#064E2B`
- Cyan hiện tại `#00E6E8` chỉ giữ cho đường viền panel và đường phân cách.

### Cấu trúc dự kiến

- `components/bulletin-artwork.tsx`: minh họa header, footer và loa.
- `components/sector-icon.tsx`: ánh xạ tên ngành sang biểu tượng SVG riêng.
- `components/bulletin-canvas.tsx`: lắp ghép các minh họa mới.
- `components/sector-ranking.tsx`: sử dụng biểu tượng ngành tương ứng.
- `app/globals.css`: token màu, glow và quy tắc kích thước.
- Test liên quan: xác nhận các SVG và biểu tượng ngành render đúng, không làm mất nội dung bản tin.

## Câu hỏi mở

Không còn câu hỏi thiết kế bắt buộc. Mức độ chi tiết cuối cùng sẽ được cân chỉnh trong bước UI design để bảo đảm hình không rối khi thu về canvas 1920×1080 và trong chế độ xem trước responsive.
