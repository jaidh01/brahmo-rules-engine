import { PipelineResult } from "../lib/types";

type Props = {
  result: PipelineResult;
};

const DAG_TREE = [
  { id: "HL-01",           label: "Supra Hospital",        level: 1,  dept: null,          indent: 0 },
  { id: "HL-03-CLIN",      label: "Clinical Division",     level: 3,  dept: null,          indent: 1 },
  { id: "HL-05-ORTHO",     label: "Orthopaedics Dept",     level: 5,  dept: "ortho",       indent: 2 },
  { id: "HL-08-ORTHO-GEN", label: "Ortho General",         level: 8,  dept: "ortho",       indent: 3 },
  { id: "HL-10-ORTHO-W",   label: "Ortho Ward",            level: 10, dept: "ortho",       indent: 4 },
  { id: "HL-12-RAJAN",     label: "Patient: Rajan",        level: 12, dept: "ortho",       indent: 5 },
  { id: "HL-08-ORTHO-TKR", label: "Ortho TKR Unit",        level: 8,  dept: "ortho",       indent: 3 },
  { id: "HL-08-POST-TKR",  label: "Post-TKR Protocol ×2",  level: 8,  dept: "ortho",       indent: 3 },
  { id: "HL-05-SURG",      label: "Surgery Dept",          level: 5,  dept: "surgery",     indent: 2 },
  { id: "HL-05-MED",       label: "Medicine Dept",         level: 5,  dept: "medicine",    indent: 2 },
  { id: "HL-05-CARDIO",    label: "Cardiology Dept",       level: 5,  dept: "cardiology",  indent: 2 },
  { id: "HL-05-PAEDS",     label: "Paediatrics Dept",      level: 5,  dept: "paediatrics", indent: 2 },
  { id: "HL-03-ADMIN",     label: "Admin Division",        level: 3,  dept: null,          indent: 1 },
  { id: "HL-GLOBAL",       label: "Global Constraints",    level: 3,  dept: null,          indent: 1, isGlobal: true },
];

export default function DAGViewer({ result }: Props) {
  const reachableIds = new Set(result.reachable_level_ids || []);

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <h2 className="text-sm font-semibold text-gray-300 mb-3">DAG Hierarchy</h2>
      <div className="space-y-0.5 text-xs font-mono">
        {DAG_TREE.map(node => {
          const isEntry = result.entry_point === node.id;
          const isGlobal = node.isGlobal ?? false;
          const isReachable = !isGlobal && reachableIds.has(node.id);

          return (
            <div
              key={node.id}
              className="flex items-center gap-1"
              style={{ paddingLeft: `${node.indent * 14}px` }}
            >
              <span className={
                isGlobal ? "text-yellow-400"
                : isReachable ? "text-blue-400"
                : "text-gray-600"
              }>
                {isGlobal ? "◆" : isReachable ? "●" : "○"}
              </span>
              <span className={
                isEntry ? "text-green-400 font-bold"
                : isGlobal ? "text-yellow-300"
                : isReachable ? "text-gray-200"
                : "text-gray-600"
              }>
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
  );
}