import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { SectorRanking } from '../components/sector-ranking';

it('hiển thị đủ 29 ngành của danh mục mới', () => {
  const sectors = Array.from({ length: 29 }, (_, index) => ({ name: `Ngành ${index + 1}`, averagePercent: index }));
  const html = renderToStaticMarkup(createElement(SectorRanking, { sectors }));
  expect(html.match(/class="sector-row"/g)).toHaveLength(29);
  expect(html).toContain('Ngành 29');
});
