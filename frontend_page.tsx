"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

const API = "http://localhost:7000";

type User = {
  id: string; name: string; role: string;
  department: string; ceiling_level: number;
};

type Node = {
  id: string; type: string; title: string; content: string;
  importance: number; zone: number; hierarchy_level: number;
  department: string | null; distance_from_entry: number;
  compression_hint: string; status: string; compliance_tags: string[];
};

type PipelineResult = {
  user: string; user_name: string; role: string;
  ceiling_level: number; department: string; entry_point: string;
  pipeline_timing: { total_ms: number };
  funnel: {
    total_nodes: number; after_bfs: number; after_zone2: number;
    after_check1: number; after_check2: number; after_check3: number;
    after_check4: number; after_check5: number;
  };
  candidate_set: Node[];
};

const TYPE_COLORS: Record<string, string> = {
  CONSTRAINT: "#ef4444", DECISION: "#f59e0b",
  ANTI_PATTERN: "#f97316", FACT: "#3b82f6",
};
const TYPE_BG: Record<string, string> = {
  CONSTRAINT: "bg-red-50 border-red-200",
  DECISION: "bg-amber-50 border-amber-200",
  ANTI_PATTERN: "bg-orange-50 border-orange-200",
  FACT: "bg-blue-50 border-blue-200",
};

