# Đặc tả tính năng — Bảng cổ phiếu xuất hiện điểm mua cho phiên tới

## Bối cảnh

Ứng dụng CNF Morning Bulletin là web Next.js/React hiển thị bản tin thị trường trên canvas cố định 1920×1080 và cho phép xuất PNG. Người dùng hiện có thể nhập trực tiếp phần Kết luận, Hành động và Nhận định thị trường; nội dung được tự lưu theo ngày trong trình duyệt, sau đó đưa lên bản tin bằng thao tác “Render bản tin”.

Ở góc phải dưới của bản tin hiện có một hình minh họa tài chính. Người dùng muốn thay khu vực này bằng bảng thủ công liệt kê các cổ phiếu xuất hiện điểm mua cho phiên kế tiếp, đồng thời muốn cách nhập liệu tương tự danh sách “Nhóm ngành” trong ứng dụng BCCL: thêm từng dòng, sửa trực tiếp và xóa từng dòng.

## Mục tiêu

- Thay hình minh họa góc phải dưới bằng bảng có tiêu đề **“CỔ PHIẾU XUẤT HIỆN ĐIỂM MUA CHO PHIÊN TỚI”**.
- Cho phép nhập trực tiếp tối đa 4 cổ phiếu trên web, mỗi cổ phiếu gồm mã và vùng mua.
- Tự lưu dữ liệu theo ngày trong trình duyệt và chỉ cập nhật bản xem trước sau khi người dùng bấm **Render bản tin**.
- Bảo đảm bảng rõ ràng trong bản xem trước và ảnh PNG 1920×1080.

Tính năng đạt yêu cầu khi người dùng có thể thêm, sửa, xóa tối đa 4 dòng; dữ liệu được khôi phục đúng theo ngày; bảng hiển thị đúng trên canvas và xuất hiện đầy đủ trong PNG.

## Phạm vi

### Trong phạm vi

- Khu vực nhập danh sách dạng lặp trong trình biên tập nội dung.
- Mỗi dòng gồm:
  - **Mã cổ phiếu**.
  - **Vùng mua**.
  - Nút **Xóa**.
- Nút **Thêm dòng**; trạng thái ban đầu không có dòng.
- Giới hạn tối đa 4 dòng và vô hiệu hóa nút thêm khi đạt giới hạn.
- Chuẩn hóa mã cổ phiếu thành chữ hoa.
- Kiểm tra dòng thiếu một trong hai trường và mã trùng nhau trước khi Render.
- Tự lưu, khôi phục và xóa dữ liệu cùng bản nháp nhận định theo ngày.
- Bảng hai cột trên canvas với tiêu đề, tiêu đề cột `MÃ CP` và `VÙNG MUA`, tối đa 4 dòng.
- Trạng thái rỗng trên canvas: **“Chưa có dữ liệu”**.
- Tích hợp với quy trình xuất PNG hiện tại.
- Bảo toàn khả năng đọc các bản nháp cũ chưa có danh sách điểm mua.

### Ngoài phạm vi

- Tự động tính toán hoặc xác định tín hiệu mua.
- Đọc hoặc ghi danh sách điểm mua từ Google Sheets.
- Thay đổi logic hai bộ lọc cổ phiếu hiện tại.
- Hiển thị quá 4 mã trên bản tin.
- Cung cấp khuyến nghị đầu tư tự động.

## Ràng buộc

- Canvas bản tin giữ nguyên kích thước 1920×1080.
- Khu vực bảng sử dụng đúng vùng góc phải của footer hiện tại, rộng khoảng 420px và cao 140px.
- Nội dung phải đủ lớn, rõ nét sau khi xuất PNG.
- Giao diện cần giữ ngôn ngữ hình ảnh CNF hiện tại: nền xanh đen, viền và điểm nhấn xanh lá.
- Dữ liệu thủ công chỉ được lưu trong `localStorage` của trình duyệt và phân tách theo ngày bản tin.
- Thao tác chỉnh sửa không tự động thay đổi canvas; người dùng chủ động bấm Render như quy trình nhận định hiện tại.
- Nút và trường nhập phải sử dụng được bằng bàn phím và có nhãn truy cập rõ ràng.

