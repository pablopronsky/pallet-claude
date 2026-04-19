/* ==========================================================
   Charts — minimal, inline SVG. Hand-rolled instead of Recharts
   so we have full control over the dark charcoal + green aesthetic
   and don't pay for a library we barely use.
   All charts take plain data arrays and a width/height.
   ========================================================== */

// --- shared ---
const GREEN = 'var(--np-green)';
const GREEN_SOFT = 'var(--np-green-soft)';
const ORANGE = 'var(--np-orange)';
const BLUE = '#7aa6ff';
const GRID = 'rgba(255,255,255,0.06)';
const AXIS = 'rgba(255,255,255,0.3)';
const LABEL = '#a7a9ad';

function niceMax(max) {
  if (max <= 0) return 10;
  const mag = Math.pow(10, Math.floor(Math.log10(max)));
  const n = max / mag;
  let r;
  if (n <= 1) r = 1; else if (n <= 2) r = 2; else if (n <= 5) r = 5; else r = 10;
  return r * mag;
}

// --- Bar chart (vertical) — ventas por sucursal ---
function BarChart({ data, valueKey = 'total', labelKey = 'label', format = fmtMoney, height = 240 }) {
  const width = 520;
  const padL = 56, padR = 16, padT = 16, padB = 40;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const max = niceMax(Math.max(...data.map(d => d[valueKey])));
  const barW = innerW / data.length * 0.56;
  const step = innerW / data.length;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => max * t);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block' }}>
      {/* grid */}
      {ticks.map((t, i) => {
        const y = padT + innerH - (t / max) * innerH;
        return <g key={i}>
          <line x1={padL} x2={width - padR} y1={y} y2={y} stroke={GRID} />
          <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="10" fill={LABEL}>
            {i === 0 ? '0' : format(t).replace('$', '$')}
          </text>
        </g>;
      })}
      {data.map((d, i) => {
        const x = padL + step * i + (step - barW) / 2;
        const h = (d[valueKey] / max) * innerH;
        const y = padT + innerH - h;
        return <g key={i}>
          <rect x={x} y={y} width={barW} height={h} fill={GREEN} rx="1" />
          <rect x={x} y={y} width={barW} height="3" fill={GREEN_SOFT} />
          <text x={x + barW / 2} y={padT + innerH + 20} textAnchor="middle" fontSize="11" fill="#e7e6e3" fontWeight="500">
            {d[labelKey]}
          </text>
          <text x={x + barW / 2} y={y - 8} textAnchor="middle" fontSize="10" fill={LABEL}>
            {format(d[valueKey])}
          </text>
        </g>;
      })}
    </svg>
  );
}

// --- Horizontal bar chart — top modelos ---
function HBarChart({ data, valueKey = 'cajas', labelKey = 'nombre', height = 240 }) {
  const width = 520;
  const padL = 180, padR = 40, padT = 8, padB = 8;
  const innerW = width - padL - padR;
  const rowH = (height - padT - padB) / data.length;
  const max = niceMax(Math.max(...data.map(d => d[valueKey])));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block' }}>
      {data.map((d, i) => {
        const y = padT + rowH * i + rowH * 0.2;
        const h = rowH * 0.6;
        const w = (d[valueKey] / max) * innerW;
        return <g key={i}>
          <text x={padL - 12} y={y + h / 2 + 4} textAnchor="end" fontSize="11" fill="#e7e6e3">
            {d[labelKey]}
          </text>
          <rect x={padL} y={y} width={innerW} height={h} fill="rgba(255,255,255,0.03)" rx="1" />
          <rect x={padL} y={y} width={w} height={h} fill={GREEN} rx="1" />
          <text x={padL + w + 8} y={y + h / 2 + 4} fontSize="11" fill="#e7e6e3" fontWeight="500">
            {d[valueKey]}
          </text>
        </g>;
      })}
    </svg>
  );
}

