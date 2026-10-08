const candleCloses = [
  128, 112, 119, 98, 105, 91, 114, 87, 101, 76,
  63, 72, 88, 82, 69, 94, 78, 61, 70, 54,
  66, 79, 57, 68, 48, 60, 43, 52, 35, 46,
] as const;

const marketCandles = candleCloses.map((close, index) => {
  const open = index === 0 ? 136 : candleCloses[index - 1];
  const upper = Math.min(open, close);
  const lower = Math.max(open, close);
  return {
    x: 18 + index * 28,
    open,
    close,
    high: Math.max(12, upper - 9 - (index % 4) * 2),
    low: Math.min(154, lower + 8 + (index % 3) * 3),
  };
});

const trendPoints = [
  [410, 126], [450, 105], [492, 116], [532, 86], [574, 96],
  [616, 72], [658, 84], [702, 58], [744, 73], [786, 49],
  [832, 65], [902, 20],
] as const;

const referencePoints = [
  [360, 139], [404, 130], [448, 138], [492, 124], [536, 132],
  [580, 120], [624, 131], [668, 122], [712, 137], [756, 124], [804, 132],
] as const;

function points(values: ReadonlyArray<readonly [number, number]>) {
  return values.map(([x, y]) => `${x},${y}`).join(" ");
}

