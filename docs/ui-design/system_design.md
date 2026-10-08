# UI/UX Design Deliverable — Trình biên tập nhận định CNF Morning Bulletin

## Addendum 2026-08-12 — Thuật ngữ vùng theo dõi

- Đổi nhãn hiển thị `Vùng mua` thành `Vùng theo dõi` trong editor và `VÙNG THEO DÕI` trên canvas.
- Giữ nguyên trường dữ liệu nội bộ `buyZone` để bảo toàn tương thích với các bản nháp đã lưu.
- Không thay đổi bố cục, kích thước cột, giới hạn ký tự hoặc quy tắc nhập dữ liệu.
- Addendum này thay thế thuật ngữ “Vùng mua” trong các phần mô tả cũ bên dưới.

## Addendum 2026-08-12 — Ngày bản tin thủ công

- Thêm trường native `type="date"` với nhãn **Ngày hiển thị trên bản tin** ở đầu form editor.
- Trường dùng cùng nền, viền cyan, focus ring và trạng thái disabled với input hiện có; chiều cao tối thiểu 44 px.
- Thay đổi ngày là draft và chỉ cập nhật canvas sau **Render bản tin**.
- Draft lưu cục bộ theo ngày dữ liệu nguồn; Reset đưa về ngày hiện tại của máy tính.
- Thứ tự bàn phím bắt đầu bằng trường ngày, sau đó tới Kết luận, Hành động và Nhận định thị trường.
- Editor mobile giữ trường ngày full-width; canvas và bố cục ảnh 1920×1080 không thay đổi.

- **Generated**: 2026-08-11 15:25 (Asia/Saigon)
- **Designer**: 04-ui-design skill (Codex)
- **Surface**: Trang biên tập nội dung định tính và xem trước bản tin hằng ngày
- **Platform class**: Web
- **Scope**: Bổ sung editor cho Kết luận, Hành động, Nhận định thị trường; bố cục PC/Tablet/Mobile; giữ nguyên canvas xuất ảnh 1920×1080
- **Out of scope**: Ghi Google Sheets, đăng nhập/phân quyền, đồng bộ nhiều thiết bị, sửa dữ liệu định lượng, nhập/xuất JSON, thay đổi bộ lọc cổ phiếu

---

## 1. Brief & Goals

### 1.1 Restated Brief

Người vận hành cần nhập trực tiếp ba phần nhận định trên cùng trang đang xem bản tin, theo mô hình editor trái và preview phải của web BCCL. Nội dung tự lưu trong trình duyệt theo ngày bản tin, chỉ được áp dụng lên preview khi người dùng chọn **Render bản tin**, và editor không xuất hiện trong PNG. Dữ liệu định lượng tiếp tục tự động cập nhật từ Google Sheets qua API hiện có.

### 1.2 User Task Statements

- Người vận hành cần nhập Kết luận, Hành động và Nhận định thị trường để hoàn thiện bản tin mà không sửa mã nguồn hay Google Sheets.
- Người vận hành cần xem trước đúng nội dung đã render để kiểm tra trước khi xuất PNG.
- Người vận hành cần mở lại cùng ngày và tiếp tục bản nháp đã nhập trên cùng trình duyệt.
- Người vận hành cần khôi phục nội dung nguồn khi không muốn dùng bản nháp cục bộ.

### 1.3 Personas (if any)

Không sử dụng personas chi tiết — đối tượng đã rõ là một người vận hành bản tin CNF, dùng PC là chính và thỉnh thoảng kiểm tra bằng tablet/mobile.

### 1.4 Success Metrics

- Hoàn tất nhập và render ba trường trong dưới 2 phút ở lần sử dụng đầu.
- Không mất bản nháp khi tải lại trang trên cùng trình duyệt và cùng `asOfDate`.
- Không có nội dung ngày cũ tự động xuất hiện trong bản tin ngày mới.
- 100% ảnh PNG chỉ chứa `#bulletin-canvas`, không chứa editor hoặc toolbar.
- Tất cả tác vụ chính dùng được bằng bàn phím và có phản hồi trạng thái rõ ràng.

## 2. Stack & Tokens

### 2.1 Stack Snapshot

- Framework: Next.js 16.3 App Router + React 19.2 + TypeScript 6
- Style layer: CSS toàn cục + CSS custom properties; không dùng Tailwind
- Component library: Không có; mở rộng component hiện hữu, không thêm thư viện UI
- Icon set: SVG nội bộ hiện có; editor ưu tiên chữ và icon SVG đồng nhất, không dùng emoji làm icon cấu trúc
- Motion: CSS transition thuần
- i18n: Tiếng Việt đơn ngữ; `<html lang="vi">` đã có

### 2.2 Brand Snapshot

- Existing tokens: Có trong `app/globals.css`; chuẩn hóa tên semantic khi triển khai
- Brand colors: Navy rất đậm, cyan phát sáng, xanh lá tích cực, xanh dương hành động, đỏ cảnh báo
- Brand voice: Chính xác, cô đọng, nghiêm túc, thiên về dữ liệu
- Hướng giao diện: Editor mang cùng ngôn ngữ thị giác với canvas nhưng giảm hiệu ứng phát sáng để dễ nhập văn bản dài

### 2.3 Tokens (Primitives + Semantics)

#### 2.3.1 Color primitives

| Primitive | Value | Mục đích |
|---|---:|---|
| `navy.950` | `#000B14` | Nền trang/editor |
| `navy.900` | `#00101D` | Nền bulletin |
| `navy.850` | `#001725` | Surface/panel |
| `navy.800` | `#032238` | Input và surface nổi |
| `cyan.400` | `#00E6E8` | Focus và accent chính |
| `cyan.500` | `#00BFCB` | Viền có ý nghĩa |
| `blue.600` | `#1452A4` | Nút hành động chính |
| `blue.700` | `#0C367A` | Hover/active |
| `green.400` | `#11EF24` | Thành công/tích cực |
| `amber.300` | `#FFC95C` | Cảnh báo/chưa render |
| `red.400` | `#FF625C` | Lỗi |
| `neutral.50` | `#F7F6F2` | Chữ chính |
| `neutral.300` | `#C9D3D8` | Chữ phụ |
| `neutral.600` | `#71818A` | Disabled |

#### 2.3.2 Color semantics — dark theme mặc định

| Semantic | Value | Maps to primitive | Contrast | WCAG |
|---|---:|---|---:|---|
| `color.bg.canvas` | `#000B14` | `navy.950` | 18.36 với text primary | AAA |
| `color.bg.surface` | `#001725` | `navy.850` | 16.90 với text primary | AAA |
| `color.bg.input` | `#032238` | `navy.800` | 14.10+ với text primary | AAA |
| `color.text.primary` | `#F7F6F2` | `neutral.50` | 18.36 trên canvas | AAA |
| `color.text.secondary` | `#C9D3D8` | `neutral.300` | 12.00 trên surface | AAA |
| `color.border.default` | `#00BFCB` | `cyan.500` | 8.10 trên surface | Pass UI |
| `color.border.focus` | `#00E6E8` | `cyan.400` | 12.75 trên canvas | Pass UI |
| `color.action.primary.bg` | `#1452A4` | `blue.600` | 7.57 với trắng | AAA |
| `color.feedback.success` | `#11EF24` | `green.400` | 12.66 trên canvas | AAA |
| `color.feedback.warning` | `#FFC95C` | `amber.300` | 13.01 trên canvas | AAA |
| `color.feedback.danger` | `#FF625C` | `red.400` | 6.76 trên canvas | AA |

Light theme là **non-goal** của phiên bản này vì canvas thương hiệu và trang tham chiếu đều là dark-only. Không khai báo token light giả định; nếu bổ sung sau, phải audit tương phản độc lập.

#### 2.3.3 Type Scale

| Role | Size | Line | Weight | Tracking |
|---|---:|---:|---:|---:|
| Editor heading | 24 px | 1.4 | 700 | -0.005em |
| Section heading | 18 px | 1.5 | 700 | 0 |
| Body/input | 16 px | 1.6 | 400/500 | 0 |
| Button/label | 14 px | 1.55 | 600 | 0 |
| Caption/status | 12 px | 1.55 | 500 | 0 |

Canvas 1920×1080 tiếp tục dùng thang chữ display hiện tại; editor không thay đổi typography bên trong canvas ngoài nội dung người dùng nhập.

#### 2.3.4 Spacing / Radius / Shadow / Motion / Breakpoints

| Nhóm | Tokens |
|---|---|
| Spacing | `space.1=4`, `2=8`, `3=12`, `4=16`, `6=24`, `8=32` px |
| Radius | `sm=4`, `md=6`, `lg=8`, `xl=12` px |
| Shadow | `sm=0 1px 3px rgba(0,0,0,.28)`; `focus=0 0 0 3px rgba(0,230,232,.25)` |
| Motion | `instant=50`, `fast=150`, `medium=250` ms; easing standard `cubic-bezier(.4,0,.2,1)` |
| Icon | `sm=16`, `md=20`, `lg=24` px; vùng chạm tối thiểu 44 px |
| Breakpoints | `sm=640`, `md=768`, `lg=1024`, `xl=1280`, `2xl=1536` px |
| Z-index | `base=0`, `sticky=20`, `toast=40`, `dialog=50` |