const DAG_TREE = [
  { id: "HL-01", label: "Supra Hospital", level: 1, dept: null, indent: 0 },
  { id: "HL-03-CLIN", label: "Clinical Division", level: 3, dept: null, indent: 1 },
  { id: "HL-05-ORTHO", label: "Orthopaedics Dept", level: 5, dept: "ortho", indent: 2 },
  { id: "HL-08-ORTHO-GEN", label: "Ortho General", level: 8, dept: "ortho", indent: 3 },
  { id: "HL-10-ORTHO-W", label: "Ortho Ward", level: 10, dept: "ortho", indent: 4 },
  { id: "HL-12-RAJAN", label: "Patient: Rajan", level: 12, dept: "ortho", indent: 5 },
  { id: "HL-08-ORTHO-TKR", label: "Ortho TKR Unit", level: 8, dept: "ortho", indent: 3 },
  { id: "HL-08-POST-TKR", label: "Post-TKR Protocol ×2", level: 8, dept: "ortho", indent: 3 },
  { id: "HL-05-SURG", label: "Surgery Dept", level: 5, dept: "surgery", indent: 2 },
  { id: "HL-05-MED", label: "Medicine Dept", level: 5, dept: "medicine", indent: 2 },
  { id: "HL-05-CARDIO", label: "Cardiology Dept", level: 5, dept: "cardiology", indent: 2 },
  { id: "HL-05-PAEDS", label: "Paediatrics Dept", level: 5, dept: "paediatrics", indent: 2 },
  { id: "HL-03-ADMIN", label: "Admin Division", level: 3, dept: null, indent: 1 },
  { id: "HL-GLOBAL", label: "Global Constraints ◆", level: 3, dept: null, indent: 1, isGlobal: true },
];

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [compareResults, setCompareResults] = useState<PipelineResult[]>([]);
  const [activeTab, setActiveTab] = useState<"pipeline" | "compare">("pipeline");
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    id: "", name: "", role: "VIEWER", department: "",
    ceiling_level: 10, compliance_clearance: "",
  });
  const [addUserMsg, setAddUserMsg] = useState("");

  useEffect(() => {
    fetch(`${API}/users`).then(r => r.json()).then(data => {
      setUsers(data);
      if (data.length > 0) setSelectedUser(data[0].id);
    });
  }, []);

  const runPipeline = async () => {
    if (!selectedUser) return;
    setLoading(true);
    const res = await fetch(`${API}/pipeline/${selectedUser}`, { method: "POST" });
    setResult(await res.json());
    setLoading(false);
  };

  const runComparison = async () => {
    setLoading(true);
    const targets = ["U-PRIYA", "U-VIKRAM", "U-SURESH"];
    const results = await Promise.all(
      targets.map(id => fetch(`${API}/pipeline/${id}`, { method: "POST" }).then(r => r.json()))
    );
    setCompareResults(results);
    setLoading(false);
  };

  const addUser = async () => {
    const payload = {
      ...newUser,
      id: newUser.id || `U-${newUser.name.toUpperCase().replace(/\s/g, "-")}`,
      compliance_clearance: newUser.compliance_clearance
        ? newUser.compliance_clearance.split(",").map(s => s.trim()).filter(Boolean)
        : [],
    };
    const res = await fetch(`${API}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      setAddUserMsg("✅ User added!");
      setUsers(prev => [...prev, data.user]);
      setSelectedUser(data.user.id);
      setTimeout(() => { setShowAddUser(false); setAddUserMsg(""); }, 1500);
    } else {
      setAddUserMsg(`❌ ${data.detail}`);
    }
  };

  const funnelData = result ? [
    { label: "Total",       count: result.funnel.total_nodes },
    { label: "After BFS",   count: result.funnel.after_bfs },
    { label: "+Zone 2",     count: result.funnel.after_zone2 },
    { label: "Isolation",   count: result.funnel.after_check1 },
    { label: "Compliance",  count: result.funnel.after_check2 },
    { label: "Permission",  count: result.funnel.after_check3 },
    { label: "Temporal",    count: result.funnel.after_check4 },
    { label: "Derivability",count: result.funnel.after_check5 },
  ] : [];

  const nodesByType = result
    ? result.candidate_set.reduce((acc, node) => {
        acc[node.type] = (acc[node.type] || []).concat(node);
        return acc;
      }, {} as Record<string, Node[]>)
    : {};

  const reachableLevelIds = result
    ? new Set(result.candidate_set.map(n => {
        // approximate: map hierarchy_level back to an ID for DAG highlighting
        return n.department;
      }))
    : new Set();

  // For DAG: which level IDs are reachable?
  const reachableIds = result ? new Set([
    result.entry_point,
    ...DAG_TREE.filter(n =>
      result.candidate_set.some(c => c.hierarchy_level === n.level && (c.department === n.dept || c.department === null))
    ).map(n => n.id)
  ]) : new Set<string>();

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">BRAHMO Rules Engine</h1>
          <p className="text-gray-400 text-sm mt-1">BFS Traversal + 5-Check Filter Pipeline — Zero LLM · Deterministic</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["pipeline", "compare"] as const).map(tab => (
            <button key={tab}
              onClick={() => { setActiveTab(tab); if (tab === "compare") runComparison(); }}
              className={`px-4 py-2 rounded text-sm font-medium capitalize ${activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
            >{tab === "pipeline" ? "Pipeline" : "Compare Users"}</button>
          ))}
        </div>

        {/* ───────────────── PIPELINE TAB ───────────────── */}
        {activeTab === "pipeline" && (
          <>
            {/* Controls */}
            <div className="flex items-end gap-4 mb-6 bg-gray-900 p-4 rounded-lg relative">
              <div>
                <label className="text-xs text-gray-400 block mb-1">User</label>
                <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-white rounded px-3 py-2 text-sm min-w-[260px]">
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.role}, L{u.ceiling_level}, {u.department}
                    </option>
                  ))}
                </select>
              </div>

              <button onClick={runPipeline} disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white px-5 py-2 rounded text-sm font-medium">
                {loading ? "Running..." : "▶ Run Pipeline"}
              </button>

              {result && (
                <div className="text-xs text-gray-400">
                  <span className="text-green-400 font-mono">{result.pipeline_timing.total_ms}ms</span>
                  {" "}· Zero LLM · Deterministic
                </div>
              )}

              {/* Add User */}
              <button onClick={() => setShowAddUser(!showAddUser)}
                className="ml-auto bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm">
                + Add User
              </button>

              {showAddUser && (
                <div className="absolute right-0 top-full mt-2 bg-gray-800 border border-gray-700 rounded-lg p-4 z-20 w-80 shadow-2xl">
                  <h3 className="text-sm font-semibold text-white mb-3">Add New User (Surprise Test)</h3>
                  <div className="space-y-2">
                    {[
                      { k: "name", label: "Name", ph: "e.g. Dr. Preethi" },
                      { k: "department", label: "Department", ph: "e.g. pharmacy" },
                      { k: "id", label: "ID (auto if blank)", ph: "e.g. U-PREETHI" },
                    ].map(({ k, label, ph }) => (
                      <div key={k}>
                        <label className="text-xs text-gray-400">{label}</label>
                        <input className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm mt-0.5 border border-gray-600"
                          placeholder={ph} value={(newUser as any)[k]}
                          onChange={e => setNewUser({ ...newUser, [k]: e.target.value })} />
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-400">Role</label>
                        <select className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm mt-0.5 border border-gray-600"
                          value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                          {["VIEWER","EDITOR","HOD","ADMIN","QUALITY","AUDITOR"].map(r => <option key={r}>{r}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Ceiling Level (1-15)</label>
                        <input type="number" min={1} max={15}
                          className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm mt-0.5 border border-gray-600"
                          value={newUser.ceiling_level}
                          onChange={e => setNewUser({ ...newUser, ceiling_level: parseInt(e.target.value) })} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Compliance Tags (comma-sep)</label>
                      <input className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm mt-0.5 border border-gray-600"
                        placeholder="e.g. MNPI, PHI" value={newUser.compliance_clearance}
                        onChange={e => setNewUser({ ...newUser, compliance_clearance: e.target.value })} />
                    </div>
                    {addUserMsg && <p className="text-xs text-center">{addUserMsg}</p>}
                    <button onClick={addUser}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white py-1.5 rounded text-sm">
                      Add & Select User
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 4-box flow summary */}
            {result && (
              <div className="flex items-center gap-2 mb-6">
                {[
                  { label: "TOTAL", value: result.funnel.total_nodes, sub: "nodes in DB" },
                  { label: "BFS", value: result.funnel.after_bfs, sub: "reachable" },
                  { label: "+ ZONE 2", value: result.funnel.after_zone2, sub: "combined" },
                  { label: "5-CHECK", value: result.funnel.after_check5, sub: "final", green: true },
                ].map((box, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`rounded-lg p-4 text-center min-w-[100px] ${box.green ? "bg-green-900/40 border border-green-700" : "bg-gray-800"}`}>
                      <div className={`text-2xl font-bold ${box.green ? "text-green-400" : "text-white"}`}>{box.value}</div>
                      <div className="text-xs font-semibold text-gray-300 mt-0.5">{box.label}</div>
                      <div className="text-xs text-gray-500">{box.sub}</div>
                    </div>
                    {i < 3 && <span className="text-gray-600 text-xl">→</span>}
                  </div>
                ))}
                <div className="ml-4 text-xs text-gray-500 leading-relaxed">
                  <div className="text-green-400 font-mono text-sm">{result.pipeline_timing.total_ms}ms</div>
                  <div>Zero LLM calls</div>
                  <div>Deterministic</div>
                </div>
              </div>
            )}

            {result && (
              <div className="grid grid-cols-3 gap-6 mb-6">
                {/* DAG Tree */}
                <div className="bg-gray-900 rounded-lg p-4">
                  <h2 className="text-sm font-semibold text-gray-300 mb-3">DAG Hierarchy</h2>
                  <div className="space-y-0.5 text-xs font-mono">
                    {DAG_TREE.map(node => {
                      const isEntry = result.entry_point === node.id;
                      const isGlobal = (node as any).isGlobal;
                      const isReachable = reachableIds.has(node.id) || isGlobal;
                      return (
                        <div key={node.id} className="flex items-center gap-1"
                          style={{ paddingLeft: `${node.indent * 14}px` }}>
                          <span className={isGlobal ? "text-yellow-400" : isReachable ? "text-blue-400" : "text-gray-600"}>
                            {isGlobal ? "◆" : isReachable ? "●" : "○"}
                          </span>
                          <span className={`${isEntry ? "text-green-400 font-bold" : isGlobal ? "text-yellow-300" : isReachable ? "text-gray-200" : "text-gray-600"}`}>
                            [L{node.level}] {node.label}
                            {isEntry ? " ← YOU" : ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-800 space-y-1 text-xs">
                    <div className="flex items-center gap-2 text-blue-400"><span>●</span><span>Reachable</span></div>
                    <div className="flex items-center gap-2 text-gray-600"><span>○</span><span>Not reachable</span></div>
                    <div className="flex items-center gap-2 text-yellow-400"><span>◆</span><span>Zone 2 (global)</span></div>
                    <div className="flex items-center gap-2 text-green-400"><span>●</span><span>Entry point</span></div>
                  </div>
                </div>

                {/* Funnel chart (spans 2 cols) */}
                <div className="col-span-2 bg-gray-900 rounded-lg p-4">
                  <h2 className="text-sm font-semibold text-gray-300 mb-3">Filter Funnel — {result.user_name}</h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={funnelData} layout="vertical" margin={{ left: 80 }}>
                      <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                      <YAxis type="category" dataKey="label" tick={{ fill: "#d1d5db", fontSize: 11 }} width={80} />
                      <Tooltip contentStyle={{ background: "#1f2937", border: "none", borderRadius: 6 }} labelStyle={{ color: "#f3f4f6" }} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {funnelData.map((_, i) => (
                          <Cell key={i} fill={i === funnelData.length - 1 ? "#22c55e" : i === 0 ? "#6b7280" : "#3b82f6"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-8 gap-1 mt-2">
                    {funnelData.map((d, i) => (
                      <div key={i} className="text-center">
                        <div className={`text-base font-bold ${i === funnelData.length - 1 ? "text-green-400" : "text-white"}`}>{d.count}</div>
                        <div className="text-xs text-gray-500 leading-tight">{d.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Candidate Set */}
            {result && (
              <div className="bg-gray-900 rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-300">
                    Candidate Set — {result.candidate_set.length} nodes
                  </h2>
                  <div className="flex gap-3 text-xs">
                    {Object.entries(TYPE_COLORS).map(([type, color]) => (
                      <span key={type} className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
                        <span className="text-gray-400">{type}</span>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  {Object.entries(nodesByType).map(([type, nodes]) => (
                    <div key={type}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: TYPE_COLORS[type] }} />
                        <span className="text-xs font-semibold text-gray-400">{type} ({nodes.length})</span>
                      </div>
                      <div className="space-y-2">
                        {nodes.map(node => (
                          <div key={node.id}
                            className={`border rounded-lg p-3 cursor-pointer ${TYPE_BG[node.type]}`}
                            onClick={() => setExpandedNode(expandedNode === node.id ? null : node.id)}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">{node.title}</div>
                                {expandedNode === node.id && (
                                  <div className="text-xs text-gray-600 mt-2 leading-relaxed">{node.content}</div>
                                )}
                              </div>
                              <div className="flex gap-2 text-xs shrink-0">
                                <span className="bg-white/60 px-2 py-0.5 rounded text-gray-600">imp: {node.importance}</span>
                                <span className="bg-white/60 px-2 py-0.5 rounded text-gray-600">
                                  {node.zone === 2 ? "🌐 GLOBAL" : `L${node.hierarchy_level}`}
                                </span>
                                <span className="bg-white/60 px-2 py-0.5 rounded text-gray-600">{node.compression_hint}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!result && !loading && (
              <div className="text-center text-gray-500 py-20">Select a user and click Run Pipeline</div>
            )}
          </>
        )}

        {/* ───────────────── COMPARE TAB ───────────────── */}
        {activeTab === "compare" && (
          <>
            {compareResults.length === 0 && (
              <div className="text-center text-gray-500 py-20">Loading comparison...</div>
            )}
            {compareResults.length > 0 && (
              <>
                {/* Funnel cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {compareResults.map(r => {
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
                          <div className="text-xs text-gray-400">{r.role} · L{r.ceiling_level} · {r.department}</div>
                          <div className="text-xl font-bold text-green-400 mt-1">{r.funnel.after_check5} nodes</div>
                          <div className="text-xs text-gray-500">{r.pipeline_timing.total_ms}ms</div>
                        </div>
                        <ResponsiveContainer width="100%" height={150}>
                          <BarChart data={data} layout="vertical" margin={{ left: 45 }}>
                            <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 9 }} />
                            <YAxis type="category" dataKey="label" tick={{ fill: "#d1d5db", fontSize: 9 }} width={40} />
                            <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                              {data.map((_, i) => (
                                <Cell key={i} fill={i === data.length - 1 ? "#22c55e" : "#3b82f6"} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })}
                </div>

                {/* Access matrix */}
                <div className="bg-gray-900 rounded-lg p-5">
                  <h2 className="text-sm font-semibold text-gray-300 mb-4">Access Matrix — Same Graph, Different Results</h2>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left text-gray-400 pb-2 font-normal">Access Type</th>
                        {compareResults.map(r => (
                          <th key={r.user} className="text-center text-gray-300 pb-2 font-semibold">
                            {r.user_name.split(" ")[0]} {r.user_name.split(" ")[1]}
                            <div className="text-xs text-gray-500 font-normal">{r.role} · L{r.ceiling_level}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {[
                        {
                          label: "Ortho Ward nodes",
                          check: (r: PipelineResult) => r.candidate_set.some(n => n.department === "ortho"),
                        },
                        {
                          label: "Cardiology nodes",
                          check: (r: PipelineResult) => r.candidate_set.some(n => n.department === "cardiology"),
                        },
                        {
                          label: "Paediatrics nodes",
                          check: (r: PipelineResult) => r.candidate_set.some(n => n.department === "paediatrics"),
                        },
                        {
                          label: "Global drug safety",
                          check: (r: PipelineResult) => r.candidate_set.some(n => n.zone === 2),
                        },
                        {
                          label: "MNPI / Confidential nodes",
                          check: (r: PipelineResult) => r.candidate_set.some(n => n.compliance_tags?.length > 0),
                        },
                        {
                          label: "Admin / Hospital-level",
                          check: (r: PipelineResult) => r.candidate_set.some(n => n.hierarchy_level === 1),
                        },
                        {
                          label: "Patient-level nodes",
                          check: (r: PipelineResult) => r.candidate_set.some(n => n.hierarchy_level === 12),
                        },
                      ].map(row => (
                        <tr key={row.label}>
                          <td className="py-2 text-gray-400">{row.label}</td>
                          {compareResults.map(r => (
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
                        {compareResults.map(r => (
                          <td key={r.user} className="py-2 text-center text-green-400 font-bold text-lg">
                            {r.funnel.after_check5}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
