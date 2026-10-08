# Đặc tả di chuyển nguồn dữ liệu bản tin sang vnstock

- **Phân loại**: `migration`
- **Ngày phê duyệt**: 2026-09-23
- **Trạng thái**: APPROVED
- **Nguồn công thức**: Google Docs `Bao_cao_cong_thuc_Data_Clean_v1`
- **Nguồn danh mục**: `C:\Users\long.DESKTOP-DCLSBL3\Downloads\CNF_Phan_nganh_Co_phieu_2026-09-04.xlsx`

## 1. Bối cảnh

Ứng dụng hiện tại là một website Next.js tạo bản tin thị trường hằng ngày và xuất ảnh PNG. Dữ liệu định lượng đang được đọc từ các bảng Google Sheets công khai, sau đó `lib/bulletin-service.ts` chuẩn hóa dữ liệu thành `BulletinSnapshot` để giao diện hiển thị.

Cách làm hiện tại phụ thuộc vào cấu trúc sheet, trạng thái xuất bản CSV và quyền truy cập Google. Yêu cầu mới là thay hoàn toàn nguồn dữ liệu định lượng Google Sheets bằng một backend Python sử dụng `vnstock`, nhưng không thay đổi đáng kể giao diện hoặc quy trình nhập nội dung định tính trên web.

## 2. Mục tiêu

Xây dựng backend chạy trên VPS, tự động lấy dữ liệu cuối ngày cho danh mục cổ phiếu được phê duyệt, tính các chỉ báo và bộ lọc, lưu kết quả vào PostgreSQL và cung cấp snapshot ổn định cho website hiện tại qua API HTTPS.

Tín hiệu thành công:

- Website hiển thị đầy đủ bảng ngành, Top 10 cổ phiếu mạnh, Top 10 cổ phiếu tiềm năng và độ rộng MA mà không cần Google Sheets.
- Snapshot mới chỉ được công bố khi dữ liệu và phép tính vượt qua kiểm tra chất lượng.
- Nếu cập nhật thất bại, website vẫn dùng snapshot thành công gần nhất và thông báo dữ liệu cũ.
- Có thể chạy lại tác vụ cập nhật thủ công trên VPS.
- Giao diện hiện tại và chức năng xuất PNG tiếp tục hoạt động.

## 3. Phạm vi

### 3.1. Trong phạm vi

- Backend Python sử dụng FastAPI.
- Worker lấy dữ liệu lịch sử và dữ liệu cuối ngày từ `vnstock`.
- PostgreSQL lưu danh mục, giá, chỉ báo, kết quả tổng hợp, snapshot và lịch sử chạy.
- Docker Compose triển khai `api`, `worker`, `postgres` và reverse proxy HTTPS trên VPS.
- Lịch cập nhật một lần sau khi thị trường đóng cửa vào ngày giao dịch; giờ chạy là cấu hình, mặc định đề xuất 17:30 theo múi giờ `Asia/Ho_Chi_Minh`.
- API bảo vệ bằng token để kích hoạt cập nhật thủ công.
- Kết nối Next.js hiện tại với backend thông qua route phía server; token backend không được đưa xuống trình duyệt.
- Giữ tương thích với hợp đồng `BulletinSnapshot` hiện tại trong khả năng hợp lý.
- Import danh mục và phân ngành từ Excel bằng lệnh quản trị trên VPS.
- Chỉ xử lý 265 mã trong tệp phân ngành đã cung cấp.
- Lấy thêm dữ liệu VN-Index để làm chuẩn so sánh ROC26.
- Dùng giá lịch sử đã điều chỉnh để tính ROC, RS, MA và tín hiệu kỹ thuật.
- Giữ cơ chế snapshot gần nhất và trạng thái stale khi cập nhật thất bại.

### 3.2. Ngoài phạm vi

- Không lấy dữ liệu định lượng từ Google Sheets.
- Không duy trì Google Sheets làm nguồn dự phòng.
- Không cập nhật trong phiên theo chu kỳ 5–15 phút.
- Không tự động bổ sung cổ phiếu ngoài danh mục Excel.
- Không xây giao diện upload Excel; danh mục được nhập lại bằng lệnh trên VPS.
- Không chuyển ngày bản tin, kết luận, hành động, nhận định thị trường hoặc danh sách vùng theo dõi sang PostgreSQL.
- Không thay đổi chức năng xuất ảnh PNG.
- Không cung cấp API dữ liệu công khai hoặc dịch vụ bán lại dữ liệu.
- Không triển khai Buy Signal trong bộ lọc cổ phiếu tiềm năng.

## 4. Danh mục và phân ngành chuẩn

Tệp `CNF_Phan_nganh_Co_phieu_2026-09-04.xlsx` là nguồn chuẩn duy nhất cho phạm vi cổ phiếu và phân ngành.