### 2.4 Token Export

- Format: CSS custom properties trong `:root`
- File path khi triển khai: mở rộng `app/globals.css`, không tạo hệ token song song
- Quy tắc: component chỉ dùng biến semantic; hex chỉ xuất hiện ở vùng khai báo primitives/tokens

## 3. Vietnamese Typography

### 3.1 Font Selection

- Editor: `"Segoe UI", Arial, sans-serif` theo stack hiện tại, đã hỗ trợ đầy đủ tiếng Việt trên Windows; không thêm request font mạng
- Canvas: giữ `"Bahnschrift Condensed", "Arial Narrow", "Roboto Condensed", "Segoe UI", Arial, sans-serif` để bảo toàn hình ảnh hiện tại
- Mono: Không cần trong phạm vi tính năng
- Không dùng placeholder thay label; không tự hyphen tiếng Việt

### 3.2 Loading Strategy

Dùng font hệ thống sẵn có để không thêm tải mạng và không gây layout shift. Nếu sau này self-host font thương hiệu, ưu tiên Be Vietnam Pro với subset `vietnamese`, `latin-ext`, `latin` và `font-display: swap`.

### 3.3 Diacritic Test Renderings

- [ ] Body 16 px / 400: dấu thanh không chạm dòng trên, dấu chấm dưới không bị cắt
- [ ] Body 16 px / 700: nét dấu không dính thành khối
- [ ] Caption 12 px: `ạ`, `ụ` còn nhìn rõ
- [ ] Heading 24 px: dấu căn đúng cap-height
- [ ] Chuỗi “Bạn cần tài khoản — Đăng nhập để tiếp tục” không bị tràn ở 320 px

### 3.4 Locale Decisions

- `lang="vi"` giữ trên document root
- Ngày bản tin dùng `Intl.DateTimeFormat("vi-VN")`; khóa Local Storage dùng ngày ISO ổn định `YYYY-MM-DD`
- Số liệu định lượng tiếp tục format `vi-VN`; không thay đổi logic dữ liệu
- Không áp dụng quy tắc số nhiều tiếng Anh vào nhãn tiếng Việt

### 3.5 Microcopy Style

- Hành động dùng động từ: “Render bản tin”, “Khôi phục nội dung gốc”, “Xuất PNG 1920×1080”
- Trạng thái ngắn, cụ thể: “Đã tự lưu lúc 13:38”, “Có thay đổi chưa render”, “Không thể lưu trong trình duyệt”
- Lỗi có hướng xử lý: “Trình duyệt không cho phép lưu cục bộ. Bạn vẫn có thể render, nhưng nội dung sẽ mất khi tải lại trang.”

## 4. Responsive Strategy

### 4.1 Breakpoints

| Bucket | Range | Anchor |
|---|---|---|
| Mobile | 320–639 px | 360 px |
| Tablet | 640–1023 px | 768 px |
| PC hẹp | 1024–1279 px | 1024 px |
| PC rộng | 1280 px+ | 1440 px |
| Ultra-wide | 1920 px+ | editor + preview, không kéo text vô hạn |

### 4.2 Per-Bucket Layout

#### Mobile

- Một cột: editor trước, preview sau; padding 16 px, gap 16 px.
- Editor không sticky toàn màn hình; thanh hành động có thể sticky đáy nhưng không che textarea và tôn trọng safe-area.
- Ba textarea xếp dọc, nút full-width, cao tối thiểu 48 px.
- Preview scale vừa chiều rộng; cho phép cuộn trang, không bắt người dùng kéo ngang.

#### Tablet

- Bố cục xếp dọc; editor là panel mở đầy đủ phía trên preview.
- Từ 768 px, hai nút Render/Khôi phục có thể nằm cùng hàng; textarea vẫn một cột để đọc văn bản dài.
- Preview giữ đúng tỷ lệ 16:9 và scale theo container.

#### PC

- Từ 1280 px: `.editor-shell` hai cột `360px minmax(0, 1fr)`, gap 20–24 px.
- Editor sticky ở `top: 16px`, chiều cao tối đa `calc(100vh - 32px)`, phần form cuộn độc lập; toolbar/preview ở cột phải.
- Từ 1024–1279 px: editor 320 px + preview; nếu preview quá nhỏ, chuyển xếp dọc bằng container query/media query thay vì ép nội dung.
- Preview được scale theo vùng còn lại; `#bulletin-canvas` vẫn là phần tử logic 1920×1080 để xuất.

### 4.3 Adaptive vs. Responsive

Responsive mặc định, cùng DOM ở mọi kích thước. Dùng container query cho nhóm nút editor nếu phù hợp; không tạo nhánh component mobile riêng. Không có navigation vì đây là màn hình công cụ đơn nhiệm.

## 5. Platform Patterns

### 5.1 Web

- Một URL hiện có; bản nháp giữ theo `asOfDate`, không đưa nội dung nhận định vào URL.
- Tôn trọng Back, Refresh, Ctrl/Cmd+F và scrollbar trình duyệt.
- Form dùng `<form>`, `<label>`, `<textarea>`, `<button>` native.
- `Ctrl/Cmd+Enter` kích hoạt Render; không chiếm shortcut trình duyệt chuẩn.
- Nhiều tab cùng chỉnh một ngày: phiên bản đầu không đồng bộ thời gian thực; lần ghi gần nhất trong từng tab thắng sau reload. Có thể bổ sung `storage` event ở pha sau.
- Khôi phục dùng hộp thoại xác nhận native hoặc `<dialog>` có focus trap; Escape đóng và trả focus về nút kích hoạt.

### 5.2 Desktop (if D-shell or D-native)

Không áp dụng — đây là web chạy trong trình duyệt.

### 5.3 Mobile (if M-* class)

Không có ứng dụng native. Mobile web giữ form đơn cột, vùng chạm 44–48 px và không phụ thuộc hover.

## 6. Information Architecture & Flows

### 6.1 Site Map / Screen Map

```text
Trang bản tin
├─ Editor nhận định (ngoài vùng xuất ảnh)
│  ├─ Trạng thái dữ liệu/ngày bản tin
│  ├─ Kết luận
│  ├─ Hành động
│  ├─ Nhận định thị trường
│  └─ Render / Khôi phục / trạng thái tự lưu
└─ Workspace xem trước
   ├─ Toolbar cập nhật + Xuất PNG
   └─ #bulletin-canvas 1920×1080
```

### 6.2 Primary User Flows

```text
Flow chính: Soạn và xuất bản tin
[Mở trang] → [Tải snapshot] → [Xác định asOfDate]
→ [Nạp draft ngày hiện tại hoặc narrative nguồn]
→ [Nhập 3 trường] → [Tự lưu draft]
→ [Render bản tin] → [Kiểm tra preview] → [Xuất PNG]
```

```text
Nhánh A: Không dùng được Local Storage
[Nhập nội dung] → [Lưu thất bại]
→ [Cảnh báo inline + aria-live] → [Vẫn cho Render trong phiên]
```

```text
Nhánh B: Ngày dữ liệu thay đổi khi trang đang mở
[Refresh API trả asOfDate mới] → [Không mang draft cũ sang]
→ [Nạp draft ngày mới nếu có, nếu không dùng nội dung nguồn]
→ [Thông báo “Đã chuyển sang bản tin ngày …”]
```

```text
Nhánh C: Khôi phục nội dung gốc
[Nhấn Khôi phục] → [Xác nhận]
→ [Xóa key ngày hiện tại] → [Form + preview dùng narrative nguồn/fallback]
→ [Thông báo thành công]
```

## 7. Components

### 7.1 NarrativeEditorPanel

- **Purpose**: Gom ba trường định tính, trạng thái ngày và các hành động biên tập.
- **Anatomy**: header, badge ngày, mô tả lưu cục bộ, form, status region, action bar.
- **Variants**: ready, waiting-for-data, storage-unavailable.
- **Sizes**: 360 px PC; full-width Tablet/Mobile.
- **States**: default; hover N/A cho container; focus-within viền cyan; active N/A; disabled khi chưa có snapshot; loading skeleton; error banner; success status.
- **Tokens used**: `color.bg.surface`, `color.border.default`, `space.*`, `radius.lg`, `shadow.sm`.
- **Responsive rules**: sticky + scroll độc lập trên PC rộng; xếp trước preview ở Tablet/Mobile.
- **A11y**: `<aside aria-labelledby="narrative-editor-title">`; heading tuần tự; trạng thái dùng `role="status"`.
- **Vietnamese notes**: tiêu đề “Nội dung nhận định” không rút gọn.
- **Acceptance criteria**: editor luôn nằm ngoài `#bulletin-canvas`; ngày bản tin hiển thị rõ; không che toolbar hoặc preview.

