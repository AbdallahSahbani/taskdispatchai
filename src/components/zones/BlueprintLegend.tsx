const LEGEND_ITEMS = [
  { label: 'Elevator', fill: 'rgba(245,158,11,0.4)', stroke: '#f59e0b' },
  { label: 'Stairwell', fill: 'rgba(52,211,153,0.3)', stroke: '#34d399' },
  { label: 'Storage', fill: 'rgba(148,163,184,0.3)', stroke: '#94a3b8' },
  { label: 'Restroom', fill: 'rgba(192,132,252,0.3)', stroke: '#c084fc' },
  { label: 'Pool', fill: 'rgba(6,182,212,0.4)', stroke: '#06b6d4' },
  { label: 'Spa', fill: 'rgba(244,114,182,0.3)', stroke: '#f472b6' },
  { label: 'Gym', fill: 'rgba(251,146,60,0.35)', stroke: '#fb923c' },
  { label: 'Restaurant', fill: 'rgba(134,239,172,0.3)', stroke: '#86efac' },
  { label: 'Bar', fill: 'rgba(251,191,36,0.3)', stroke: '#fbbf24' },
  { label: 'Suite/Reception', fill: 'rgba(240,192,64,0.25)', stroke: '#f0c040' },
  { label: 'Guest Room', fill: 'rgba(26,110,196,0.25)', stroke: '#2a8de8' },
];

export function BlueprintLegend() {
  return (
    <div className="relative z-10 flex items-center gap-3 px-4 py-2 border-b border-[hsl(210,60%,18%)] bg-[hsl(210,60%,4%)]/60 overflow-x-auto">
      <span className="text-[9px] text-[hsl(210,40%,40%)] tracking-[3px] uppercase mr-1 font-mono flex-shrink-0">Legend</span>
      {LEGEND_ITEMS.map(item => (
        <div key={item.label} className="flex items-center gap-1.5 flex-shrink-0">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ background: item.fill, border: `1px solid ${item.stroke}` }}
          />
          <span className="text-[9px] text-[hsl(210,40%,40%)] tracking-wider font-mono">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