Kết quả kiểm tra tệp:

- 265 mã duy nhất.
- 29 nhóm ngành.
- 190 mã HOSE, 44 mã HNX và 31 mã UPCOM.
- Không có mã trùng.
- Không thiếu nhóm ngành, mã, tên công ty hoặc sàn.
- Các cột dữ liệu: `STT`, `Nhóm ngành`, `Mã CP`, `Tên công ty`, `Sàn`.

Toàn bộ bộ lọc cổ phiếu, bảng ngành và độ rộng thị trường chỉ sử dụng 265 mã này. Khi tệp mới được cung cấp, quản trị viên thay tệp và chạy lệnh import; hệ thống phải kiểm tra trùng mã, trường bắt buộc, sàn hợp lệ và thay đổi danh mục trước khi cập nhật PostgreSQL.

## 5. Kiến trúc đã chốt

Luồng dữ liệu:

```text
vnstock + VN-Index
        |
        v
Python ingestion worker
        |
        v
Chuẩn hóa và kiểm tra OHLCV
        |
        v
Tính ROC, RS, RS Ranking, MA, độ rộng và bộ lọc
        |
        v
PostgreSQL + snapshot bất biến
        |
        v
FastAPI HTTPS
        |
        v
Next.js /api/bulletin
        |
        v
Web bản tin + xuất PNG
```

Các container dự kiến:

- `api`: FastAPI cung cấp snapshot, health check và trạng thái cập nhật.
- `worker`: chạy bootstrap, cập nhật hằng ngày, tính chỉ báo và công bố snapshot.
- `postgres`: lưu dữ liệu bền vững bằng named volume.
- `proxy`: kết thúc TLS và chuyển tiếp request HTTPS.

Frontend tiếp tục được triển khai tại vị trí hiện tại; backend chạy riêng trên VPS.

## 6. Công thức dữ liệu

### 6.1. Biến nguyên tử

`Date`, `Symbol`, `Open`, `High`, `Low`, `Close`, `Volume`.

Giá OHLC dùng chuỗi đã điều chỉnh. Khối lượng dùng khối lượng giao dịch thực tế từ nguồn.

### 6.2. Chỉ báo cơ bản

```text
High-TB4D       = AVG(High, 4)
Vol-TB10D       = AVG(Volume, 10)
CompareVol_10D  = Volume_today / AVG(Volume, 10) * 100
ROC(N)          = (Close_t - Close_t-N) / Close_t-N * 100
MA10            = AVG(Close, 10)
MA20            = AVG(Close, 20)
MA50            = AVG(Close, 50)
MA200           = AVG(Close, 200)
MA50-TB5D       = (MA50_t - MA50_t-5) / MA50_t-5
```

### 6.3. Điểm RS thô

```text
ROC9D_ts  = 0.4 * ROC(Close, 9)
ROC26D_ts = 0.2 * ROC(Close, 26)
ROC33D_ts = 0.2 * ROC(Close, 33)
ROC52D_ts = 0.2 * ROC(Close, 52)
RS_raw    = ROC9D_ts + ROC26D_ts + ROC33D_ts + ROC52D_ts
```

### 6.4. RS Ranking

Với từng phiên:

1. Tính `RS_raw` cho tất cả mã có đủ lịch sử.
2. Xếp hạng chéo trong danh mục hợp lệ của phiên.
3. Chuyển hạng thành percentile 0–100; mã mạnh nhất gần 100 và mã yếu nhất gần 0.
4. Các mã bằng điểm nhận thứ hạng trung bình.
5. Lưu RS Ranking riêng từng phiên rồi mới tính trung bình ba phiên.

`RS Average 3D` là trung bình RS Ranking của ba phiên liên tiếp gần nhất, không phải trung bình điểm RS thô.

## 7. Quy tắc tổng hợp bản tin

### 7.1. Xếp hạng ngành theo sức mạnh giá

- Tính ROC26 của từng mã hợp lệ.
- Lấy trung bình cộng ROC26 của các mã thuộc cùng ngành.
- Xếp 29 ngành giảm dần theo giá trị trung bình.
- Không tính mã thiếu dữ liệu ROC26 vào mẫu số của ngành.
- Ngành không còn mã hợp lệ trong phiên không được công bố cho phiên đó.

### 7.2. Độ rộng thị trường

Tính tỷ lệ cổ phiếu thỏa từng điều kiện:

- `Close > MA10`
- `Close > MA20`
- `Close > MA50`
- `Close > MA200`

Mẫu số của mỗi tỷ lệ chỉ gồm các mã có đủ lịch sử cho MA tương ứng.

### 7.3. Top 10 cổ phiếu mạnh nhất

Điều kiện nghiêm ngặt:

- `Volume > 300000`.
- `ROC26 cổ phiếu > ROC26 VN-Index`.
- Sắp xếp giảm dần theo RS Ranking của phiên hiện tại.
- Lấy tối đa 10 mã.

