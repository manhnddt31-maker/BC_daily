import type { NextSessionBuy } from "../lib/types";

export function NextSessionBuyTable({ rows }: { rows: readonly NextSessionBuy[] }) {
  return (
    <section className="next-session-buy-panel" aria-labelledby="next-session-buy-title">
      <h2 id="next-session-buy-title">CỔ PHIẾU XUẤT HIỆN ĐIỂM MUA CHO PHIÊN TỚI</h2>
      {rows.length === 0 ? (
        <p className="next-session-buy-empty">Chưa có dữ liệu</p>
      ) : (
        <table className="next-session-buy-table">
          <thead>
            <tr>
              <th scope="col">MÃ CP</th>
              <th scope="col">VÙNG THEO DÕI</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <th scope="row">{row.ticker}</th>
                <td>{row.buyZone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
