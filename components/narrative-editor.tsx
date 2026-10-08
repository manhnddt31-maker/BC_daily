"use client";

import { useEffect, useRef, type FormEvent, type KeyboardEvent } from "react";
import { MAX_NEXT_SESSION_BUYS, type NextSessionBuyValidationError } from "../lib/narrative-editor-state";
import type { BulletinEditorContent, BulletinNarrative } from "../lib/types";

type NarrativeEditorProps = {
  asOfDate: string | null;
  displayDate: string;
  draft: BulletinEditorContent;
  disabled: boolean;
  hasUnrenderedChanges: boolean;
  statusMessage: string;
  statusTone: "neutral" | "success" | "warning" | "error";
  validationErrors: NextSessionBuyValidationError[];
  onDisplayDateChange: (value: string) => void;
  onChange: (field: keyof BulletinNarrative, value: string) => void;
  onAddBuy: () => void;
  onEditBuy: (id: string, field: "ticker" | "buyZone", value: string) => void;
  onRemoveBuy: (id: string) => void;
  onRender: () => void;
  onReset: () => void;
};

const fields: ReadonlyArray<{ name: keyof BulletinNarrative; label: string }> = [
  { name: "conclusion", label: "Kết luận" },
  { name: "action", label: "Hành động" },
  { name: "footer", label: "Nhận định thị trường" },
];