### 7.4. Top 10 cổ phiếu tiềm năng

Điều kiện nghiêm ngặt:

- `Volume > 300000`.
- RS Ranking của cả ba phiên gần nhất đều nằm trong `[75, 90]`.
- Trung bình RS Ranking ba phiên nằm trong `[75, 90]`.
- ROC26 nằm trong `[10%, 20%]`.
- `ROC26 cổ phiếu > ROC26 VN-Index`.
- `Close > MA20`.
- `MA20 > MA50`.
- `MA50-TB5D > 0`.
- `Close > High-TB4D`.
- `Volume / Vol-TB10D >= 1.5`.
- Không áp dụng Buy Signal.

### 7.5. Bổ sung khi dưới 10 mã

- Mã đạt đủ điều kiện luôn được ưu tiên trước.
- Nếu dưới 10 mã, bổ sung các mã liền kề theo mức độ gần ngưỡng và thứ hạng RS, không trùng lặp.
- Giao diện không gắn nhãn phân biệt mã bổ sung, theo yêu cầu đã chốt.
- Thuật toán khoảng cách ngưỡng chi tiết phải được cố định bằng test trong bước lập kế hoạch trước khi triển khai để kết quả có tính quyết định và lặp lại.

## 8. Mô hình dữ liệu dự kiến

- `sectors`: danh mục 29 ngành.
- `securities`: 265 mã, tên công ty, sàn, ngành và trạng thái kích hoạt.
- `daily_prices`: OHLCV theo mã và ngày, khóa duy nhất `(symbol, trading_date)`.
- `index_prices`: dữ liệu VN-Index theo ngày.
- `daily_indicators`: ROC, RS thô, RS Ranking, MA và các chỉ báo dẫn xuất.
- `sector_metrics`: ROC26 trung bình theo ngành và phiên.
- `market_breadth`: tỷ lệ trên MA10/20/50/200 và mẫu số tương ứng.
- `bulletin_snapshots`: payload hoàn chỉnh, bất biến theo ngày giao dịch.
- `ingestion_runs`: trạng thái lần chạy, thời gian, số mã, cảnh báo và lỗi.

Lần bootstrap đầu tải tối thiểu khoảng 300 phiên cho mỗi mã để đủ MA200 và có vùng đệm.

## 9. Hợp đồng API dự kiến

- `GET /api/v1/bulletin/latest`: trả snapshot tốt gần nhất cùng `asOfDate`, `generatedAt`, trạng thái stale và thông tin lần cập nhật.
- `GET /api/v1/health`: tình trạng API, PostgreSQL, snapshot và độ mới dữ liệu.
- `POST /api/v1/jobs/refresh`: kích hoạt cập nhật thủ công; yêu cầu token quản trị.

Next.js gọi FastAPI từ phía server bằng URL và token trong biến môi trường. Trình duyệt chỉ gọi route Next.js hiện tại và không nhìn thấy token backend.

## 10. Chất lượng dữ liệu và cơ chế lỗi

Snapshot mới chỉ được công bố nguyên tử khi toàn bộ điều kiện tối thiểu đạt:

- Có dữ liệu VN-Index cho phiên mục tiêu.
- Không trùng `(symbol, trading_date)`.
- `High >= max(Open, Close, Low)` và `Low <= min(Open, Close, High)` sau chuẩn hóa.
- Giá dương và khối lượng không âm.
- Tỷ lệ mã có dữ liệu phiên mục tiêu đạt ngưỡng cấu hình.
- Các chỉ báo quan trọng không có giá trị vô hạn hoặc lỗi chia cho 0.
- Payload snapshot vượt qua kiểm tra schema.

Nếu cập nhật lỗi:

- Không ghi đè snapshot tốt gần nhất.
- API tiếp tục trả snapshot gần nhất với `stale=true` và lý do phù hợp.
- Frontend hiển thị thời gian cập nhật và cảnh báo dữ liệu cũ.
- Lịch sử lỗi được ghi vào `ingestion_runs`.
- Quản trị viên có thể chạy lại thủ công.

## 11. Bảo mật và vận hành

- Backend chỉ phục vụ website nội bộ qua HTTPS.
- Endpoint cập nhật thủ công dùng token bí mật và rate limit.
- PostgreSQL không mở cổng công khai.
- Secrets chỉ nằm trong biến môi trường trên VPS.
- Có health check, log có cấu trúc và chính sách backup PostgreSQL.
- Việc sử dụng `vnstock` ở giai đoạn đầu là nội bộ/cá nhân; không tái phân phối hoặc bán dữ liệu.

## 12. Các phương án thiết kế đã cân nhắc

### Phương án A — Gọi vnstock trực tiếp từ request web

