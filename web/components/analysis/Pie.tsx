const COLORS = ["#1d4ed8", "#0f766e", "#c2410c", "#7c3aed", "#be185d", "#0369a1", "#4d7c0f", "#b45309"];

type Slice = { label: string; value: number };

function share(value: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.round((value / total) * 1000) / 10}%`;
}

function slicePath(cx: number, cy: number, r: number, start: number, end: number): string {
  const large = end - start > Math.PI ? 1 : 0;
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

export function Pie({ items, empty }: { items: Slice[]; empty: string }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (!items.length || total <= 0) {
    return <p className="text-sm text-slate-500">{empty}</p>;
  }

  const cx = 50;
  const cy = 50;
  const r = 48;
  let angle = -Math.PI / 2;
  const slices = items.map((item, index) => {
    const sweep = (item.value / total) * Math.PI * 2;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    return { ...item, start, end, color: COLORS[index % COLORS.length] };
  });

  return (
    <div className="grid min-h-[16rem] gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(11rem,14rem)] sm:items-stretch">
      <div className="min-h-[14rem] min-w-0">
        <svg viewBox="0 0 100 100" width="320" height="320" className="h-full w-full max-h-[22rem]" role="img" aria-label={items.map((item) => `${item.label} ${item.value}`).join(", ")}>
          {slices.length === 1 ? (
            <circle cx={cx} cy={cy} r={r} fill={slices[0].color}>
              <title>{`${slices[0].label} ${slices[0].value} (${share(slices[0].value, total)})`}</title>
            </circle>
          ) : (
            slices.map((slice) => (
              <path key={slice.label} d={slicePath(cx, cy, r, slice.start, slice.end)} fill={slice.color}>
                <title>{`${slice.label} ${slice.value} (${share(slice.value, total)})`}</title>
              </path>
            ))
          )}
        </svg>
      </div>
      <ul className="space-y-2 self-center text-sm">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-start gap-2">
            <span className="mt-1 inline-block h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: slice.color }} aria-hidden="true" />
            <span>
              <span className="block font-medium text-slate-800">{slice.label}</span>
              <span className="block text-xs text-slate-500">
                {slice.value} · {share(slice.value, total)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
