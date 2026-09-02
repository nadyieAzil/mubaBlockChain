'use client';
import React from 'react';

interface Slice {
  label: string;
  bps: number;
  color: string;
}

interface SplitPieChartProps {
  slices: Slice[];
  totalAmount?: number;
}

const COLORS = [
  '#2563eb', // blue-600
  '#7c3aed', // violet-600
  '#059669', // emerald-600
  '#d97706', // amber-600
  '#db2777', // pink-600
  '#0891b2', // cyan-600
];

export const SLICE_COLORS = COLORS;

export const SplitPieChart: React.FC<SplitPieChartProps> = ({ slices, totalAmount = 0 }) => {
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const r = 65;
  const innerR = 38;

  const total = slices.reduce((a, s) => a + s.bps, 0);

  // Build SVG arc paths
  const getCoords = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos((angle - 90) * (Math.PI / 180)),
    y: cy + radius * Math.sin((angle - 90) * (Math.PI / 180)),
  });

  const buildPath = (startAngle: number, endAngle: number) => {
    const s = getCoords(startAngle, r);
    const e = getCoords(endAngle, r);
    const si = getCoords(startAngle, innerR);
    const ei = getCoords(endAngle, innerR);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${si.x} ${si.y} L ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y} L ${ei.x} ${ei.y} A ${innerR} ${innerR} 0 ${largeArc} 0 ${si.x} ${si.y} Z`;
  };

  let currentAngle = 0;
  const paths: { path: string; color: string; label: string; bps: number }[] = [];

  for (const slice of slices) {
    if (slice.bps <= 0) continue;
    const pct = total > 0 ? slice.bps / total : 0;
    const sweep = pct * 360;
    if (sweep < 0.5) { currentAngle += sweep; continue; }
    paths.push({
      path: buildPath(currentAngle, currentAngle + sweep - 0.5),
      color: slice.color,
      label: slice.label,
      bps: slice.bps,
    });
    currentAngle += sweep;
  }

  const totalValid = total === 10000;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* SVG Pie */}
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {paths.length === 0 ? (
            <circle cx={cx} cy={cy} r={r} fill="#e2e8f0" />
          ) : (
            paths.map((p, i) => (
              <path
                key={i}
                d={p.path}
                fill={p.color}
                stroke="white"
                strokeWidth="2"
                style={{ transition: 'd 0.4s ease', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
              />
            ))
          )}
          {/* Inner circle */}
          <circle cx={cx} cy={cy} r={innerR - 2} fill="white" />
          {/* Center text */}
          <text x={cx} y={cy - 8} textAnchor="middle" className="font-extrabold" style={{ fontSize: 14, fontWeight: 800, fill: '#1e40af' }}>
            {total === 0 ? '0' : (total / 100).toFixed(0)}%
          </text>
          <text x={cx} y={cy + 8} textAnchor="middle" style={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }}>
            allocated
          </text>
          {totalAmount > 0 && (
            <text x={cx} y={cy + 20} textAnchor="middle" style={{ fontSize: 9, fill: '#2563eb', fontWeight: 700 }}>
              ${totalAmount.toLocaleString()}
            </text>
          )}
        </svg>
        {totalValid && (
          <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-extrabold">✓</div>
        )}
      </div>

      {/* Legend */}
      <div className="w-full space-y-1.5 max-w-xs">
        {slices.map((s, i) => {
          const pct = total > 0 ? ((s.bps / 10000) * 100).toFixed(1) : '0.0';
          const amt = totalAmount > 0 ? ((s.bps / 10000) * totalAmount).toFixed(2) : null;
          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
              <span className="font-semibold text-slate-700 truncate flex-1">{s.label || `Recipient ${i + 1}`}</span>
              <span className="font-extrabold text-slate-900">{pct}%</span>
              {amt && <span className="text-emerald-700 font-bold">${amt}</span>}
            </div>
          );
        })}
      </div>

      {/* Validation */}
      {total > 0 && total !== 10000 && (
        <div className="text-xs font-bold text-rose-600 bg-rose-50 rounded-lg px-3 py-1.5 w-full text-center">
          ⚠ Total must equal 100% (10000 bps). Current: {(total / 100).toFixed(1)}%
        </div>
      )}
      {totalValid && (
        <div className="text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg px-3 py-1.5 w-full text-center">
          ✓ Split is valid — exactly 100% allocated
        </div>
      )}
    </div>
  );
};