export function HeaderMarketArtwork() {
  return (
    <div className="header-market" data-artwork="header-market" aria-hidden="true">
      <svg className="globe" viewBox="0 0 180 180" data-artwork-part="globe" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id="cnf-header-globe-fill" cx="44%" cy="38%" r="64%">
            <stop offset="0" stopColor="var(--color-art-highlight)" stopOpacity=".24" />
            <stop offset=".55" stopColor="var(--color-art-secondary)" stopOpacity=".1" />
            <stop offset="1" stopColor="var(--color-art-depth)" stopOpacity=".04" />
          </radialGradient>
          <filter id="cnf-header-globe-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx="90" cy="90" r="78" fill="none" stroke="var(--color-art-highlight)" strokeOpacity=".16" />
        <circle cx="90" cy="90" r="72" fill="url(#cnf-header-globe-fill)" stroke="var(--color-art-primary)" strokeWidth="1.8" filter="url(#cnf-header-globe-glow)" />
        <circle cx="90" cy="90" r="67" fill="none" stroke="var(--color-art-secondary)" strokeOpacity=".34" />
        <g fill="none" stroke="var(--color-art-secondary)" strokeOpacity=".3">
          <ellipse cx="90" cy="90" rx="25" ry="72" />
          <ellipse cx="90" cy="90" rx="49" ry="72" />
          <ellipse cx="90" cy="90" rx="72" ry="28" />
          <ellipse cx="90" cy="90" rx="72" ry="51" />
          <path d="M18 90h144M25 61h130M25 119h130" />
        </g>
        <g fill="var(--color-art-primary)" stroke="var(--color-art-highlight)" strokeWidth=".7" opacity=".8">
          <path d="M47 48 61 39l13 8 17-4 9 10 17 4 7 12-10 8-12-4-12 9-18-4-8-11-12-4-5-15Z" />
          <path d="m98 87 19-7 12 9-3 15-11 8-10 17-13-5-1-12-9-9 16-16Z" />
          <path d="m46 103 10-5 9 7-3 10-12 5-8-7 4-10Z" />
        </g>
        <g fill="var(--color-art-highlight)">
          <circle cx="48" cy="70" r="1.8" /><circle cx="72" cy="43" r="1.5" />
          <circle cx="120" cy="65" r="1.7" /><circle cx="111" cy="111" r="1.6" />
          <circle cx="65" cy="126" r="1.4" />
        </g>
      </svg>

      <svg className="market-art" viewBox="0 0 980 170" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="cnf-header-candle-up" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-art-highlight)" />
            <stop offset="1" stopColor="var(--color-art-primary)" />
          </linearGradient>
          <linearGradient id="cnf-header-candle-down" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-art-secondary)" />
            <stop offset="1" stopColor="var(--color-art-depth)" />
          </linearGradient>
          <filter id="cnf-header-trend-glow" x="-20%" y="-50%" width="150%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <marker id="cnf-header-trend-arrow" markerWidth="11" markerHeight="11" refX="9" refY="5.5" orient="auto" markerUnits="strokeWidth">
            <path d="M0 0 11 5.5 0 11 3 5.5Z" fill="var(--color-art-highlight)" />
          </marker>
        </defs>

        <g stroke="var(--color-art-grid)" strokeOpacity="var(--art-opacity-grid)" strokeWidth="1">
          {[28, 62, 96, 130].map((y) => <line key={`h-${y}`} x1="0" x2="958" y1={y} y2={y} />)}
          {[56, 140, 224, 308, 392, 476, 560, 644, 728, 812, 896].map((x) => <line key={`v-${x}`} x1={x} x2={x} y1="10" y2="156" />)}
        </g>

        <g>
          {marketCandles.map(({ x, open, close, high, low }, index) => {
            const isUp = close < open;
            const top = Math.min(open, close);
            const height = Math.max(4, Math.abs(open - close));
            const color = isUp ? "url(#cnf-header-candle-up)" : "url(#cnf-header-candle-down)";
            return (
              <g key={x} data-candlestick="true" opacity={index < 4 ? ".64" : ".9"}>
                <line data-candlestick-wick="true" x1={x + 5} x2={x + 5} y1={high} y2={low} stroke="var(--color-art-secondary)" strokeWidth="1.5" />
                <rect x={x} y={top} width="10" height={height} rx="1" fill={color} />
              </g>
            );
          })}
        </g>

        <polyline points={points(referencePoints)} fill="none" stroke="var(--color-art-secondary)" strokeWidth="1.8" strokeOpacity=".58" strokeDasharray="3 4" />
        <polyline
          points={points(trendPoints)}
          fill="none"
          stroke="var(--color-art-highlight)"
          strokeWidth="3.5"
          strokeLinejoin="round"
          markerEnd="url(#cnf-header-trend-arrow)"
          filter="url(#cnf-header-trend-glow)"
        />
        <g fill="var(--color-art-highlight)" filter="url(#cnf-header-trend-glow)">
          {trendPoints.slice(0, -1).map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3.2" />)}
        </g>
        <text x="330" y="30" fill="var(--color-art-secondary)" fontSize="24" fontWeight="700">23.18</text>
        <text x="686" y="29" fill="var(--color-art-highlight)" fontSize="24" fontWeight="700">21.04</text>
        <text x="866" y="149" fill="var(--color-art-secondary)" fontSize="24" fontWeight="700">27.53</text>
      </svg>
    </div>
  );
}

export function SpeakerArtwork() {
  return (
    <svg className="speaker-artwork" viewBox="0 0 96 72" data-artwork="speaker" aria-hidden="true" focusable="false">
      <defs>
        <filter id="cnf-speaker-glow" x="-40%" y="-50%" width="190%" height="210%">
          <feGaussianBlur stdDeviation="3.2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g fill="var(--color-art-depth)" fillOpacity=".36" stroke="var(--color-art-highlight)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" filter="url(#cnf-speaker-glow)">
        <path d="M10 27h17l25-15v48L27 45H10a6 6 0 0 1-6-6v-6a6 6 0 0 1 6-6Z" />
        <path d="m22 45 4 19h13l-5-15" />
        <path d="M58 27c7 5 7 13 0 18M67 20c13 9 13 23 0 32M77 13c19 13 19 33 0 46" fill="none" />
        <path d="M48 19V8M37 16l-5-9M58 16l5-9" fill="none" stroke="var(--color-art-secondary)" strokeWidth="2" />
      </g>
    </svg>
  );
}
