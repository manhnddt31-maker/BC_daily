# Nhật ký pipeline: debug_fix_current_sheet_refresh_failure_20260818_081707

- **Pattern**: Fix Bug — nguyên nhân chưa biết, phức tạp, TDD.
- **Mục tiêu**: Tái hiện lỗi web không cập nhật dữ liệu, xác định root cause chính xác và sửa có proof-of-fix.
- **Trạng thái**: RUNNING — đang ở pha `05-plan`.

## 07-bugfinder — completed

- Reproduction: local `GET /api/bulletin` returned HTTP 503 repeatedly with `SOURCE_SCHEMA_INVALID` and source `Data Clean`.
- Source availability: all four required Google Sheets CSV tabs returned HTTP 200 with non-empty data.
- Confirmed root cause: the live `Data Clean` header is now flattened from grouped/merged cells (for example `Thông tin định danh và Ngành Cổ Phiếu`, `Khối lượng giao dịch KLGD`, and `MA50-TB5D MA50-TB5D`), while the parser and schema gate require exact legacy labels such as `Cổ Phiếu`, `KLGD`, and `MA50-TB5D`.
- Divergence point: `lib/bulletin-service.ts:54-56` cannot resolve the live header; `lib/bulletin-service.ts:107` rejects the source before rendering.
- Alternatives ruled out: Google permission/network failure, browser cache/polling failure, other required-tab outage, and the most recent UI-only commit.
- Coverage gap: the existing bulletin-service suite passes 10/10 but contains no live-shaped merged-header regression case.
- Next phase: `05-plan`.

## 05-plan — awaiting approval

- Plan artifact: `docs/plan/plan_debug_fix_google_sheet_header_refresh_20260818.md`.
- Planned source scope: `tests/bulletin-service.test.ts` and `lib/bulletin-service.ts` only.
- Chosen direction: strict semantic header resolution for legacy and flattened merged-cell labels; preserve rejection of unrelated Google fallback tabs.
- Required gate: `fix_plan_approval` before `09-test` Red and any production-code change.

## Gate — approved

- Người dùng đã phê duyệt `fix_plan_approval` ngày 2026-08-18.
- Chuyển sang `09-test` TDD Red, phạm vi duy nhất: `tests/bulletin-service.test.ts`.

## 09-test — Red completed

- Tệp: `tests/bulletin-service.test.ts`.
- Test mới: `test_reads_flattened_merged_headers_from_live_google_csv`.
- Lệnh: `npm.cmd test -- tests/bulletin-service.test.ts`.
- Kết quả: exit `1`; 1 test mới thất bại, 10 test cũ đỗ.
- Chữ ký lỗi: `PublishedCsvError: Data Clean: SOURCE_SCHEMA_INVALID` tại `requireSourceHeaders`, khớp lỗi API sống.
- Handoff sang `08-fix`: chỉ sửa `lib/bulletin-service.ts`; làm test mới đỗ mà không làm yếu hai test từ chối Google fallback tab.

## 08-fix — Green/Refactor completed

- Tệp sửa: `lib/bulletin-service.ts`.
- Thay đổi: thêm resolver nhãn cột `Data Clean` ưu tiên exact match và cho phép semantic suffix có ranh giới sau tiền tố do merged cells tạo ra.
- Targeted regression: 11/11 test đỗ.
- Full regression: 67/67 test đỗ.
- Lint: exit `0`.
- Production build: exit `0`; Next.js 16.3.0 compile và TypeScript thành công.
- Proof-of-fix API sạch: 5/5 request HTTP `200`, thời gian 0,45–0,86 giây; mỗi snapshot có 22 ngành, 10 strong stocks, 10 potential stocks và market breadth.
- Causal linkage: trước sửa, live-shaped header bị từ chối với `SOURCE_SCHEMA_INVALID`; sau sửa, cùng header tạo `AAA` với `volume: 500000` và `ma50Slope5d: 1` trong regression test, còn API sống trả snapshot.
- Ghi chú môi trường: tiến trình `next dev` cũ còn sót gây hai client timeout trong lần kiểm tra đầu; production server sạch đạt 5/5 và lỗi timeout không tái diễn.
- Chuyển sang `10-review`.

## 10-review — PASS

- Stage 1: R1–R7 đạt; legacy layout vẫn đỗ, live flattened-header layout đỗ, unrelated fallback tabs vẫn bị từ chối.
- Stage 2: không có finding Critical/High; helper là hàm thuần, không thêm dependency, mutable state hoặc dữ liệu nhạy cảm.
- Reviewer rerun: `GET /api/bulletin` trả HTTP `200`, 22 ngành, 10 strong stocks, 10 potential stocks; symptom “Dữ liệu bản tin chưa sẵn sàng” không còn.
- Causal linkage: PRESENT tại resolver header và regression assertion cho `volume`/`ma50Slope5d`.
- Cảnh báo dữ liệu nguồn ngoài diff: `Đếm MA` đã tới 17-08-2026 nhưng `Data_26D` công khai vẫn chỉ có ngày 7/13/2026; vì vậy API hợp lệ nhưng `asOfDate`/VNINDEX benchmark hiện là 2026-07-13 cho đến khi tab đó được cập nhật.
- Verdict Tier 3: VERIFIED.