## Các phương án thiết kế

### Phương án A — Một ô văn bản nhiều dòng

Người dùng nhập mỗi cổ phiếu theo cú pháp `MÃ | VÙNG MUA`. Cách này đơn giản về kỹ thuật nhưng dễ sai định dạng và không giống trải nghiệm BCCL mà người dùng mong muốn.

### Phương án B — Danh sách dòng động

Mỗi mục là một dòng có hai ô nhập và nút xóa; nút “Thêm dòng” tạo mục mới. Phương án này rõ ràng, hạn chế lỗi định dạng và tương đồng trực tiếp với phần “Nhóm ngành” trong BCCL.

### Phương án C — Bốn dòng cố định

Luôn hiển thị bốn dòng trống. Cách này ít thao tác hơn nhưng chiếm nhiều không gian trong trình biên tập và không phản ánh đúng số lượng mã thực tế.

## Hướng đã chốt

Chọn **Phương án B — Danh sách dòng động** với các quyết định sau:

- Ban đầu danh sách không có dòng.
- Người dùng bấm “Thêm dòng” để tạo từng mục.
- Mỗi mục có trường Mã cổ phiếu, Vùng mua và nút Xóa.
- Tối đa 4 mục; nút thêm bị vô hiệu hóa khi đủ 4 mục.
- Bảng trên canvas luôn có tiêu đề và tiêu đề cột; khi danh sách rỗng hiển thị “Chưa có dữ liệu”.
- Dữ liệu đi chung vòng đời bản nháp hiện tại: tự lưu cục bộ, Render có chủ đích, khôi phục nội dung gốc theo ngày.

Hướng này được chọn vì dễ nhập, dễ kiểm tra, tương đồng với trải nghiệm người dùng đã quen thuộc và phù hợp với diện tích giới hạn của footer.

## Tương tác chính

1. Người dùng mở bản tin của ngày hiện tại.
2. Khu vực danh sách điểm mua ban đầu không có dòng hoặc nạp lại bản nháp đã lưu của ngày đó.
3. Người dùng bấm “Thêm dòng”, nhập Mã cổ phiếu và Vùng mua; có thể thêm tối đa 4 dòng hoặc xóa từng dòng.
4. Hệ thống tự lưu bản nháp cục bộ sau độ trễ hiện có.
5. Người dùng bấm “Render bản tin”.
6. Nếu dữ liệu hợp lệ, bảng trên canvas được cập nhật và có thể xuất PNG; nếu chưa hợp lệ, lỗi được hiển thị cạnh dòng tương ứng và canvas giữ nội dung đã Render gần nhất.

## Khu vực dự kiến bị ảnh hưởng

- Kiểu dữ liệu nội dung và cấu trúc bản nháp.
- Bộ quản lý trạng thái, đọc/ghi `localStorage` và tương thích bản nháp cũ.
- Trình nhập nội dung trực tiếp trên web.
- Dashboard điều phối tự lưu, Render và khôi phục.
- Canvas bản tin và khung footer góc phải.
- CSS cho danh sách nhập và bảng xuất ảnh.
- Kiểm thử trạng thái, tương tác, render HTML và canvas.

## Câu hỏi mở

Không còn câu hỏi sản phẩm bắt buộc. Chi tiết kích thước chữ, khoảng cách, trạng thái focus/error và cách chuyển đổi bản nháp cũ sẽ được chốt trong bước `04-ui-design` và `05-plan` mà không thay đổi phạm vi đã duyệt.

## Phê duyệt

Thiết kế được người dùng phê duyệt ngày 11/08/2026.

