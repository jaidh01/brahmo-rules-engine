import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { PipelineResult, TYPE_COLORS } from "../lib/types";

type Props = {
  results: PipelineResult[];
};

export default function ComparisonView({ results }: Props) {
  if (results.length === 0) {
    return <div className="text-center text-gray-500 py-20">Loading comparison...</div>;
  }

  return (
    <>
      {/* Funnel cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {results.map(r => {
          const data = [
            { label: "Total",  count: r.funnel.total_nodes },
            { label: "BFS",    count: r.funnel.after_bfs },
            { label: "+Zone2", count: r.funnel.after_zone2 },
            { label: "Chk1",   count: r.funnel.after_check1 },
            { label: "Chk2",   count: r.funnel.after_check2 },
            { label: "Chk3",   count: r.funnel.after_check3 },
            { label: "Chk4",   count: r.funnel.after_check4 },
            { label: "Final",  count: r.funnel.after_check5 },
          ];
          return (
            <div key={r.user} className="bg-gray-900 rounded-lg p-4">
              <div className="mb-3">
                <div className="font-semibold text-white">{r.user_name}</div>
                <div className="text-xs text-gray-400">
                  {r.role} · L{r.ceiling_level} · {r.department}
                </div>
                <div className="text-xl font-bold text-green-400 mt-1">
                  {r.funnel.after_check5} nodes
                </div>
                <div className="text-xs text-gray-500">{r.pipeline_timing.total_ms}ms</div>
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={data} layout="vertical" margin={{ left: 45 }}>
                  <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 9 }} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tick={{ fill: "#d1d5db", fontSize: 9 }}
                    width={40}
                  />
                  <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                    {data.map((_, i) => (
                      <Cell key={i} fill={i === data.length - 1 ? "#22c55e" : "#3b82f6"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1">
                {r.candidate_set.slice(0, 5).map(n => (
                  <div key={n.id} className="text-xs text-gray-400 truncate flex gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                      style={{ background: TYPE_COLORS[n.type] }}
                    />
                    {n.title}
                  </div>
                ))}
                {r.candidate_set.length > 5 && (
                  <div className="text-xs text-gray-600">
                    +{r.candidate_set.length - 5} more nodes
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Access matrix */}
      <div className="bg-gray-900 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">
          Access Matrix — Same Graph, Different Results
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left text-gray-400 pb-2 font-normal">Access Type</th>
              {results.map(r => (
                <th key={r.user} className="text-center text-gray-300 pb-2 font-semibold">
                  {r.user_name.split(" ").slice(0, 2).join(" ")}
                  <div className="text-xs text-gray-500 font-normal">{r.role} · L{r.ceiling_level}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {[
              { label: "Ortho Ward nodes",       check: (r: PipelineResult) => r.candidate_set.some(n => n.department === "ortho") },
              { label: "Cardiology nodes",        check: (r: PipelineResult) => r.candidate_set.some(n => n.department === "cardiology") },
              { label: "Paediatrics nodes",       check: (r: PipelineResult) => r.candidate_set.some(n => n.department === "paediatrics") },
              { label: "Global drug safety",      check: (r: PipelineResult) => r.candidate_set.some(n => n.zone === 2) },
              { label: "MNPI / Confidential",     check: (r: PipelineResult) => r.candidate_set.some(n => n.compliance_tags?.length > 0) },
              { label: "Admin / Hospital-level",  check: (r: PipelineResult) => r.candidate_set.some(n => n.hierarchy_level === 1) },
              { label: "Patient-level nodes",     check: (r: PipelineResult) => r.candidate_set.some(n => n.hierarchy_level === 12) },
            ].map(row => (
              <tr key={row.label}>
                <td className="py-2 text-gray-400">{row.label}</td>
                {results.map(r => (
                  <td key={r.user} className="py-2 text-center">
                    {row.check(r)
                      ? <span className="text-green-400 font-bold">✓</span>
                      : <span className="text-red-500">✗</span>}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t border-gray-700">
              <td className="py-2 text-gray-300 font-semibold">Final node count</td>
              {results.map(r => (
                <td key={r.user} className="py-2 text-center text-green-400 font-bold text-lg">
                  {r.funnel.after_check5}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}