export function NarrativeEditor({
  asOfDate,
  displayDate,
  draft,
  disabled,
  hasUnrenderedChanges,
  statusMessage,
  statusTone,
  validationErrors,
  onDisplayDateChange,
  onChange,
  onAddBuy,
  onEditBuy,
  onRemoveBuy,
  onRender,
  onReset,
}: NarrativeEditorProps) {
  const resetDialog = useRef<HTMLDialogElement>(null);
  const previousBuyCount = useRef(draft.nextSessionBuys.length);
  const tickerInputs = useRef(new Map<string, HTMLInputElement>());
  const addBuyButton = useRef<HTMLButtonElement>(null);
  const focusAfterAddition = useRef(false);
  const focusAfterRemoval = useRef<string | null>(null);
  const removalRequested = useRef(false);

  useEffect(() => {
    if (draft.nextSessionBuys.length > previousBuyCount.current && focusAfterAddition.current) {
      const newest = draft.nextSessionBuys.at(-1);
      if (newest) tickerInputs.current.get(newest.id)?.focus();
    } else if (draft.nextSessionBuys.length < previousBuyCount.current && removalRequested.current) {
      const targetId = focusAfterRemoval.current;
      if (targetId) tickerInputs.current.get(targetId)?.focus();
      else addBuyButton.current?.focus();
    }
    focusAfterAddition.current = false;
    focusAfterRemoval.current = null;
    removalRequested.current = false;
    previousBuyCount.current = draft.nextSessionBuys.length;
  }, [draft.nextSessionBuys]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onRender();
  };

  const handleShortcut = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      onRender();
    }
  };

  const requestReset = () => {
    const dialog = resetDialog.current;
    if (dialog?.showModal) {
      dialog.showModal();
      return;
    }
    if (window.confirm("Khôi phục nội dung gốc của ngày hiện tại?")) onReset();
  };

  const confirmReset = () => {
    onReset();
    resetDialog.current?.close();
  };

  return (
    <aside className="narrative-editor" aria-labelledby="narrative-editor-title">
      <header className="narrative-editor-header">
        <p className="editor-eyebrow">CNF MORNING BULLETIN</p>
        <h2 id="narrative-editor-title">NỘI DUNG NHẬN ĐỊNH</h2>
        <p className="editor-date">Ngày dữ liệu nguồn: <strong>{asOfDate ?? "Chờ dữ liệu"}</strong></p>
        <p className="editor-note">Nội dung tự lưu trong trình duyệt này và không thay đổi dữ liệu thị trường.</p>
      </header>

      <form className="narrative-editor-form" onSubmit={handleSubmit} onKeyDown={handleShortcut}>
        <label className="bulletin-date-field" htmlFor="bulletin-display-date">
          <span>Ngày hiển thị trên bản tin</span>
          <input
            id="bulletin-display-date"
            name="displayDate"
            type="date"
            value={displayDate}
            disabled={disabled}
            required
            onChange={(event) => onDisplayDateChange(event.currentTarget.value)}
          />
          <small>Ngày sẽ cập nhật trên bản tin sau khi bấm Render.</small>
        </label>

        <div className="narrative-fields">
          {fields.map(({ name, label }) => (
            <label className="narrative-field" key={name}>
              <span>{label}</span>
              <textarea
                name={name}
                value={draft[name]}
                disabled={disabled}
                spellCheck="true"
                onChange={(event) => onChange(name, event.currentTarget.value)}
              />
            </label>
          ))}
        </div>

        <fieldset className="buy-opportunity-editor">
          <legend>Cổ phiếu xuất hiện điểm mua cho phiên tới</legend>
          {draft.nextSessionBuys.length === 0 ? (
            <p className="buy-opportunity-empty">Chưa có dữ liệu. Nhấn “Thêm dòng” để nhập mã cổ phiếu.</p>
          ) : (
            <ol className="buy-opportunity-list">
              {draft.nextSessionBuys.map((row, index) => {
                const tickerError = validationErrors.find((error) => error.rowId === row.id && error.field === "ticker");
                const buyZoneError = validationErrors.find((error) => error.rowId === row.id && error.field === "buyZone");
                const tickerErrorId = `buy-${row.id}-ticker-error`;
                const buyZoneErrorId = `buy-${row.id}-zone-error`;
                return (
                  <li className="buy-opportunity-row" key={row.id}>
                    <span className="buy-opportunity-index" aria-hidden="true">{index + 1}</span>
                    <label>
                      <span>Mã cổ phiếu</span>
                      <input
                        ref={(element) => {
                          if (element) tickerInputs.current.set(row.id, element);
                          else tickerInputs.current.delete(row.id);
                        }}
                        id={`buy-${row.id}-ticker`}
                        value={row.ticker}
                        maxLength={12}
                        autoComplete="off"
                        disabled={disabled}
                        aria-invalid={Boolean(tickerError)}
                        aria-describedby={tickerError ? tickerErrorId : undefined}
                        onChange={(event) => onEditBuy(row.id, "ticker", event.currentTarget.value)}
                      />
                      {tickerError ? <small className="buy-opportunity-error" id={tickerErrorId}>{tickerError.message}</small> : null}
                    </label>
                    <label>
                      <span>Vùng theo dõi</span>
                      <input
                        id={`buy-${row.id}-zone`}
                        value={row.buyZone}
                        maxLength={32}
                        autoComplete="off"
                        disabled={disabled}
                        aria-invalid={Boolean(buyZoneError)}
                        aria-describedby={buyZoneError ? buyZoneErrorId : undefined}
                        onChange={(event) => onEditBuy(row.id, "buyZone", event.currentTarget.value)}
                      />
                      {buyZoneError ? <small className="buy-opportunity-error" id={buyZoneErrorId}>{buyZoneError.message}</small> : null}
                    </label>
                    <button
                      className="buy-opportunity-remove"
                      type="button"
                      disabled={disabled}
                      aria-label={`Xóa dòng ${index + 1}, mã ${row.ticker || "chưa nhập"}`}
                      onClick={() => {
                        removalRequested.current = true;
                        focusAfterRemoval.current = draft.nextSessionBuys[index + 1]?.id
                          ?? draft.nextSessionBuys[index - 1]?.id
                          ?? null;
                        onRemoveBuy(row.id);
                      }}
                    >
                      Xóa
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
          <button
            ref={addBuyButton}
            className="buy-opportunity-add"
            type="button"
            disabled={disabled || draft.nextSessionBuys.length >= MAX_NEXT_SESSION_BUYS}
            onClick={() => {
              focusAfterAddition.current = true;
              onAddBuy();
            }}
          >
            Thêm dòng
          </button>
          {draft.nextSessionBuys.length >= MAX_NEXT_SESSION_BUYS ? (
            <p className="buy-opportunity-limit">Đã đạt tối đa 4 mã cổ phiếu.</p>
          ) : null}
        </fieldset>

        <div className={`editor-status editor-status-${statusTone}`} role="status" aria-live="polite" aria-atomic="true">
          <span>{statusMessage}</span>
          {hasUnrenderedChanges ? <strong>Có thay đổi chưa render</strong> : null}
        </div>

        <div className="editor-actions">
          <button className="editor-button editor-button-primary" type="submit" disabled={disabled}>
            Render bản tin
          </button>
          <button className="editor-button editor-button-secondary" type="button" disabled={disabled} onClick={requestReset}>
            Khôi phục nội dung gốc
          </button>
        </div>
        <p className="editor-shortcut">Phím tắt: Ctrl/Cmd + Enter để render.</p>
      </form>

      <dialog className="reset-dialog" ref={resetDialog} aria-labelledby="reset-dialog-title" aria-describedby="reset-dialog-description">
        <h3 id="reset-dialog-title">Khôi phục nội dung gốc?</h3>
        <p id="reset-dialog-description">Ngày hiển thị, nội dung nhận định và danh sách điểm mua cục bộ của ngày {asOfDate ?? "hiện tại"} sẽ bị xóa. Dữ liệu thị trường không bị thay đổi.</p>
        <div className="reset-dialog-actions">
          <button type="button" className="editor-button editor-button-secondary" onClick={() => resetDialog.current?.close()}>Huỷ</button>
          <button type="button" className="editor-button editor-button-primary" onClick={confirmReset}>Khôi phục</button>
        </div>
      </dialog>
    </aside>
  );
}
