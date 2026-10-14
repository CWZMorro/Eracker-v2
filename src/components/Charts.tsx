import { useEffect, useRef, useState } from 'react';
import { formatAmount } from './../lib';

/* Small SVG charts for the dashboard and reports. Colors come from the theme tokens. */

const AXIS = { fontSize: 11, fill: 'var(--color-pageTextSubdued)' };
const AXIS_HEIGHT = 20;

/** Width of an element, kept up to date as it resizes. */
function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

export function Legend() {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 12, color: 'var(--color-pageTextSubdued)' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--color-reportsBlue)', display: 'inline-block' }} />
        Income
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--color-reportsRed)', display: 'inline-block' }} />
        Expenses
      </span>
    </div>
  );
}

/** Income and expense bars side by side for each month. Amounts in cents. */
export function CashFlowChart({ data, height }: {
  data: Array<{ label: string; income: number; expense: number }>;
  height: number;
}) {
  const [ref, width] = useWidth();
  const max = Math.max(1, ...data.flatMap(d => [d.income, d.expense]));
  const slot = width / Math.max(1, data.length);
  const bar = Math.min(40, slot * 0.35);
  const plot = height - AXIS_HEIGHT;
  const y = (v: number) => plot - (Math.max(0, v) / max) * plot;

  return (
    <div ref={ref} style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height}>
          <line x1={0} x2={width} y1={plot} y2={plot} stroke="var(--color-tableBorder)" />
          {data.map((d, i) => {
            const center = slot * i + slot / 2;
            return (
              <g key={d.label}>
                <title>{`${d.label}\nIncome ${formatAmount(d.income)}\nExpenses ${formatAmount(d.expense)}`}</title>
                <rect x={center - slot / 2} y={0} width={slot} height={plot} fill="transparent" />
                <rect x={center - bar - 2} y={y(d.income)} width={bar} height={plot - y(d.income)} fill="var(--color-reportsBlue)" />
                <rect x={center + 2} y={y(d.expense)} width={bar} height={plot - y(d.expense)} fill="var(--color-reportsRed)" />
                <text x={center} y={height - 4} textAnchor="middle" {...AXIS}>{d.label}</text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

/** A balance over time as a filled line. Amounts in cents. */
export function AreaChart({ data, height }: {
  data: Array<{ label: string; value: number }>;
  height: number;
}) {
  const [ref, width] = useWidth();
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const range = Math.max(1, Math.max(...values) - min);
  const plot = height - AXIS_HEIGHT;
  const pad = 6;
  const x = (i: number) => (data.length < 2 ? width / 2 : (i / (data.length - 1)) * width);
  const y = (v: number) => pad + (1 - (v - min) / range) * (plot - pad * 2);
  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(d.value)}`).join(' ');

  return (
    <div ref={ref} style={{ height }}>
      {width > 0 && data.length > 0 && (
        <svg width={width} height={height}>
          <path d={`${line} L${x(data.length - 1)},${plot} L${x(0)},${plot} Z`} fill="var(--color-reportsBlue)" fillOpacity={0.15} />
          <path d={line} fill="none" stroke="var(--color-reportsBlue)" strokeWidth={2} />
          {data.map((d, i) => (
            <g key={d.label}>
              <title>{`${d.label}: ${formatAmount(d.value)}`}</title>
              <circle cx={x(i)} cy={y(d.value)} r={8} fill="transparent" />
              <text x={x(i)} y={height - 4} textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'} {...AXIS}>
                {d.label}
              </text>
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}

/** Ring chart of positive values. */
export function Donut({ slices, size = 120 }: {
  slices: Array<{ name: string; value: number; color: string }>;
  size?: number;
}) {
  const total = slices.reduce((acc, s) => acc + s.value, 0);
  const r = size / 2 - 10;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`} fill="none" strokeWidth={21}>
        {total === 0 ? (
          <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-tableBorder)" />
        ) : slices.map(s => {
          const length = (s.value / total) * circumference;
          const el = (
            <circle
              key={s.name}
              cx={size / 2} cy={size / 2} r={r}
              stroke={s.color}
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-offset}
            >
              <title>{`${s.name}: ${formatAmount(s.value)}`}</title>
            </circle>
          );
          offset += length;
          return el;
        })}
      </g>
    </svg>
  );
}
