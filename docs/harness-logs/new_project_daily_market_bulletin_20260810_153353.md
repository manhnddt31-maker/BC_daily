# Nhật ký Pipeline

- Pipeline: `new_project_daily_market_bulletin_20260810_153353`
- Trạng thái: `RUNNING`

## Skill Execution Log: 04-ui-design

- **Skill**: 04-ui-design
- **Nhiệm vụ**: Thiết kế giao diện dashboard và vùng xuất ảnh 1920×1080.
- **Đầu vào nhận được**: Đặc tả đã phê duyệt, demo CNF và `Data.xlsx`.
- **Files đã tạo**: `docs/ui-design/system_design.md`.
- **Kết quả kiểm tra**: PASS — rà soát đặc tả tĩnh; chưa thể build/kiểm tra hình ảnh vì ứng dụng chưa tồn tại ở thời điểm đó.
- **Số lần tự sửa lỗi**: 0.
- **Trạng thái**: COMPLETED.

## Skill Execution Log: 05-plan

- **Skill**: 05-plan
- **Nhiệm vụ**: Lập kế hoạch triển khai có thể thực thi cho dashboard dữ liệu Google Sheets và xuất PNG.
- **Đầu vào nhận được**: `docs/spec/spec_new_project_daily-market-bulletin_20260810.md`, `docs/ui-design/system_design.md`, demo CNF, `Data.xlsx` và tài liệu chính thức Google/Next.js.
- **Files đã tạo**: `docs/plan/plan_new_project_cnf_daily_market_bulletin_20260810.md`.
- **Kết quả kiểm tra**: PASS — kiểm tra đủ các phần bắt buộc của kế hoạch (`PLAN_COMPLETENESS_PASS`); `semantic-validate --project-root .` trả về `Harness validation passed.`
- **Số lần tự sửa lỗi**: 0.
- **Trạng thái**: COMPLETED.
- **Ghi chú**: Chờ người dùng phê duyệt kế hoạch trước khi vào TDD/triển khai; thay đổi dependency và cấu hình môi trường cần xác nhận high-risk riêng.

## Skill Execution Log: 06-implement (Wave 1 — bootstrap)

- **Skill**: 06-implement
- **Nhiệm vụ**: Khởi tạo skeleton Next.js TypeScript, toolchain lint/test và cấu hình bảo vệ secrets.
- **Đầu vào nhận được**: Kế hoạch được phê duyệt, xác nhận high-risk cho dependency/config, Node.js LTS `v24.19.0`.
- **Files đã tạo**: `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `eslint.config.mjs`, `.gitignore`, `.env.example`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`.
- **Files đã sửa**: `tsconfig.json` — Next.js tự thêm kiểu `.next/dev` và đặt `jsx: react-jsx` trong lúc build.
- **Kết quả kiểm tra**: PASS — `npm run lint` PASS; `npm run build` PASS với Next.js 16.3.0.
- **Số lần tự sửa lỗi**: 1 — môi trường PowerShell chưa nạp PATH Node.js mới; chạy lại với `C:\Program Files\nodejs` trong PATH và PASS, không sửa mã nguồn.
- **Trạng thái**: COMPLETED.
- **Ghi chú**: TDD không áp dụng cho Wave 1 vì chỉ là khung/config chưa có hành vi độc lập. Npm báo một postinstall của dependency bắc cầu chưa được phê duyệt; không chạy script đó.

## Skill Execution Log: 06-implement (Wave 2 — asset và hợp đồng dữ liệu)

- **Skill**: 06-implement
- **Nhiệm vụ**: Đưa logo CNF vào app, định nghĩa kiểu dữ liệu và cấu hình tập trung cho Sheet/filter.
- **Đầu vào nhận được**: Archive logo của người dùng, `Data.xlsx` đã khảo sát và kế hoạch được phê duyệt.
- **Files đã tạo**: `public/assets/cnf-logo.png`, `lib/types.ts`, `lib/server-config.ts`, `config/filters.ts`, `config/sheet-mapping.ts`.
- **Files đã sửa**: Không có thay đổi nội dung mới tại `.env.example`; file vẫn chỉ chứa tên biến server-side, không có secret.
- **Kết quả kiểm tra**: PASS — kiểm tra asset có kích thước 28,990 bytes; `npm run lint` PASS; `npm run build` PASS.
- **Số lần tự sửa lỗi**: 1 — `tar` Windows không hỗ trợ `--strip-components`; chuyển sang `Expand-Archive` và copy đúng asset, không ảnh hưởng source code.
- **Trạng thái**: COMPLETED.
- **Ghi chú**: `SHEET_MAPPING.vnIndexRoc26.range` cố ý để trống cho đến khi chủ sở hữu xác nhận nguồn ROC26 của VNINDEX; hệ thống sau này phải báo lỗi rõ thay vì suy đoán.

## Skill Execution Log: 09-test (Wave 3 — Red cho parser và filter)