### 7.2 NarrativeTextarea

- **Purpose**: Nhập một trong ba đoạn văn bản định tính.
- **Anatomy**: label, textarea, bộ đếm tùy chọn, help/error text.
- **Variants**: conclusion, action, footer (khác nhãn, cùng style).
- **Sizes**: min-height 132/116/148 px trên PC; mobile tối thiểu 120 px và có thể kéo dọc.
- **States**: default; hover viền đậm hơn; focus-visible ring cyan; active có caret; disabled khi chưa có ngày; loading readonly skeleton; error viền đỏ + mô tả; success viền xanh ngắn hạn + status text.
- **Tokens used**: `color.bg.input`, `color.text.primary`, `color.border.*`, `color.feedback.*`, `radius.md`.
- **Responsive rules**: full-width ở mọi bucket; font tối thiểu 16 px trên mobile để tránh iOS zoom.
- **A11y**: `<label for>` thật; `aria-describedby` cho help/error; không dùng placeholder làm nhãn; spellcheck bật.
- **Vietnamese notes**: line-height 1.6, tracking 0, không clip dấu.
- **Acceptance criteria**: giữ newline; tự lưu sau mỗi thay đổi có debounce ngắn; lỗi lưu không làm mất nội dung đang nhập.

### 7.3 EditorActionBar / Button

- **Purpose**: Render nội dung, khôi phục nguồn và xuất PNG.
- **Anatomy**: primary button, secondary button; export tiếp tục nằm ở toolbar preview.
- **Variants**: primary (Render), secondary (Khôi phục), export.
- **Sizes**: `md` 44 px PC; `lg` 48 px Mobile.
- **States**: default; hover đổi nền; focus-visible ring 3 px; active scale 0.98 trong 80 ms; disabled giảm opacity + không tương tác; loading spinner + `aria-busy`; error giữ nhãn và phát thông báo; success có status text, không chỉ đổi màu.
- **Tokens used**: `color.action.*`, `color.border.focus`, `duration.fast`, `radius.md`.
- **Responsive rules**: cùng hàng khi đủ 520 px; xếp dọc full-width ở mobile.
- **A11y**: `<button type="button">`; Enter/Space; Ctrl/Cmd+Enter cho Render; thứ tự Tab theo hình ảnh.
- **Vietnamese notes**: “Khôi phục nội dung gốc” phải vừa không ellipsis ở 320 px.
- **Acceptance criteria**: Render disabled khi chưa có snapshot; Export disabled khi chưa có snapshot/đang xuất; không click lặp khi loading.

### 7.4 SaveAndRenderStatus

- **Purpose**: Phân biệt “đã lưu nháp” với “đã render lên preview”.
- **Anatomy**: icon SVG, nhãn trạng thái, thời gian lưu nếu có.
- **Variants**: saved, unsaved, unrendered, storage-error, rendered.
- **Sizes**: caption 12–14 px; cao tối thiểu 24 px để không gây layout shift.
- **States**: default/no-change; hover N/A; focus N/A; active N/A; disabled/waiting; loading “Đang lưu…”; error icon + text đỏ; success icon + text xanh.
- **Tokens used**: `color.text.secondary`, `color.feedback.*`.
- **Responsive rules**: wrap tối đa hai dòng; không che nút.
- **A11y**: một vùng `role="status" aria-live="polite" aria-atomic="true"`; lỗi storage dùng `role="alert"` khi xuất hiện lần đầu.
- **Vietnamese notes**: dùng “Đã tự lưu”, không dùng từ kỹ thuật “persist”.
- **Acceptance criteria**: gõ chưa Render phải hiện “Có thay đổi chưa render”; lưu nháp không tự thay preview.

### 7.5 PreviewViewport

- **Purpose**: Hiển thị canvas hiện tại có thể scale mà vẫn xuất đúng 1920×1080.
- **Anatomy**: toolbar, viewport, `#bulletin-canvas`, status phía dưới.
- **Variants**: loading, loaded, empty, API-error, exporting, export-success/error.
- **Sizes**: fluid; canvas logic cố định 1920×1080.
- **States**: default loaded; hover N/A; focus trên toolbar; active khi xuất; disabled export khi thiếu snapshot; loading skeleton/message; error có “Thử lại”; success thông báo xuất.
- **Tokens used**: token hiện hữu của bulletin và toolbar.
- **Responsive rules**: scale theo container; mobile không cuộn ngang; vùng editor/toolbar không nằm trong canvas.
- **A11y**: `<section aria-labelledby>`; trạng thái API và export dùng live region; canvas có heading/nội dung semantic hiện hữu.
- **Vietnamese notes**: giữ toàn bộ nhãn hiện tại.
- **Acceptance criteria**: PNG đúng 1920×1080; preview phản ánh `renderedNarrative`, không phản ánh draft chưa Render.

### 7.6 ResetConfirmationDialog

- **Purpose**: Tránh xóa nhầm bản nháp ngày hiện tại.
- **Anatomy**: title, mô tả ngày bị xóa, Huỷ, Khôi phục.
- **Variants**: confirm reset.
- **Sizes**: tối đa 440 px PC; full-width có margin 16 px Mobile.
- **States**: default; hover/focus/active cho nút; disabled/loading trong lúc reset; error giữ dialog mở; success đóng + status.
- **Tokens used**: surface, border, focus, danger/warning, shadow.
- **Responsive rules**: dialog giữa màn hình; mobile không vượt safe-area.
- **A11y**: ưu tiên `<dialog>`; focus trap, Escape đóng, trả focus về trigger, `aria-labelledby`/`aria-describedby`.
- **Vietnamese notes**: mô tả rõ chỉ xóa bản nháp cục bộ, không xóa dữ liệu Google Sheets.
- **Acceptance criteria**: Huỷ không đổi dữ liệu; xác nhận xóa đúng key `asOfDate` và trả cả form/preview về nguồn.

## 8. Interaction & Motion

### 8.1 Motion Tokens Used

- `duration.instant` 50 ms: phản hồi pressed tức thời
- `duration.fast` 150 ms: hover, focus ring, màu viền
- `duration.medium` 250 ms: dialog/toast xuất hiện
- Không cần page transition 400 ms cho màn hình đơn nhiệm

### 8.2 Micro-Interactions

- Gõ: cập nhật draft tức thì; debounce ghi Local Storage khoảng 250–400 ms; status chuyển “Đang lưu…” → “Đã tự lưu”.
- Render: nút loading ngắn, sau đó preview đổi trong một cross-fade 150 ms và status “Đã render”.
- Draft khác preview: hiển thị nhãn cảnh báo kèm icon, không chỉ dùng màu amber.
- Export: nút “Đang xuất…” và khóa click lặp; thành công/lỗi phát qua live region.
- Dialog: backdrop fade 200 ms, panel opacity/scale 250 ms; exit 150–200 ms.

### 8.3 Reduced-Motion Strategy

- `prefers-reduced-motion: reduce` chuyển mọi transition về gần như tức thời.
- Không shimmer liên tục; skeleton có fallback tĩnh.
- Không animate width/height/top/left; chỉ opacity/transform.

## 9. Accessibility (WCAG 2.1 AA)

### 9.1 Contrast Audit

| Pair | Ratio | Kết quả |
|---|---:|---|
| `text.primary` / `bg.canvas` | 18.36:1 | AAA |
| `text.secondary` / `bg.canvas` | 13.04:1 | AAA |
| `text.primary` / `bg.surface` | 16.90:1 | AAA |
| `text.secondary` / `bg.surface` | 12.00:1 | AAA |
| White / primary button `#1452A4` | 7.57:1 | AAA |
| Focus cyan / page | 12.75:1 | Pass non-text |
| Error red / page | 6.76:1 | AA |

### 9.2 Keyboard Map

- Tab / Shift+Tab: ba textarea → Render → Khôi phục → Xuất PNG
- Enter / Space: kích hoạt nút
- Ctrl/Cmd+Enter: Render từ bất kỳ textarea nào
- Escape: đóng xác nhận khôi phục
- Không dùng `tabindex` lớn hơn 0; không ghi đè Ctrl/Cmd+F, L, R

### 9.3 Semantic & ARIA Decisions

- Trang có `<main>`; editor là `<aside>`; preview là `<section>`.
- Form dùng `<form>`, ba `<label>` và `<textarea>` native.
- Button dùng `<button>` native, spinner trang trí có `aria-hidden`.
- Dialog reset dùng `<dialog>` hoặc fallback có focus trap.
- Heading không bỏ cấp; editor có heading riêng nhưng chỉ một `h1` trên trang.

### 9.4 Live Regions

- Lưu/render/export thành công: `role="status" aria-live="polite"`.
- Lỗi API, storage hoặc export: `role="alert"`; thông điệp cụ thể và có hành động thử lại nếu phù hợp.
- Tránh hai vùng live đọc lặp cùng một thông báo.