- Ưu điểm: ít thành phần.
- Nhược điểm: chậm, dễ quá giới hạn nguồn, không ổn định và phải tính lại hàng trăm mã cho mỗi request.
- Kết luận: loại bỏ.

### Phương án B — Worker theo lịch + PostgreSQL + API snapshot

- Ưu điểm: ổn định, có lịch sử, kiểm tra chất lượng, phục hồi khi nguồn lỗi và API nhanh.
- Nhược điểm: cần VPS, Docker và vận hành cơ sở dữ liệu.
- Kết luận: được chọn.

### Phương án C — Worker chỉ xuất JSON tĩnh

- Ưu điểm: triển khai nhẹ.
- Nhược điểm: khó truy vấn lịch sử, kiểm tra lần chạy, nhập danh mục và phục hồi dữ liệu.
- Kết luận: không chọn.

## 13. Hướng đã chốt

- Thay toàn bộ dữ liệu định lượng Google Sheets bằng `vnstock`.
- Cập nhật cuối ngày, không cập nhật trong phiên.
- Backend Python/FastAPI trên VPS bằng Docker.
- PostgreSQL làm kho dữ liệu và snapshot.
- Frontend giữ nơi triển khai hiện tại và gọi backend qua server-side API.
- Chuyển trực tiếp, không chạy song song và không dùng Google Sheets dự phòng.
- Chỉ dùng danh mục 265 mã và 29 ngành từ Excel đã cung cấp.
- Import lại Excel bằng lệnh quản trị trên VPS.
- Dùng giá điều chỉnh.
- Tính RS thô theo công thức 9/26/33/52, sau đó chuyển thành RS Ranking percentile 0–100 từng phiên.
- Bảng ngành dùng trung bình ROC26 của các cổ phiếu thành viên.
- Giữ nội dung định tính và ngày bản tin trong trình duyệt.
- Khi cập nhật lỗi, giữ snapshot tốt gần nhất.

## 14. Khu vực dự kiến bị ảnh hưởng

Frontend hiện tại:

- `app/api/bulletin/route.ts`
- `lib/bulletin-service.ts`
- `lib/google-sheets.ts`
- `lib/server-config.ts`
- `lib/types.ts`
- `.env.example`

Thành phần mới dự kiến:

- Thư mục backend Python/FastAPI.
- Adapter nguồn `vnstock`.
- Worker và scheduler.
- Mô-đun tính chỉ báo, tổng hợp ngành, độ rộng và bộ lọc.
- Schema và migration PostgreSQL.
- CLI import Excel danh mục.
- Dockerfile, Docker Compose và cấu hình reverse proxy.
- Unit test công thức, test bộ lọc, test snapshot và test hợp đồng API.

## 15. Tiêu chí nghiệm thu

- Import chính xác 265 mã, 29 ngành và cơ cấu sàn từ Excel.
- Bootstrap đủ lịch sử để tính MA200 cho các mã có đủ dữ liệu.
- Công thức ROC, RS thô, RS Ranking, MA và volume ratio có test với kết quả biết trước.
- Kết quả Top 10 tuân thủ đúng điều kiện và quy tắc bổ sung.
- Snapshot mới chỉ được công bố sau khi kiểm tra dữ liệu thành công.
- `GET /api/v1/bulletin/latest` đáp ứng schema frontend cần.
- Web hiển thị dữ liệu backend mà không đổi trải nghiệm nhập nội dung hoặc xuất PNG.
- Tác vụ lỗi không làm mất snapshot tốt gần nhất.
- Health check phân biệt được dữ liệu mới, dữ liệu cũ và chưa có snapshot.
- Không còn request Google Sheets trong luồng sản xuất.

## 16. Câu hỏi mở cho bước lập kế hoạch

Các mục sau không thay đổi hướng thiết kế nhưng cần được khóa trong kế hoạch triển khai:

- Chọn provider cụ thể trong `vnstock` và xác minh khả năng trả giá điều chỉnh cho toàn bộ danh mục.
- Chốt giờ chạy sản xuất chính xác và chiến lược retry sau đóng cửa.
- Chốt ngưỡng tối thiểu số mã phải cập nhật để công bố snapshot.
- Định nghĩa toán học chính xác cho khoảng cách ngưỡng khi bổ sung mã liền kề.
- Chốt chính sách backup và thời gian lưu dữ liệu PostgreSQL.
- Chốt cơ chế chứng thực giữa Next.js và FastAPI.

## 17. Bàn giao

Đặc tả này là đầu vào chính thức cho `05-plan`. Bước kế tiếp phải lập kế hoạch triển khai theo TDD, tách rõ các đợt phụ thuộc cho backend, cơ sở dữ liệu, tích hợp frontend, Docker/VPS và kiểm thử; chưa triển khai mã nguồn trước khi kế hoạch được phê duyệt.