// --- Line chart — evolución temporal ---
function LineChart({ data, height = 240 }) {
  const width = 520;
  const padL = 56, padR = 20, padT = 20, padB = 32;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const max = niceMax(Math.max(...data.map(d => d.total)));

  const points = data.map((d, i) => {
    const x = padL + (i / Math.max(data.length - 1, 1)) * innerW;
    const y = padT + innerH - (d.total / max) * innerH;
    return { x, y, d };
  });

  const path = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  const area = `${path} L ${points[points.length - 1].x} ${padT + innerH} L ${points[0].x} ${padT + innerH} Z`;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => max * t);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="areaG" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={GREEN_SOFT} stopOpacity="0.3"/>
          <stop offset="1" stopColor={GREEN_SOFT} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {ticks.map((t, i) => {
        const y = padT + innerH - (t / max) * innerH;
        return <g key={i}>
          <line x1={padL} x2={width - padR} y1={y} y2={y} stroke={GRID} />
          <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="10" fill={LABEL}>
            {i === 0 ? '0' : fmtMoney(t)}
          </text>
        </g>;
      })}
      <path d={area} fill="url(#areaG)" />
      <path d={path} fill="none" stroke={GREEN_SOFT} strokeWidth="2" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill={GREEN_SOFT} stroke="var(--np-charcoal-2)" strokeWidth="2"/>
          <text x={p.x} y={padT + innerH + 20} textAnchor="middle" fontSize="10" fill={LABEL}>
            {p.d.label.replace('2026-', '').replace('-', '/')}
          </text>
        </g>
      ))}
    </svg>
  );
}

// --- Sparkline (deuda) ---
function Sparkline({ data, height = 60, width = 220, color = GREEN_SOFT }) {
  const padY = 8;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = padY + (height - padY*2) * (1 - (v - min) / range);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// --- Utility bars — utilidad por sucursal (compact) ---
function UtilityBars({ data, height = 180 }) {
  const width = 520;
  const padL = 100, padR = 60, padT = 10, padB = 10;
  const innerW = width - padL - padR;
  const rowH = (height - padT - padB) / data.length;
  const max = niceMax(Math.max(...data.map(d => d.utilidad)));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block' }}>
      {data.map((d, i) => {
        const y = padT + rowH * i + rowH * 0.25;
        const h = rowH * 0.5;
        const w = (d.utilidad / max) * innerW;
        return <g key={i}>
          <text x={padL - 12} y={y + h / 2 + 4} textAnchor="end" fontSize="12" fill="#e7e6e3" fontWeight="500">
            {d.sucursal}
          </text>
          <rect x={padL} y={y} width={innerW} height={h} fill="rgba(255,255,255,0.03)" rx="1" />
          <rect x={padL} y={y} width={w} height={h} fill={ORANGE} rx="1" />
          <text x={padL + innerW + 8} y={y + h / 2 + 4} fontSize="11" fill="#e7e6e3" fontWeight="500">
            {fmtMoney(d.utilidad)}
          </text>
        </g>;
      })}
    </svg>
  );
}

// --- Stacked bar — stock disponible vs vendido por sucursal ---
function StackedBars({ data, height = 180 }) {
  const width = 520;
  const padL = 90, padR = 20, padT = 28, padB = 10;
  const innerW = width - padL - padR;
  const rowH = (height - padT - padB) / data.length;
  const max = Math.max(...data.map(d => d.disp + d.vend));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block' }}>
      {/* legend */}
      <g>
        <rect x={padL} y="6" width="10" height="10" fill={GREEN} />
        <text x={padL + 16} y="15" fontSize="11" fill={LABEL}>Disponibles</text>
        <rect x={padL + 110} y="6" width="10" height="10" fill={ORANGE} />
        <text x={padL + 126} y="15" fontSize="11" fill={LABEL}>Vendidas</text>
      </g>
      {data.map((d, i) => {
        const y = padT + rowH * i + rowH * 0.22;
        const h = rowH * 0.56;
        const wDisp = (d.disp / max) * innerW;
        const wVend = (d.vend / max) * innerW;
        return <g key={i}>
          <text x={padL - 12} y={y + h / 2 + 4} textAnchor="end" fontSize="12" fill="#e7e6e3" fontWeight="500">
            {d.sucursal}
          </text>
          <rect x={padL} y={y} width={wDisp} height={h} fill={GREEN} />
          <rect x={padL + wDisp} y={y} width={wVend} height={h} fill={ORANGE} />
          <text x={padL + wDisp / 2} y={y + h / 2 + 4} fontSize="11" fill="#fff" textAnchor="middle" fontWeight="500">
            {d.disp}
          </text>
          {wVend > 32 && (
            <text x={padL + wDisp + wVend / 2} y={y + h / 2 + 4} fontSize="11" fill="#fff" textAnchor="middle" fontWeight="500">
              {d.vend}
            </text>
          )}
        </g>;
      })}
    </svg>
  );
}

Object.assign(window, { BarChart, HBarChart, LineChart, Sparkline, UtilityBars, StackedBars });