### 9.5 Language

- `<html lang="vi">` giữ nguyên.
- Từ kỹ thuật như Local Storage không cần hiển thị cho người dùng; dùng “lưu trong trình duyệt”.

### 9.6 Notes

Đặc tả nhắm WCAG 2.1 AA, nhưng xác nhận tuân thủ đầy đủ vẫn cần kiểm thử thủ công bằng NVDA, bàn phím và audit trình duyệt sau khi triển khai.

## 10. Implementation

### 10.1 Files Created / Modified

- `docs/ui-design/system_design.md` — tài liệu thiết kế chuẩn, cập nhật cho editor trực tiếp.

Khi được phê duyệt và chuyển sang implementation, khu vực dự kiến gồm:

- `components/bulletin-dashboard.tsx` — quản lý source/draft/rendered narrative và export.
- `components/narrative-editor.tsx` — editor mới.
- `app/globals.css` — token semantic, shell hai cột và responsive.
- Test tương ứng cho Local Storage theo ngày, Render, Reset và ranh giới PNG.

### 10.2 Files Out of Scope (Touched-Up Only)

Không có trong pha thiết kế.

### 10.3 Backend / Business Logic

Không sửa API, Google Sheets, quy tắc lọc hoặc dữ liệu định lượng. Local Storage là trạng thái client của editor.

### 10.4 Open Implementation Questions

Không có câu hỏi sản phẩm trọng yếu. Chi tiết debounce và tên component có thể điều chỉnh theo test/kiến trúc hiện hữu mà không đổi trải nghiệm đã phê duyệt.

## 11. Acceptance Criteria

- [ ] Ở ≥1280 px, editor nằm bên trái và preview bên phải; ở 320–1023 px hai vùng xếp dọc, không tràn ngang.
- [ ] Ba trường có label rõ, nhập tiếng Việt không clip dấu, giữ newline và font mobile tối thiểu 16 px.
- [ ] Draft tự lưu theo key dạng `cnf-daily-narrative:${asOfDate}` và không dùng lại cho ngày khác.
- [ ] Nếu storage lỗi, nội dung vẫn render trong phiên và người dùng thấy cảnh báo cụ thể.
- [ ] Gõ chỉ thay draft; preview chỉ đổi sau Render.
- [ ] Khôi phục có xác nhận, xóa đúng draft ngày hiện tại và dùng narrative nguồn/fallback.
- [ ] Editor, dialog và toolbar nằm ngoài `#bulletin-canvas`; PNG luôn đúng 1920×1080.
- [ ] Data API tiếp tục refresh theo cấu hình hiện có; ngày mới không kế thừa draft ngày cũ.
- [ ] Tất cả interactive elements dùng được bằng bàn phím, focus-visible ≥3:1 và touch target ≥44×44 px.
- [ ] Có đủ waiting/loading/empty/error/success cho dữ liệu, lưu, render và export.
- [ ] `prefers-reduced-motion` được tôn trọng; không animation layout.
- [ ] Kiểm tra tại 320, 360, 414, 768, 1024, 1280, 1440 và 1920 px.
- [ ] Không thêm dependency UI và không thay đổi API/backend/filter.

## 12. Statement of Limitations

- Đây là đặc tả thiết kế tĩnh; chưa có mã UI mới được triển khai trong pha này.
- Tương phản token đã được tính toán, nhưng pixel-perfect và hành vi responsive cần kiểm tra trên bản chạy thật.
- WCAG 2.1 AA đầy đủ cần kiểm thử thủ công bằng bàn phím, NVDA và chuyên gia accessibility.
- Hiệu năng xuất PNG, INP, CLS và tốc độ Local Storage cần đo sau implementation trên thiết bị thực.
- Bản nháp chỉ tồn tại trong trình duyệt hiện tại; có thể mất khi người dùng xóa dữ liệu website và không đồng bộ thiết bị.
- Không có nội dung dự án nào được gửi tới dịch vụ bên thứ ba trong quá trình thiết kế.

---

## 13. Thích nghi giao diện — CNF Green Vector Artwork

### 13.1 Brief, phạm vi và tín hiệu thành công

Phần minh họa trang trí của canvas bản tin được thiết kế lại bằng SVG code-native chi tiết, sắc nét khi xuất PNG 1920×1080 và đồng nhất với nhận diện xanh lá CNF. Phạm vi gồm minh họa thị trường đầu trang, minh họa tài chính cuối trang, biểu tượng loa và biểu tượng riêng cho 22 ngành. Bố cục canvas, dữ liệu, bộ lọc, Google Sheets, trình biên tập và luồng xuất PNG giữ nguyên.

Tín hiệu thành công:

- Các mảng xanh dương đậm được đánh dấu trong hình tham chiếu không còn xuất hiện trong minh họa mới.
- Header có địa cầu nhiều lớp, lưới dữ liệu, nến có thân/bóng, đường xu hướng có điểm nút và mũi tên tăng trưởng.
- Footer có biểu đồ cột nhiều lớp, biểu tượng ngân hàng chi tiết và mạng dữ liệu.
- 22 ngành có 22 biểu tượng có ngữ nghĩa riêng; ngành chưa biết dùng biểu tượng dự phòng nhất quán.
- Ảnh xuất giữ nguyên 1920×1080, không vỡ nét, không tràn panel và không che chữ.

### 13.2 Nền tảng và ràng buộc

- Platform class: Web, Next.js 16 + React 19 + TypeScript + CSS custom properties.
- Design anchor: canvas cố định 1920×1080; preview responsive chỉ scale toàn bộ canvas, không thay đổi cấu trúc SVG theo breakpoint.
- Dark-only là chủ đích thương hiệu; light theme không thuộc phạm vi.
- Không thêm thư viện icon, thư viện chart, ảnh raster hoặc tài nguyên mạng.
- SVG phải tương thích với `html-to-image`; tránh `foreignObject`, ảnh ngoài miền và hiệu ứng phụ thuộc animation runtime.
- Minh họa là trang trí: `aria-hidden="true"` và `focusable="false"`; dữ liệu và tên ngành bằng chữ vẫn là nguồn thông tin tiếp cận.

### 13.3 Design tokens

#### 13.3.1 Primitive màu

| Primitive | Giá trị | Vai trò |
|---|---:|---|
| `green.300` | `#39FF70` | Điểm sáng, đường chính, mũi tên |
| `green.500` | `#16C85D` | Thân nến, icon chính, biểu đồ cột |
| `teal.400` | `#00CFA6` | Đường phụ, điểm nút, lớp chuyển sắc |
| `green.900` | `#064E2B` | Độ sâu gradient; không dùng đơn lẻ cho glyph quan trọng |
| `cyan.400` | `#00E6E8` | Chỉ giữ cho viền panel và đường phân cách hiện hữu |
| `navy.900` | `#00101D` | Nền canvas |
| `navy.850` | `#001725` | Nền panel |

#### 13.3.2 Semantic aliases

| Semantic token | Primitive | Cách dùng |
|---|---|---|
| `color.art.primary` | `green.500` | Hình khối và icon chính |
| `color.art.highlight` | `green.300` | Nét phát sáng và điểm nhấn |
| `color.art.secondary` | `teal.400` | Đường dữ liệu phụ và node |
| `color.art.depth` | `green.900` | Điểm cuối gradient, luôn ghép với primary/highlight |
| `color.art.grid` | `teal.400` với opacity thấp | Lưới nền trang trí |
| `color.art.glow` | `green.300` với opacity trung bình | `drop-shadow`/SVG glow |
| `color.border.structural` | `cyan.400` | Viền panel, không đổi sang xanh lá |

CSS export dự kiến mở rộng `:root` trong `app/globals.css`; component SVG chỉ tham chiếu semantic token bằng `var(...)`, không chứa màu hex rải rác.

#### 13.3.3 Contrast audit

| Màu / nền | `#000B14` | `#00101D` | `#001725` | Kết quả |
|---|---:|---:|---:|---|
| `#16C85D` | 8.94:1 | 8.66:1 | 8.23:1 | AAA cho chữ; đạt non-text |
| `#39FF70` | 14.85:1 | 14.39:1 | 13.67:1 | AAA cho chữ; đạt non-text |
| `#00CFA6` | 9.90:1 | 9.59:1 | 9.12:1 | AAA cho chữ; đạt non-text |
| `#064E2B` | 2.02:1 | 1.95:1 | 1.86:1 | Chỉ dùng tạo chiều sâu trang trí |
| `#00E6E8` | 12.75:1 | 12.35:1 | 11.73:1 | Đạt non-text cho viền cấu trúc |

#### 13.3.4 Stroke, icon, glow và density

