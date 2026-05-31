import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { PipelineResult } from "../lib/types";

type Props = {
  result: PipelineResult;
};

export default function FilterFunnel({ result }: Props) {
  const funnelData = [
    { label: "Total",        count: result.funnel.total_nodes },
    { label: "After BFS",    count: result.funnel.after_bfs },
    { label: "+Zone 2",      count: result.funnel.after_zone2 },
    { label: "Isolation",    count: result.funnel.after_check1 },
    { label: "Compliance",   count: result.funnel.after_check2 },
    { label: "Permission",   count: result.funnel.after_check3 },
    { label: "Temporal",     count: result.funnel.after_check4 },
    { label: "Derivability", count: result.funnel.after_check5 },
  ];

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <h2 className="text-sm font-semibold text-gray-300 mb-3">
        Filter Funnel — {result.user_name}
      </h2>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={funnelData} layout="vertical" margin={{ left: 80 }}>
          <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: "#d1d5db", fontSize: 11 }}
            width={80}
          />
          <Tooltip
            contentStyle={{ background: "#1f2937", border: "none", borderRadius: 6 }}
            labelStyle={{ color: "#f3f4f6" }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {funnelData.map((_, i) => (
              <Cell
                key={i}
                fill={
                  i === funnelData.length - 1 ? "#22c55e"
                  : i === 0 ? "#6b7280"
                  : "#3b82f6"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-8 gap-1 mt-2">
        {funnelData.map((d, i) => (
          <div key={i} className="text-center">
            <div className={`text-base font-bold ${i === funnelData.length - 1 ? "text-green-400" : "text-white"}`}>
              {d.count}
            </div>
            <div className="text-xs text-gray-500 leading-tight">{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}