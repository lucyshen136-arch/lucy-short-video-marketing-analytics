import type { SankeyLink, SankeyNode } from "@/lib/content-reaction-sankey";

type Box = SankeyNode & { y: number; h: number };

function ribbon(x0: number, y0: number, h0: number, x1: number, y1: number, h1: number): string {
  const mx = (x0 + x1) / 2;
  return `M ${x0} ${y0} C ${mx} ${y0} ${mx} ${y1} ${x1} ${y1} L ${x1} ${y1 + h1} C ${mx} ${y1 + h1} ${mx} ${y0 + h0} ${x0} ${y0 + h0} Z`;
}

function place(nodes: SankeyNode[], height: number, gap: number): { boxes: Box[]; scale: number } {
  const total = nodes.reduce((sum, node) => sum + node.value, 0);
  const inner = Math.max(1, height - gap * Math.max(0, nodes.length - 1));
  const scale = inner / Math.max(1, total);
  let y = 0;
  const boxes = nodes.map((node) => {
    const h = Math.max(4, node.value * scale);
    const box = { ...node, y, h };
    y += h + gap;
    return box;
  });
  return { boxes, scale };
}

export function Sankey({
  left,
  right,
  links,
  empty,
  fromLabel,
  toLabel,
  countLabel,
  shareLabel,
}: {
  left: SankeyNode[];
  right: SankeyNode[];
  links: SankeyLink[];
  empty: string;
  fromLabel: string;
  toLabel: string;
  countLabel: string;
  shareLabel: string;
}) {
  if (!links.length) {
    return <p className="text-sm text-slate-500">{empty}</p>;
  }

  const height = Math.max(360, Math.max(left.length, right.length) * 28);
  const labelW = 200;
  const nodeW = 14;
  const flowW = 320;
  const width = labelW + nodeW + flowW + nodeW + labelW;
  const leftX = labelW;
  const rightX = labelW + nodeW + flowW;
  const { boxes: leftBoxes, scale: leftScale } = place(left, height, 8);
  const { boxes: rightBoxes, scale: rightScale } = place(right, height, 8);
  const leftById = new Map(leftBoxes.map((node) => [node.id, node]));
  const rightById = new Map(rightBoxes.map((node) => [node.id, node]));
  const leftUsed = new Map(leftBoxes.map((node) => [node.id, node.y]));
  const rightUsed = new Map(rightBoxes.map((node) => [node.id, node.y]));
  const total = links.reduce((sum, link) => sum + link.value, 0);

  const ribbons = [...links]
    .sort((a, b) => (leftById.get(a.source)?.y ?? 0) - (leftById.get(b.source)?.y ?? 0) || (rightById.get(a.target)?.y ?? 0) - (rightById.get(b.target)?.y ?? 0))
    .map((link) => {
      const source = leftById.get(link.source);
      const target = rightById.get(link.target);
      if (!source || !target) return null;
      const h0 = Math.max(1.5, link.value * leftScale);
      const h1 = Math.max(1.5, link.value * rightScale);
      const y0 = leftUsed.get(link.source) ?? source.y;
      const y1 = rightUsed.get(link.target) ?? target.y;
      leftUsed.set(link.source, y0 + h0);
      rightUsed.set(link.target, y1 + h1);
      const share = total ? `${((link.value / total) * 100).toFixed(1)}%` : "0%";
      return { ...link, path: ribbon(leftX + nodeW, y0, h0, rightX, y1, h1), share };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div className="space-y-4">
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="h-auto max-h-[36rem] w-full" role="img" aria-label={links.map((link) => `${link.source} ${link.target} ${link.value}`).join(", ")}>
        {ribbons.map((link) => (
          <path key={`${link.source}-${link.target}`} d={link.path} fill={link.color} fillOpacity="0.38">
            <title>{`${leftById.get(link.source)?.label ?? link.source} → ${rightById.get(link.target)?.label ?? link.target}: ${link.value} (${link.share})`}</title>
          </path>
        ))}
        {leftBoxes.map((node) => (
          <g key={node.id}>
            <rect x={leftX} y={node.y} width={nodeW} height={node.h} fill={node.color} rx="1" />
            <text x={leftX - 8} y={node.y + node.h / 2} textAnchor="end" dominantBaseline="middle" className="fill-slate-700" fontSize="11">
              {node.label}
            </text>
          </g>
        ))}
        {rightBoxes.map((node) => (
          <g key={node.id}>
            <rect x={rightX} y={node.y} width={nodeW} height={node.h} fill={node.color} rx="1" />
            <text x={rightX + nodeW + 8} y={node.y + node.h / 2} dominantBaseline="middle" className="fill-slate-700" fontSize="11">
              {node.label}
            </text>
          </g>
        ))}
      </svg>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-100 text-slate-600">
            <tr>
              <th className="px-3 py-2">{fromLabel}</th>
              <th className="px-3 py-2">{toLabel}</th>
              <th className="px-3 py-2">{countLabel}</th>
              <th className="px-3 py-2">{shareLabel}</th>
            </tr>
          </thead>
          <tbody>
            {ribbons.map((link) => (
              <tr key={`${link.source}-${link.target}`} className="border-b last:border-0">
                <td className="px-3 py-2">{leftById.get(link.source)?.label}</td>
                <td className="px-3 py-2">{rightById.get(link.target)?.label}</td>
                <td className="px-3 py-2">{link.value}</td>
                <td className="px-3 py-2">{link.share}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