| Nhóm | Tokens |
|---|---|
| Stroke | `art.stroke.hairline=1`, `art.stroke.default=1.5`, `art.stroke.emphasis=2.5` |
| Sector icon | `art.icon.sector=22`, `viewBox=24`, stroke mặc định `1.6` |
| Speaker | `art.icon.speaker=82×68`, stroke nhấn `2.5` |
| Glow | `art.glow.soft=6`, `art.glow.medium=10`, `art.glow.strong=16` |
| Opacity | `art.opacity.grid=.12`, `secondary=.48`, `primary=.82`, `solid=1` |
| Radius | Node `radius.full`; nến và cột dùng `radius.sm` tối đa |

Các giá trị trên được khai báo thành CSS custom properties. Không thêm motion token cho artwork vì minh họa tĩnh là yêu cầu để xuất PNG ổn định.

### 13.4 Cấu trúc minh họa

#### 13.4.1 `HeaderMarketArtwork`

- Giữ nguyên hộp layout hiện tại: vùng header cao 175 px, không thay đổi `brand-wrap` hoặc kích thước logo.
- Địa cầu: viewBox vuông 180; gồm halo ngoài, 3 vòng tròn đồng tâm, kinh/vĩ tuyến, bản đồ hai lớp, điểm dữ liệu nhỏ và gradient xuyên tâm.
- Biểu đồ thị trường: viewBox 980×170; nền có lưới ngang/dọc opacity thấp; 30–34 nến với wick và body riêng; hai sắc `art.primary`/`art.secondary` phân biệt nhịp nhưng không biểu diễn trạng thái nghiệp vụ.
- Đường xu hướng: nét `art.highlight`, 8–12 node tròn, glow trung bình; đoạn cuối kết thúc bằng marker mũi tên SVG.
- Đường tham chiếu phụ: `art.secondary`, opacity thấp, không tranh chấp thị giác với đường chính.
- Nhãn `23.18`, `21.04`, `27.53`: dùng highlight/secondary; vị trí không đè lên nến, cỡ chữ giữ khả năng đọc sau khi preview scale.
- Mọi `defs` (`linearGradient`, `radialGradient`, `filter`, `marker`) có ID có tiền tố `cnf-header-` để tránh xung đột trong DOM.

#### 13.4.2 `FooterFinancialArtwork`

- Giữ trong cột footer hiện tại; viewBox đề xuất 390×110, render không vượt 390×110.
- Trái: 8–12 cột với hai lớp opacity và đường baseline mờ.
- Giữa: biểu tượng ngân hàng gồm mái tam giác, viền mái kép, 4 cột, thân, bậc thềm và halo nền.
- Phải: mạng dữ liệu có 7–9 node, đường nối mảnh và một đường tăng trưởng nổi bật.
- Dùng một ngôn ngữ stroke duy nhất; không trộn icon fill đặc với icon outline nếu không có lớp chiều sâu chủ đích.
- ID trong `defs` dùng tiền tố `cnf-footer-`.

#### 13.4.3 `SpeakerArtwork`

- ViewBox 96×72; gồm vành loa, thân loa, tay cầm, ba cung sóng âm và ba tia nhấn.
- Stroke `art.highlight`, fill `art.depth` với opacity; glow mạnh chỉ áp dụng cho nét ngoài.
- Thay hoàn toàn ký tự văn bản `◖)))`; không làm thay đổi nhãn “NHẬN ĐỊNH THỊ TRƯỜNG”.

#### 13.4.4 `SectorIcon`

- API thiết kế: nhận `sectorName: string`; trả SVG `viewBox="0 0 24 24"`, `aria-hidden="true"`, `focusable="false"`.
- Visual language: outline, linecap/linejoin tròn, stroke 1.6, tối đa hai lớp opacity, không fill đặc toàn bộ.
- Ánh xạ biểu tượng:

| Ngành | Biểu tượng |
|---|---|
| Khoáng sản | Đá quý và cuốc |
| Dầu khí | Giàn khoan/tháp dầu |
| Cao su | Cây và giọt nhựa |
| Bán lẻ | Túi mua sắm |
| Thực phẩm - Đồ uống | Ly và lá |
| Bảo hiểm | Khiên bảo vệ |
| Vận tải - Cảng biển | Tàu và sóng |
| Y tế - Dược phẩm | Chữ thập y tế |
| Nhựa | Giọt/polymer |
| Hàng không | Máy bay |
| Vật liệu xây dựng | Gạch xếp |
| Hóa chất - Phân bón | Bình thí nghiệm |
| BĐS Khu công nghiệp | Nhà máy |
| Ngân hàng | Tòa nhà ngân hàng |
| Công nghệ | Vi mạch |
| Đầu tư công | Cầu/công trình |
| Điện - Năng lượng | Tia sét |
| Thép | Dầm chữ I |
| Bất động sản | Cụm tòa nhà |
| Thủy sản | Cá và sóng |
| Dệt may | Cuộn chỉ |
| Chứng khoán | Biểu đồ tăng trưởng |

- Chuẩn hóa tên trước khi ánh xạ: bỏ dấu, viết thường, chuẩn hóa khoảng trắng và dấu gạch. Tên không khớp dùng biểu tượng biểu đồ chung; không làm mất tên ngành.

### 13.5 Component states

Các artwork không tương tác nên hover, focus-visible, active và disabled là N/A. Trạng thái được quy định như sau:

| Component | Default | Loading | Empty | Error | Success |
|---|---|---|---|---|---|
| Header artwork | Hiển thị đầy đủ, tĩnh | Giữ artwork tĩnh | Giữ artwork tĩnh | Giữ artwork tĩnh | Giữ artwork tĩnh |
| Footer artwork | Hiển thị đầy đủ, tĩnh | Giữ artwork tĩnh | Giữ artwork tĩnh | Giữ artwork tĩnh | Giữ artwork tĩnh |
| Speaker artwork | Hiển thị outline + glow | Không đổi | Không đổi | Không đổi | Không đổi |
| Sector icon | Icon theo tên ngành | Không render vì chưa có hàng | Không có hàng | Fallback icon nếu tên lạ | Icon đúng ánh xạ |

Artwork không được dùng để biểu đạt trạng thái tải/lỗi/thành công của dữ liệu. Các thông báo chữ hiện có tiếp tục đảm nhiệm vai trò đó, tránh phụ thuộc màu sắc.

### 13.6 Responsive và xuất ảnh

- Canvas luôn 1920×1080; tất cả artwork được đo trên hệ tọa độ này.
- PC/Tablet/Mobile dùng cùng một SVG và scale theo `PreviewViewport`; không tạo phiên bản mobile riêng, tránh khác biệt giữa preview và PNG.
- Nét nhỏ nhất sau scale không phải nguồn thông tin duy nhất; tên ngành vẫn bằng chữ.
- Không để glow vượt quá clip vùng header/footer hoặc làm tăng kích thước DOM chụp.
- Không dùng CSS animation, transform động hoặc filter có phụ thuộc thời gian khi xuất.
- Kiểm tra trực quan tại preview 320, 768, 1280 và 1920 px; kiểm tra pixel thực ở PNG 1920×1080.

### 13.7 Accessibility và tiếng Việt

- SVG trang trí: `aria-hidden="true"`, `focusable="false"`; không thêm vào thứ tự Tab.
- `SectorIcon` không có nhãn riêng vì văn bản tên ngành nằm ngay cạnh và cung cấp ý nghĩa đầy đủ.
- Không thay đổi heading, landmark, live region hoặc keyboard map hiện tại.
- Các token primary/highlight/secondary đều vượt 3:1 trên nền; `art.depth` chỉ dùng trong gradient/trang trí.
- Typography và locale `vi-VN` giữ theo hệ thống hiện có; artwork không chứa nội dung tiếng Việt ngoài ba nhãn số thị trường.

### 13.8 Hướng triển khai

| File | Thay đổi dự kiến |
|---|---|
| `components/bulletin-artwork.tsx` | Tạo `HeaderMarketArtwork`, `FooterFinancialArtwork`, `SpeakerArtwork` |
| `components/sector-icon.tsx` | Tạo ánh xạ và SVG cho 22 ngành + fallback |
| `components/bulletin-canvas.tsx` | Loại artwork đơn giản nội tuyến, lắp component mới |
| `components/sector-ranking.tsx` | Thay ký tự quân cờ bằng `SectorIcon` |
| `app/globals.css` | Khai báo semantic art tokens và kích thước/glow |
| `tests/bulletin-artwork.test.tsx` | Kiểm tra cấu trúc SVG, semantics và ánh xạ biểu tượng |

Không thay đổi `package.json`, API, config lọc hoặc các module dữ liệu.

### 13.9 Acceptance criteria