- **Skill**: 09-test
- **Nhiệm vụ**: Viết test TDD Red cho parse số và hai bộ lọc chứng khoán.
- **Đầu vào nhận được**: `lib/types.ts`, `config/filters.ts`, `docs/plan/plan_new_project_cnf_daily_market_bulletin_20260810.md`.
- **Files đã tạo**: `tests/fixtures/stocks.ts`, `tests/filters.test.ts`, `tests/parsers.test.ts`.
- **Kết quả kiểm tra**: PASS (Red expected) — `npm run test` thất bại do không tìm thấy `../lib/filters` và `../lib/parsers`, xác nhận chưa có production logic.
- **Số lần tự sửa lỗi**: 0.
- **Trạng thái**: COMPLETED.
- **Ghi chú**: Handoff cho 06-implement: tạo `parseNumber`, `selectStrongStocks`, `selectPotentialStocks`; chạy lại `npm run test` phải chuyển xanh.

## Skill Execution Log: 06-implement (Wave 4 — parser và filter)

- **Skill**: 06-implement
- **Nhiệm vụ**: Hiện thực parse số và hai bộ lọc theo các test Red đã bàn giao.
- **Đầu vào nhận được**: `tests/filters.test.ts`, `tests/parsers.test.ts`, `config/filters.ts`, `lib/types.ts`.
- **Files đã tạo**: `lib/parsers.ts`, `lib/filters.ts`.
- **Kết quả kiểm tra**: PASS — `npm run test` trả về 2 files, 5 tests PASS.
- **Số lần tự sửa lỗi**: 0.
- **Trạng thái**: COMPLETED.
- **Ghi chú**: Bộ lọc tiềm năng ưu tiên strict candidates, sau đó near-miss theo số điều kiện và tie-breaker; input có `averageVolume10d <= 0` bị loại để không tạo tỷ lệ vô hạn.

## Skill Execution Log: 09-test (Wave 3 — Red cho Google Sheets gateway)

- **Skill**: 09-test
- **Nhiệm vụ**: Viết test Red cho batch read nhiều range và chặn range rỗng.
- **Đầu vào nhận được**: `config/sheet-mapping.ts`, `lib/server-config.ts`, yêu cầu R2–R5.
- **Files đã tạo**: `tests/google-sheets.test.ts`.
- **Kết quả kiểm tra**: PASS (Red expected) — `npm run test -- google-sheets` thất bại do không tìm thấy `../lib/google-sheets`.
- **Số lần tự sửa lỗi**: 0.
- **Trạng thái**: COMPLETED.
- **Ghi chú**: Handoff cho 06-implement: module phải dùng `batchGet`, `UNFORMATTED_VALUE` và fail fast khi range rỗng.

## Skill Execution Log: 06-implement (Wave 3 — Google Sheets gateway)

- **Skill**: 06-implement
- **Nhiệm vụ**: Hiện thực gateway read-only cho Google Sheets API.
- **Đầu vào nhận được**: `tests/google-sheets.test.ts`, `lib/server-config.ts` và mapping Sheet.
- **Files đã tạo**: `lib/google-sheets.ts`.
- **Kết quả kiểm tra**: PASS — `npm run test -- google-sheets` trả về 1 file, 2 tests PASS.
- **Số lần tự sửa lỗi**: 0.
- **Trạng thái**: COMPLETED.
- **Ghi chú**: Module dùng scope `spreadsheets.readonly`; không có API ghi Sheet. Chưa gọi Sheet thật vì chưa được cung cấp secret/mapping ROC26 VNINDEX.

## Skill Execution Log: 06-implement (Wave 4 — canvas dashboard)

- **Skill**: 06-implement
- **Nhiệm vụ**: Dựng canvas bản tin 1920×1080 và các panel theo UI spec.
- **Đầu vào nhận được**: `docs/ui-design/system_design.md`, `BulletinSnapshot` và logo CNF.
- **Files đã tạo**: `components/bulletin-canvas.tsx`, `components/sector-ranking.tsx`, `components/stock-table.tsx`, `components/market-breadth.tsx`, `components/narrative-panel.tsx`.
- **Files đã sửa**: `app/page.tsx`, `app/globals.css`, `lib/google-sheets.ts`.
- **Kết quả kiểm tra**: PASS — `npm run lint` PASS; `npm run build` PASS.
- **Số lần tự sửa lỗi**: 1 — build phát hiện kiểu mock hẹp hơn `googleapis` client; bỏ return annotation của factory để SDK tự suy luận đúng kiểu, không thay đổi logic read-only.
- **Trạng thái**: COMPLETED.
- **Ghi chú**: Canvas không chứa data tĩnh; đang ở trạng thái chờ API snapshot để tránh hiển thị dữ liệu giả.

## Skill Execution Log: 06-implement (Điều chỉnh mapping dữ liệu)

