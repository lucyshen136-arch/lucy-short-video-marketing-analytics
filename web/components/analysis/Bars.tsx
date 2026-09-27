export function Bars({
  items,
  empty = "Nothing to chart yet.",
}: {
  items: { label: string; value: number; max: number; caption: string }[];
  empty?: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">{empty}</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const width = item.max <= 0 ? 0 : Math.min(100, (item.value / item.max) * 100);
        return (
          <li key={item.label}>
            <div className="mb-1 flex justify-between gap-3 text-xs text-slate-600">
              <span className="truncate">{item.label}</span>
              <span className="shrink-0">{item.caption}</span>
            </div>
            <div className="h-2 rounded bg-slate-100">
              <div className="h-2 rounded bg-blue-600" style={{ width: `${width}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