- [ ] Header có địa cầu nhiều lớp, ít nhất 24 nến có body + wick, lưới nền, đường xu hướng có node và marker mũi tên.
- [ ] Footer có biểu đồ cột nhiều lớp, ngân hàng có mái/cột/bậc và mạng dữ liệu có node/đường nối.
- [ ] Loa là SVG hoàn chỉnh; ký tự `◖)))` không còn trong canvas.
- [ ] 22 tên ngành hiện tại ánh xạ tới 22 biểu tượng riêng; tên lạ render fallback an toàn.
- [ ] SVG trang trí có `aria-hidden="true"` và `focusable="false"`; không tạo focus target.
- [ ] Màu artwork chỉ tham chiếu token; xanh dương đậm cũ `#1E68FF` và `#0D59FF` không còn trong artwork.
- [ ] Cyan chỉ tiếp tục dùng cho viền/đường phân cách theo thiết kế đã duyệt.
- [ ] Không thay đổi kích thước canvas, layout dữ liệu hoặc nội dung chữ.
- [ ] Preview không tràn ở 320/768/1280/1920 px; PNG xuất đúng 1920×1080 và artwork sắc nét.
- [ ] Không thêm dependency hoặc request tài nguyên ngoài.
- [ ] Build, lint và toàn bộ test pass; test SVG mới pass.
- [ ] Kiểm tra trực quan bằng Cốc Cốc xác nhận artwork không che logo, tiêu đề, bảng dữ liệu hoặc nhận định.

### 13.10 QA thiết kế

| Hạng mục | Kết quả | Ghi chú |
|---|---|---|
| Brief và phạm vi | PASS | Đã được người dùng phê duyệt qua brainstorm |
| Token hai tầng | PASS | Primitive + semantic alias đã xác định |
| Contrast | PASS | Ba màu glyph chính đều vượt 8:1 trên các nền |
| Dark/light parity | N/A | Dark-only là chủ đích và được ghi rõ |
| Responsive | PASS | Cùng canvas cố định, preview scale đồng nhất |
| Vietnamese | PASS | Không thay đổi typography/locale; tên ngành vẫn là chữ |
| Components | PASS | Anatomy, variants/states và fallback đã quy định |
| Motion | PASS | Artwork tĩnh; không thêm animation |
| Accessibility | PASS theo đặc tả | Cần kiểm tra DOM và hình ảnh thực sau triển khai |
| External assets/dependencies | PASS | Không sử dụng |
| Backend/business logic | PASS | Ngoài phạm vi, không thay đổi |

### 13.11 Giới hạn

- Đây là thiết kế tĩnh và thông số triển khai; độ cân bằng glow, mật độ nến và độ rõ của icon cần được kiểm tra trên bản chạy thật.
- Tương thích `html-to-image` và độ sắc nét PNG cần xác nhận bằng ảnh xuất thực tế.
- WCAG đầy đủ vẫn cần kiểm tra thủ công bằng trình duyệt và công nghệ hỗ trợ; đặc tả không thay thế kiểm thử thực tế.

---

## 14. Bổ sung giao diện — Bảng cổ phiếu xuất hiện điểm mua cho phiên tới

- **Cập nhật thiết kế**: 2026-08-11 17:15 (Asia/Saigon)
- **Đầu vào đặc tả**: `docs/spec/spec_add_feature_next-session-buy-table_20260811.md`
- **Phân loại bề mặt**: Web (W), bổ sung component và thay thế một vùng hiển thị trong canvas
- **Đối tượng chính**: Người vận hành bản tin CNF trên PC; Tablet/Mobile dùng để nhập nhanh và kiểm tra
- **Ngôn ngữ**: Tiếng Việt đơn ngữ (`vi-VN`)
- **Đầu ra pha này**: Chỉ đặc tả UI/UX; không sửa production code, API hoặc business rule

### 14.1 Brief, mục tiêu và phạm vi

Thay `FooterFinancialArtwork` ở góc phải dưới bản tin bằng bảng thủ công có tiêu đề **“CỔ PHIẾU XUẤT HIỆN ĐIỂM MUA CHO PHIÊN TỚI”**. Người vận hành nhập danh sách bằng các dòng động tương tự mục “Nhóm ngành” của web BCCL: mỗi dòng có Mã cổ phiếu, Vùng mua và nút Xóa; nút Thêm dòng tạo mục mới; danh sách tối đa 4 mục.

Tín hiệu thành công:

- Người mới có thể thêm một mã, nhập vùng mua và Render trong dưới 30 giây.
- Không cần ghi nhớ cú pháp phân cách văn bản.
- Không thể Render một dòng thiếu dữ liệu hoặc danh sách có mã trùng.
- Bảng đọc rõ ở PNG 1920×1080 và không làm thay đổi chiều cao footer 140 px.
- Bản nháp cũ không có danh sách điểm mua vẫn nạp được và được hiểu là danh sách rỗng.

Trong phạm vi:

- Danh sách dòng động trong editor, tối đa 4 dòng.
- Bảng hai cột trong footer canvas, tối đa 4 dòng.
- Trạng thái rỗng, chờ dữ liệu, lỗi nhập, đã lưu và đã Render.
- Tự lưu cục bộ theo ngày, Render có chủ đích và khôi phục cùng nội dung nhận định.
- Responsive PC/Tablet/Mobile và khả năng xuất PNG.

Ngoài phạm vi:

- Tự động tìm điểm mua, đọc/ghi Google Sheets hoặc thay đổi bộ lọc cổ phiếu.
- Định dạng giá theo một đơn vị bắt buộc; Vùng mua là chuỗi tự do như `145–150`.
- Kéo thả sắp xếp, nhập hàng loạt, hiển thị quá 4 mã hoặc đồng bộ nhiều thiết bị.
- Thay đổi artwork header, biểu tượng loa, bảng ngành hoặc các panel dữ liệu khác.

### 14.2 Kiến trúc thông tin và luồng sử dụng

```text
Trang bản tin
├─ Editor nhận định
│  ├─ Kết luận
│  ├─ Hành động
│  ├─ Nhận định thị trường
│  ├─ Cổ phiếu xuất hiện điểm mua cho phiên tới
│  │  ├─ Trạng thái rỗng
│  │  ├─ 0–4 dòng: Mã cổ phiếu | Vùng mua | Xóa
│  │  └─ Thêm dòng
│  └─ Trạng thái lưu / Render / Khôi phục
└─ Canvas 1920×1080
   └─ Footer
      ├─ Nhãn Nhận định thị trường
      ├─ Nội dung nhận định
      └─ Bảng điểm mua phiên tới
```

Luồng chính:

```text
[Mở trang] → [Nạp bản nháp theo ngày]
→ [Danh sách rỗng hoặc dữ liệu đã lưu]
→ [Thêm dòng] → [Focus vào Mã cổ phiếu]
→ [Nhập mã + vùng mua] → [Tự lưu bản nháp]
→ [Render bản tin] → [Kiểm tra bảng trên canvas] → [Xuất PNG]
```

Nhánh lỗi:

```text
[Render]
├─ Dòng thiếu một trường → đánh dấu hai trường liên quan → focus lỗi đầu tiên
├─ Mã trùng (không phân biệt hoa/thường) → báo “Mã cổ phiếu đã xuất hiện”
└─ Dữ liệu hợp lệ → cập nhật canvas + thông báo “Đã render nội dung lên bản tin”
```

Thêm/xóa:

```text
[0–3 dòng] → Thêm dòng → thêm cuối danh sách + focus trường Mã cổ phiếu
[4 dòng] → nút Thêm dòng disabled + dòng trợ giúp “Đã đủ tối đa 4 mã”
[Xóa] → bỏ đúng dòng → đánh lại thứ tự DOM → focus nút Xóa gần nhất hoặc Thêm dòng
```

### 14.3 Design tokens kế thừa và mở rộng

Không tạo palette hoặc hệ token mới. Component chỉ dùng semantic aliases ánh xạ tới primitives đã có trong mục 2 và 13.

| Semantic alias | Primitive/CSS hiện có | Vai trò |
|---|---|---|
| `color.buy.accent` | `--color-art-highlight` / `green.300` | Tiêu đề, điểm nhấn bảng |
| `color.buy.border` | `--color-art-primary` / `green.500` | Viền bảng và đường phân cách |
| `color.buy.secondary` | `--color-art-secondary` / `teal.400` | Chi tiết phụ, divider nhẹ |
| `color.buy.depth` | `--color-art-depth` / `green.900` | Nền header pha opacity, không dùng làm chữ |
| `color.buy.surface` | `--panel` / `navy.850` | Nền row editor và bảng canvas |
| `color.buy.input` | `--input` / `navy.800` | Nền input editor |
| `color.buy.text` | `--white` / `neutral.50` | Chữ chính |
| `color.buy.muted` | `--muted` / `neutral.300` | Trợ giúp/trạng thái rỗng |
| `color.buy.focus` | `--cyan` / `cyan.400` | Focus-visible, giữ nhất quán editor |
| `color.buy.error` | `--red` / `red.400` | Lỗi trường và mô tả lỗi |
| `color.buy.success` | `--green` / `green.400` | Trạng thái đã lưu/render |

Contrast kế thừa đã được audit:

| Pair | Tỷ lệ | Kết quả |
|---|---:|---|
| `neutral.50` trên `navy.850` | 16.90:1 | AAA |
| `neutral.300` trên `navy.850` | 12.00:1 | AAA |
| `green.300` trên `navy.850` | 13.67:1 | AAA |
| `green.500` trên `navy.850` | 8.23:1 | AAA / đạt non-text |
| `cyan.400` trên `navy.950` | 12.75:1 | Đạt focus non-text |
| `red.400` trên `navy.950` | 6.76:1 | AA |