- **Skill**: 06-implement
- **Nhiệm vụ**: Xác minh và cấu hình nguồn ROC26 VNINDEX không hard-code theo ô.
- **Đầu vào nhận được**: `Data.xlsx` của người dùng.
- **Files đã sửa**: `config/sheet-mapping.ts`.
- **Kết quả kiểm tra**: PASS — xác minh `Data_26D` có các cột `Ticker`, `Date/Time`, `26D change (%)` và các bản ghi `VNINDEX`; range được đặt là `'Data_26D'!A:G` để service chọn ngày mới nhất động.
- **Số lần tự sửa lỗi**: 1 — môi trường Python không có `openpyxl`; chuyển sang đọc XML nội bộ của XLSX, không cài thêm dependency.
- **Trạng thái**: COMPLETED.
- **Ghi chú**: `Web_Bulletin` để optional (`range: ""`) nhằm không làm fail batch read khi tab chưa tồn tại.

## Skill Execution Log: 09-test và 06-implement (Snapshot, API, polling, export)

- **Skill**: 09-test → 06-implement
- **Nhiệm vụ**: Tạo snapshot server, API public, polling 5 phút và xuất PNG.
- **Files đã tạo**: `tests/bulletin-service.test.ts`, `lib/bulletin-service.ts`, `app/api/bulletin/route.ts`, `components/bulletin-dashboard.tsx`.
- **Files đã sửa**: `app/page.tsx`, `app/globals.css`, `lib/google-sheets.ts`.
- **Kết quả kiểm tra**: PASS — Red xác nhận thiếu service; sau Green, `npm run test` PASS 4 files/8 tests, `npm run lint` PASS, `npm run build` PASS và có route `/api/bulletin`.
- **Số lần tự sửa lỗi**: 3 — sửa adapter type của Google SDK và scheduling React effect cho đến khi build/lint xanh.
- **Trạng thái**: COMPLETED.
- **Ghi chú**: Endpoint trả `503 DATA_UNAVAILABLE` có chủ đích cho tới khi secrets server được đặt; không có credential trong browser.

## Skill Execution Log: 03-brainstorm

- **Skill**: 03-brainstorm
- **Nhiệm vụ**: Chốt thiết kế dashboard tự cập nhật và xuất PNG.
- **Đầu vào nhận được**: Demo CNF, `Data.xlsx`, Google Sheet và tiêu chí lọc được người dùng phê duyệt.
- **Files đã tạo**: `docs/spec/spec_new_project_daily-market-bulletin_20260810.md`.
- **Kết quả kiểm tra**: PASS — có thiết kế được phê duyệt.
- **Số lần tự sửa lỗi**: 0.
- **Trạng thái**: COMPLETED

## Skill Execution Log: 09-test → 08-fix (Google Sheets public CSV)

- **Skill**: 09-test, 08-fix, 06-implement.
- **Nhiệm vụ**: Chuyển nguồn dữ liệu sang một URL Google Sheets public, đọc bốn tab CSV và xử lý đúng cấu trúc thực tế.
- **Files đã sửa**: `lib/published-csv.ts`, `lib/bulletin-service.ts`, `tests/published-csv.test.ts`, `tests/bulletin-service.test.ts`.
- **Kết quả kiểm tra**: PASS — truy cập trực tiếp bốn tab trả HTTP 200; `npm run test` PASS 5 files/12 tests; `npm run lint` PASS; `npm run build` PASS.
- **Số lần tự sửa lỗi**: 2 — parser CSV nay giữ nguyên số có dấu phẩy trong ngoặc kép; sector/breadth mapping nay dùng header và chọn ngày mới nhất.
- **Trạng thái**: COMPLETED.
- **Ghi chú**: Dữ liệu trong app làm mới qua API mỗi 5 phút. Lần gọi endpoint cục bộ trong sandbox không thể kiểm chứng do tiến trình Node bị chặn mạng ra ngoài, trong khi PowerShell có quyền đã đọc thành công Google Sheets. Đây là giới hạn môi trường kiểm tra, không phải lỗi quyền chia sẻ Sheet.

## Skill Execution Log: 09-test → 08-fix → 10-review (Kiểm chứng dữ liệu thật)

- **Skill**: 09-test, 08-fix, 10-review.
- **Nhiệm vụ**: Kiểm chứng adapter bằng đúng dữ liệu public và sửa ngày/ROC26 VNINDEX.
- **Files đã sửa**: `lib/bulletin-service.ts`, `tests/bulletin-service.test.ts`.
- **Kết quả kiểm tra**: PASS — endpoint production build trả HTTP 200 với `vnIndexRoc26: -1.07`, 10 mã mạnh, 10 mã tiềm năng, 22 ngành và breadth đầy đủ; `npm run test` PASS 5 files/14 tests; lint/build PASS.
- **Số lần tự sửa lỗi**: 2 — hỗ trợ `dd/mm/yyyy` ở `Date/Time` và số âm dạng `(1.07)`.
- **Trạng thái**: COMPLETED.
- **Ghi chú dữ liệu**: tại thời điểm kiểm tra, `Data_26D` mới nhất là `06/07/2026`, trong khi `Data Clean`/`Đếm MA` là `10/08/2026`. App phản ánh ngày thực của dòng VNINDEX; cần đồng bộ tab nguồn nếu muốn mọi panel cùng phiên.
