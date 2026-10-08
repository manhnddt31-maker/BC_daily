import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { NarrativeEditor } from "../components/narrative-editor";
import { PreviewViewport } from "../components/preview-viewport";
import type { BulletinEditorContent } from "../lib/types";

const draft: BulletinEditorContent = {
  conclusion: "Kết luận đang soạn",
  action: "Hành động đang soạn",
  footer: "Nhận định đang soạn",
  nextSessionBuys: [],
};

describe("NarrativeEditor", () => {
  it("test_renders_three_labeled_fields_actions_and_live_status", () => {
    // The editor exposes the complete accessible editing contract outside the bulletin canvas.
    const markup = renderToStaticMarkup(createElement(NarrativeEditor, {
      asOfDate: "2026-08-11",
      displayDate: "2026-08-15",
      draft,
      disabled: false,
      hasUnrenderedChanges: true,
      statusMessage: "Đã tự lưu lúc 14:08",
      statusTone: "success",
      validationErrors: [],
      onDisplayDateChange: () => undefined,
      onChange: () => undefined,
      onAddBuy: () => undefined,
      onEditBuy: () => undefined,
      onRemoveBuy: () => undefined,
      onRender: () => undefined,
      onReset: () => undefined,
    }));

    expect(markup).toContain("NỘI DUNG NHẬN ĐỊNH");
    expect(markup).toContain("Ngày hiển thị trên bản tin");
    expect(markup).toContain('type="date"');
    expect(markup).toContain('value="2026-08-15"');
    expect(markup).toContain("Kết luận");
    expect(markup).toContain("Hành động");
    expect(markup).toContain("Nhận định thị trường");
    expect(markup.match(/<textarea/g)).toHaveLength(3);
    expect(markup).toContain("Render bản tin");
    expect(markup).toContain("Khôi phục nội dung gốc");
    expect(markup).toContain('role="status"');
    expect(markup).toContain("Có thay đổi chưa render");
    expect(markup).toContain("<dialog");
  });

  it("test_renders_an_editable_next_session_buy_row", () => {
    const markup = renderToStaticMarkup(createElement(NarrativeEditor, {
      asOfDate: "2026-08-11",
      displayDate: "2026-08-11",
      draft: {
        ...draft,
        nextSessionBuys: [{ id: "buy-1", ticker: "HCM", buyZone: "145-150" }],
      },
      disabled: false,
      hasUnrenderedChanges: true,
      statusMessage: "Đang soạn",
      statusTone: "neutral",
      validationErrors: [],
      onDisplayDateChange: () => undefined,
      onChange: () => undefined,
      onAddBuy: () => undefined,
      onEditBuy: () => undefined,
      onRemoveBuy: () => undefined,
      onRender: () => undefined,
      onReset: () => undefined,
    }));

    expect(markup).toContain("Cổ phiếu xuất hiện điểm mua cho phiên tới");
    expect(markup).toContain("Mã cổ phiếu");
    expect(markup).toContain("Vùng theo dõi");
    expect(markup).toContain('value="HCM"');
    expect(markup).toContain('value="145-150"');
    expect(markup).toContain("Xóa");
    expect(markup).toContain("Thêm dòng");
  });

  it("test_disables_add_at_four_rows_and_renders_inline_validation", () => {
    const rows = Array.from({ length: 4 }, (_, index) => ({
      id: `buy-${index + 1}`,
      ticker: index === 0 ? "" : `CP${index + 1}`,
      buyZone: `${index + 10}-${index + 11}`,
    }));
    const markup = renderToStaticMarkup(createElement(NarrativeEditor, {
      asOfDate: "2026-08-11",
      displayDate: "2026-08-11",
      draft: { ...draft, nextSessionBuys: rows },
      disabled: false,
      hasUnrenderedChanges: true,
      statusMessage: "Đang soạn",
      statusTone: "error",
      validationErrors: [{ rowId: "buy-1", field: "ticker", message: "Vui lòng nhập mã cổ phiếu." }],
      onDisplayDateChange: () => undefined,
      onChange: () => undefined,
      onAddBuy: () => undefined,
      onEditBuy: () => undefined,
      onRemoveBuy: () => undefined,
      onRender: () => undefined,
      onReset: () => undefined,
    }));

    expect(markup).toContain("Đã đạt tối đa 4 mã cổ phiếu.");
    expect(markup).toContain('aria-invalid="true"');
    expect(markup).toContain("Vui lòng nhập mã cổ phiếu.");
    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*>Thêm dòng<\/button>/u);
  });

  it("test_preview_viewport_keeps_canvas_in_a_separate_scaled_stage", () => {
    // The editor shell can scale the preview without changing the export canvas node.
    const previewProps = {
      canvasWidth: 1920,
      canvasHeight: 1080,
    } as Parameters<typeof PreviewViewport>[0];
    const markup = renderToStaticMarkup(createElement(
      PreviewViewport,
      previewProps,
      createElement("article", { id: "bulletin-canvas" }, "Bản tin"),
    ));

    expect(markup).toContain('class="preview-viewport"');
    expect(markup).toContain('class="preview-stage"');
    expect(markup).toContain('id="bulletin-canvas"');
  });

  it("test_user_markup_is_rendered_as_text", () => {
    // React must escape editorial input instead of interpreting stored markup.
    const markup = renderToStaticMarkup(createElement(NarrativeEditor, {
      asOfDate: "2026-08-11",
      displayDate: "2026-08-11",
      draft: { ...draft, conclusion: "<script>alert('x')</script>" },
      disabled: false,
      hasUnrenderedChanges: true,
      statusMessage: "Đang soạn",
      statusTone: "neutral",
      validationErrors: [],
      onDisplayDateChange: () => undefined,
      onChange: () => undefined,
      onAddBuy: () => undefined,
      onEditBuy: () => undefined,
      onRemoveBuy: () => undefined,
      onRender: () => undefined,
      onReset: () => undefined,
    }));

    expect(markup).not.toContain("<script>alert");
    expect(markup).toContain("&lt;script&gt;alert(&#x27;x&#x27;)&lt;/script&gt;");
  });
});