Token kích thước:

| Nhóm | Token áp dụng |
|---|---|
| Editor gap/padding | `space.2=8`, `space.3=12`, `space.4=16` |
| Editor row | `radius.md`, `shadow.sm`, border semantic 1 px |
| Input/button | cao tối thiểu 44 px; `radius.md`; body 16 px / line 1.6 |
| Canvas title | display condensed 18 px / line 1.25 / 700 |
| Canvas column header | display condensed 14 px / line 1.25 / 700 |
| Canvas cell | display condensed 16 px / line 1.15 / 600–700 |
| Motion | `duration.fast=150 ms`, `duration.medium=250 ms`, easing standard |

Dark-only tiếp tục là chủ đích. Light theme không thuộc phạm vi và không được mô phỏng riêng cho component này.

### 14.4 Typography tiếng Việt

- Editor tiếp tục dùng `"Segoe UI", Arial, sans-serif`; canvas dùng stack condensed hiện tại.
- Trường nhập giữ font 16 px để tránh zoom tự động trên mobile và không làm clip dấu.
- Label body có line-height tối thiểu 1.55, tracking 0.
- Tiêu đề bảng canvas dùng chữ in hoa nhưng không giảm tracking dưới 0; tên dài phải vừa một dòng ở vùng nội dung tối thiểu 390 px.
- Không viết tắt nhãn editor: dùng đầy đủ “Mã cổ phiếu”, “Vùng mua”, “Thêm dòng”. Chỉ header canvas dùng `MÃ CP` do giới hạn hình ảnh và ngữ cảnh bảng đã rõ.
- Chuỗi xác nhận typography: `CỔ PHIẾU XUẤT HIỆN ĐIỂM MUA CHO PHIÊN TỚI — Mã cổ phiếu — Vùng mua — Đã đủ tối đa 4 mã.`

### 14.5 Layout editor

Editor thêm một `<fieldset>` sau trường “Nhận định thị trường” và trước vùng trạng thái lưu/render.

```text
┌────────────────────────────────────┐
│ CỔ PHIẾU XUẤT HIỆN ĐIỂM MUA...    │
│ Tối đa 4 mã                        │
│                                    │
│ Chưa có cổ phiếu nào.              │  ← khi rỗng
│                                    │
│ [          Thêm dòng             ] │
└────────────────────────────────────┘
```

Khi có dữ liệu:

```text
┌────────────────────────────────────┐
│ Mã cổ phiếu   Vùng mua       Xóa   │
│ [ FPT       ] [ 145–150    ] [Xóa] │
├────────────────────────────────────┤
│ Mã cổ phiếu   Vùng mua       Xóa   │
│ [ MBB       ] [ 24–25      ] [Xóa] │
├────────────────────────────────────┤
│ [          Thêm dòng             ] │
└────────────────────────────────────┘
```

- Panel editor 360 px: row dùng grid `minmax(0,.78fr) minmax(0,1.22fr) 44px`, gap 8 px.
- Container dưới 300 px: hai trường xếp dọc; nút Xóa full-width dưới hai trường.
- Nút Thêm dòng full-width, tối thiểu 44 px.
- Mỗi dòng có số thứ tự ẩn cho screen reader trong accessible name, ví dụ “Xóa cổ phiếu dòng 2”.
- Không dùng placeholder làm label. Placeholder có thể minh họa `FPT` và `145–150`, nhưng label luôn hiển thị.
- Không animate chiều cao khi thêm/xóa; row mới dùng opacity/translate 150 ms và trở thành tức thời khi reduced motion.

### 14.6 Layout bảng trên canvas

Giữ `bulletin-footer` cao 140 px và ba cột `540px 1fr 420px`. Chỉ thay nội dung `.footer-art` bằng bảng, không đổi nhãn và đoạn Nhận định thị trường.

```text
┌──────────────────────────────────────────┐  420 × 140
│ CỔ PHIẾU XUẤT HIỆN ĐIỂM MUA CHO PHIÊN TỚI │  ~32
├──────────────┬───────────────────────────┤
│ MÃ CP        │ VÙNG MUA                  │  22–24
├──────────────┼───────────────────────────┤
│ FPT          │ 145–150                   │  ~19
│ MBB          │ 24–25                     │  ~19
│ VNM          │ 61–63                     │  ~19
│ HPG          │ 28–29                     │  ~19
└──────────────┴───────────────────────────┘
```

- Vùng nội dung thực dùng padding ngang 10–12 px; bảng không tạo outer margin riêng.
- Cột Mã CP rộng khoảng 32%; Vùng mua 68%.
- Mã căn giữa và weight 700; vùng mua căn trái để đọc dải giá nhanh.
- Viền chính dùng `color.buy.border`; divider dùng cùng màu với opacity thấp hơn.
- Header cột có nền `color.buy.depth` pha opacity và chữ `color.buy.text`.
- Tiêu đề dùng `color.buy.accent`, căn giữa, không glow mạnh để tránh nhòe chữ PNG.
- Dữ liệu theo đúng thứ tự editor; không tự sắp xếp.
- Khi rỗng, phần body gộp hai cột và hiển thị “Chưa có dữ liệu”.
- Canvas không có hover/motion; DOM hoàn toàn tĩnh tại thời điểm chụp bằng `html-to-image`.

### 14.7 Component specs và states

#### 14.7.1 `BuyOpportunityEditor`

- **Purpose**: Quản lý 0–4 dòng nhập điểm mua trong cùng form nhận định.
- **Anatomy**: fieldset, legend, helper/limit, list, empty message, Add button, row errors.
- **Variants**: empty, populated, at-limit, waiting-for-data, invalid.
- **Sizes**: full-width trong editor; touch target ≥44 px.
- **Tokens**: `color.buy.*`, `space.*`, `radius.md`, `duration.fast`.
- **Responsive**: container query, không tạo component mobile riêng.
- **A11y**: `<fieldset><legend>`; danh sách dùng `<ol>`; trạng thái giới hạn có text, không chỉ disabled.

| State | Thiết kế |
|---|---|
| Default | Danh sách hiển thị các dòng hiện có; Add hoạt động khi dưới 4 |
| Hover | Viền row/Add tăng nhấn trên thiết bị có hover |
| Focus-visible | Ring cyan 3 px, offset 3 px, khác hover |
| Active | Button scale 0.98 trong 80 ms; không animate layout |
| Disabled | Khi chưa có snapshot: opacity 0.5, controls disabled, text “Chờ dữ liệu bản tin” |
| Loading | Skeleton tĩnh theo một row nếu tải >200 ms; `aria-busy=true` |
| Error | Viền đỏ + icon/text lỗi inline; focus lỗi đầu tiên khi Render |
| Success | Status chung thông báo đã tự lưu/đã Render; không biến panel thành màu xanh |

#### 14.7.2 `BuyOpportunityRow`

- **Purpose**: Nhập một mã và vùng mua, cho phép xóa đúng mục.
- **Anatomy**: two labeled text inputs, inline errors, Delete button.
- **Input behavior**: mã được trim và chuyển uppercase; vùng mua trim đầu/cuối, còn nội dung giữ nguyên.
- **Validation**: cả hai trường bắt buộc nếu row tồn tại; ticker không trùng case-insensitive.
- **A11y**: ID ổn định theo row ID thay vì array index; `aria-invalid`, `aria-describedby`; nút có accessible name chứa số dòng/mã.

| State | Thiết kế |
|---|---|
| Default | Input nền `color.buy.input`, viền mặc định, label luôn hiện |
| Hover | Viền cyan đậm hơn; Delete có nền danger rất nhẹ |
| Focus-visible | Ring cyan rõ; focus không bị clip bởi row card |
| Active | Caret/input native; Delete có pressed feedback |
| Disabled | Không nhập/xóa được khi chưa có ngày bản tin |
| Loading | Readonly/disabled skeleton, không để form nhảy layout |
| Error | Viền đỏ + thông báo cụ thể dưới trường; không chỉ đổi màu |
| Success | Không hiện check trên từng keystroke; phản hồi qua status tự lưu chung |

#### 14.7.3 `NextSessionBuyTable`

- **Purpose**: Thay artwork footer bằng bảng hiển thị 0–4 mã đã Render.
- **Anatomy**: visible heading, native table, column headers, body rows/empty row.
- **Variants**: empty, populated; loading/error dùng empty-safe content vì đây là dữ liệu thủ công cục bộ.
- **A11y**: `<section aria-labelledby>`, `<table>`, `<thead>`, `<tbody>`; tiêu đề là heading nhìn thấy, không tạo focus target.
- **States**: hover/focus/active/disabled N/A vì canvas không tương tác; loading giữ khung bảng và empty text; error giữ nội dung Render gần nhất; success hiển thị dữ liệu mới sau Render.
- **PNG**: không dùng filter phức tạp, ảnh ngoài miền, animation hoặc `foreignObject`.

