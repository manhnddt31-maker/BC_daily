# Đặc tả CNF Daily Market Bulletin

## Bối cảnh

Workspace chưa có mã nguồn ứng dụng. Tài nguyên đầu vào gồm giao diện demo HTML/CSS/JavaScript 1920×1080, logo CNF, file `Data.xlsx` và Google Sheet làm nguồn dữ liệu.

## Mục tiêu

Xây dựng website báo cáo thị trường chứng khoán hằng ngày công khai, tự cập nhật dữ liệu từ Google Sheets mỗi 5 phút và cho phép người dùng tải bản tin PNG 1920×1080 thủ công.

## Phạm vi

- Dashboard theo phong cách và bố cục demo CNF.
- API server-side đọc, kiểm tra và chuẩn hóa dữ liệu Google Sheets.
- Bảng ngành, Top 10 RS, Top 10 cổ phiếu tiềm năng, thống kê MA và nội dung nhận định.
- Xuất PNG chỉ chứa vùng bản tin.
- Public link, không yêu cầu đăng nhập.

Ngoài phạm vi: đăng nhập, chỉnh sửa Sheet trên web, tự tạo ảnh sau khi xuất bản và UI mobile chuyên biệt.

## Ràng buộc

- Không lộ credential Google Sheet hoặc dữ liệu thô trên trình duyệt.
- Web làm mới dữ liệu mỗi 300 giây.
- Không dùng `Buy Signal` hoặc cột `Breakout` trong bộ lọc 2.
- Kích thước ảnh xuất là 1920×1080.
- `ROC26_VNINDEX` phải có nguồn cấu hình rõ ràng; không suy đoán khi thiếu dữ liệu.

## Các phương án thiết kế

1. Trình duyệt đọc Sheet trực tiếp: triển khai nhanh nhưng lộ cấu trúc và khó bảo vệ dữ liệu.
2. Apps Script làm toàn bộ backend: gọn trong Google Workspace nhưng hạn chế vận hành và mở rộng.
3. Web app có API server-side đọc Sheet: tách credential, kiểm soát validation và phù hợp phát triển tiếp.

## Hướng đã chốt

Chọn phương án 3: Next.js App Router + TypeScript, endpoint server-side đọc dữ liệu bằng service account, UI công khai tự polling mỗi 5 phút, và export PNG thực hiện trên client.

Luồng: Google Sheets → data service/API → dashboard public → nút xuất PNG.

### Bộ lọc 1

Lấy tối đa 10 mã có `KLGD > 300000` và `ROC26 > ROC26_VNINDEX`, sắp xếp giảm dần theo `RS-TB3D`.

### Bộ lọc 2

Mã đạt chuẩn phải thỏa: `KLGD > 300000`; cả ba RS gần nhất và `RS-TB3D` trong [75, 90]; `ROC26 > ROC26_VNINDEX`; `ROC26` trong [10, 20]; `Close > MA20 > MA50`; `MA50-TB5D > 0`; `Close > High-TB4D`; và `KLGD / Vol-TB10D >= 1.5`.

Sắp xếp theo `RS-TB3D`, rồi `ROC26`, rồi tỷ lệ volume, đều giảm dần. Nếu thiếu 10 mã đạt chuẩn, bổ sung mã gần đạt theo số tiêu chí thỏa mãn và cùng quy tắc xếp hạng; giao diện không gắn nhãn phân biệt.

## Khu vực bị ảnh hưởng

- Frontend dashboard và export ảnh.
- Data service, API route, mapping/validation Google Sheets.
- Unit tests cho bộ lọc.
- Tài liệu thiết lập biến môi trường và quyền service account.

## Câu hỏi mở

- Tên tab/range chính xác hoặc named range cho `ROC26_VNINDEX` và phần nhận định cần được cấu hình khi kết nối Sheet thật.
- Credential service account cần do chủ sở hữu Sheet cung cấp ở môi trường triển khai, không đưa vào repository.