### 14.8 Interaction, validation và motion

- **Thêm dòng**: append row rỗng, focus vào Mã cổ phiếu; tự lưu sau thay đổi theo debounce hiện có.
- **Xóa dòng**: xóa ngay, không mở dialog vì dữ liệu nhỏ và có thể thêm lại; status polite thông báo “Đã xóa dòng N”.
- **Đủ 4 dòng**: Add disabled; helper đổi thành “Đã đủ tối đa 4 mã”.
- **Render hợp lệ**: preview thay toàn bộ danh sách đã Render; status success.
- **Render không hợp lệ**: không đổi preview, hiển thị lỗi inline, focus lỗi đầu tiên và phát một thông báo alert ngắn.
- **Khôi phục nội dung gốc**: dialog hiện tại phải nói rõ danh sách điểm mua cũng bị xóa khỏi bản nháp ngày hiện tại.
- **Ctrl/Cmd+Enter**: tiếp tục Render từ bất kỳ input/textarea nào; nếu lỗi, focus tới lỗi đầu tiên.
- Motion thêm/xóa tối đa 150 ms bằng opacity/transform; reduced motion chuyển tức thời.
- Không animate bảng canvas để preview và PNG luôn đồng nhất.

### 14.9 Responsive và platform Web

| Bucket | Editor | Canvas/preview |
|---|---|---|
| Mobile 320–639 | Editor một cột; row tự stack khi container <300 px; nút full-width | Canvas 1920×1080 scale toàn khối, bảng không tái bố cục |
| Tablet 640–1023 | Editor xếp trên preview; row 3 cột khi đủ rộng | Scale theo container, không đổi DOM |
| PC 1024–1279 | Giữ chiến lược xếp dọc hiện tại nếu preview quá hẹp | Canvas giữ tỷ lệ 16:9 |
| PC ≥1280 | Sidebar editor 360 px sticky; row compact 3 cột | Preview bên phải; PNG gốc 1920×1080 |
| Ultra-wide ≥1920 | Không kéo editor rộng hơn; preview tận dụng phần còn lại | Canvas logic vẫn đúng 1920×1080 |

- Không thêm navigation hoặc URL mới.
- Không ghi đè shortcut trình duyệt chuẩn.
- Dùng input/button native; scrollbar editor giữ hoạt động bình thường.
- Touch target ≥44×44 px; khoảng cách giữa các nút ≥8 px.
- SEO không áp dụng cho component nội bộ; heading hierarchy phải giữ đúng.

### 14.10 Accessibility và keyboard map

Thứ tự Tab mới:

```text
Kết luận → Hành động → Nhận định thị trường
→ (Mã dòng 1 → Vùng mua dòng 1 → Xóa dòng 1)
→ ... các dòng tiếp theo
→ Thêm dòng → Render → Khôi phục → Xuất PNG
```

- Enter/Space kích hoạt Thêm dòng, Xóa, Render và Khôi phục.
- Không dùng `tabindex` lớn hơn 0.
- Add button disabled không phải nguồn thông tin duy nhất; helper giải thích giới hạn.
- Error gắn bằng `aria-describedby`, input có `aria-invalid=true`; alert chỉ phát một lần khi Render thất bại.
- Xóa row trả focus có chủ đích, tránh rơi focus về đầu trang.
- Bảng canvas dùng semantics bảng nhưng không thêm vào thứ tự Tab.
- Root tiếp tục `lang="vi"`; mọi nhãn đều là tiếng Việt.
- Đặc tả đáp ứng WCAG 2.1 AA theo token và semantics; xác nhận đầy đủ cần kiểm thử NVDA/bàn phím sau triển khai.

### 14.11 Hướng triển khai theo stack

Không thêm thư viện UI. Mở rộng React component và CSS custom properties hiện tại.

| Khu vực | Thay đổi dự kiến |
|---|---|
| `lib/types.ts` | Thêm kiểu row điểm mua và trường danh sách vào nội dung thủ công |
| `lib/narrative-editor-state.ts` | Default rỗng, so sánh sâu, validate/migrate draft cũ, lưu/render/reset |
| `components/narrative-editor.tsx` | Lắp `BuyOpportunityEditor`, Add/Delete, lỗi inline |
| `components/bulletin-dashboard.tsx` | Điều phối thay đổi list, validation, focus/status và preview |
| `components/bulletin-canvas.tsx` | Thay `FooterFinancialArtwork` bằng `NextSessionBuyTable` |
| `components/next-session-buy-table.tsx` | Component bảng presentational 0–4 dòng |
| `app/globals.css` | Semantic aliases, editor rows, table canvas và responsive rules |
| `tests/**` | State migration, Add/Delete/validation, HTML semantics, giới hạn 4 và canvas table |

`FooterFinancialArtwork` không còn được render tại footer. Quyết định xóa hẳn export/component hay giữ cho mục đích khác thuộc bước kế hoạch sau khi kiểm tra toàn bộ nơi sử dụng.

### 14.12 Acceptance criteria

- [ ] Editor khởi tạo với 0 dòng khi không có bản nháp; empty message và Thêm dòng hiển thị rõ.
- [ ] Thêm dòng tạo đúng một row và focus Mã cổ phiếu; tối đa 4 row.
- [ ] Khi đủ 4 row, Add disabled và có helper “Đã đủ tối đa 4 mã”.
- [ ] Xóa đúng row và focus không bị mất.
- [ ] Mã tự uppercase; row thiếu trường hoặc mã trùng không Render, có lỗi inline và focus lỗi đầu tiên.
- [ ] Danh sách hợp lệ tự lưu theo ngày; draft cũ thiếu trường mới được nạp như danh sách rỗng.
- [ ] Gõ chỉ thay draft; canvas chỉ đổi sau Render.
- [ ] Reset xóa cả danh sách điểm mua của ngày hiện tại sau xác nhận.
- [ ] Footer giữ chiều cao 140 px và cột phải 420 px; không ảnh hưởng Nhận định thị trường.
- [ ] Bảng có đúng tiêu đề, header `MÃ CP`/`VÙNG MUA`, tối đa 4 dòng và empty text “Chưa có dữ liệu”.
- [ ] Bảng dùng tông xanh lá CNF, không tràn/cắt chữ và rõ trong PNG 1920×1080.
- [ ] Editor hoạt động ở 320, 360, 414, 768, 1024, 1280, 1440 và 1920 px; không cuộn ngang.
- [ ] Mọi control dùng được bằng bàn phím, focus-visible đạt 3:1, touch target ≥44×44 px.
- [ ] Có đủ default/hover/focus/active/disabled/loading/error/success theo đặc tả.
- [ ] `prefers-reduced-motion` được tôn trọng; canvas không có motion.
- [ ] Không thêm dependency, không sửa API/Google Sheets/filter và không ghi danh sách ra ngoài trình duyệt.

### 14.13 QA thiết kế

| Hạng mục | Kết quả | Ghi chú |
|---|---|---|
| Brief/phạm vi | PASS | Đặc tả brainstorm đã được người dùng phê duyệt |
| Stack/brand | PASS | Next.js/React/CSS hiện tại và tokens CNF đã được kiểm tra |
| Token hai tầng | PASS | Kế thừa primitive, bổ sung semantic aliases theo vai trò |
| Dark/light parity | N/A | Dark-only là quyết định hiện hữu |
| Contrast | PASS theo token | Text, accent, focus và error đều đạt ngưỡng |
| Vietnamese | PASS theo đặc tả | Font hiện hữu, line-height/tracking và nhãn đầy đủ |
| Responsive | PASS theo đặc tả | Mobile/Tablet/PC và canvas cố định được tách rõ |
| Component states | PASS | Ba component có states và edge cases |
| Keyboard/a11y | PASS theo đặc tả | Native form/table, focus, error và live region đã định nghĩa |
| Motion | PASS | Chỉ opacity/transform 150 ms; reduced-motion; canvas tĩnh |
| Empty/loading/error/success | PASS | Đã quy định cho editor và bảng |
| Backend/business logic | PASS | Không thay đổi trong pha UI design |
| Dependency/assets | PASS | Không thêm thư viện hoặc asset ngoài |

### 14.14 Giới hạn và câu hỏi mở

- Đây là đặc tả thiết kế tĩnh; độ vừa một dòng của tiêu đề bảng và mật độ 4 row cần xác nhận bằng screenshot/PNG thật sau implementation.
- Tương thích draft cũ và hành vi focus sau Add/Delete cần kiểm thử tự động kết hợp kiểm thử trình duyệt.
- WCAG 2.1 AA đầy đủ cần kiểm thử thủ công bằng NVDA, bàn phím và audit trình duyệt; bảng contrast trên chỉ xác nhận token.
- Không còn câu hỏi sản phẩm chặn bước lập kế hoạch.
