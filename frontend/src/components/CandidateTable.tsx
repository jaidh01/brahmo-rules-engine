import { useState } from "react";
import { CandidateNode, TYPE_COLORS, TYPE_BG } from "../lib/types";

type Props = {
  nodes: CandidateNode[];
};

export default function CandidateTable({ nodes }: Props) {
  const [expandedNode, setExpandedNode] = useState<string | null>(null);

  const nodesByType = nodes.reduce((acc, node) => {
    acc[node.type] = (acc[node.type] || []).concat(node);
    return acc;
  }, {} as Record<string, CandidateNode[]>);

  return (
    <div className="bg-gray-900 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-300">
          Candidate Set — {nodes.length} nodes
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
        {Object.entries(nodesByType).map(([type, typeNodes]) => (
          <div key={type}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full" style={{ background: TYPE_COLORS[type] }} />
              <span className="text-xs font-semibold text-gray-400">
                {type} ({typeNodes.length})
              </span>
            </div>
            <div className="space-y-2">
              {typeNodes.map(node => (
                <div
                  key={node.id}
                  className={`border rounded-lg p-3 cursor-pointer ${TYPE_BG[node.type]}`}
                  onClick={() => setExpandedNode(expandedNode === node.id ? null : node.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {node.title}
                      </div>
                      {expandedNode === node.id && (
                        <div className="text-xs text-gray-600 mt-2 leading-relaxed">
                          {node.content}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 text-xs shrink-0">
                      <span className="bg-white/60 px-2 py-0.5 rounded text-gray-600">
                        imp: {node.importance}
                      </span>
                      <span className="bg-white/60 px-2 py-0.5 rounded text-gray-600">
                        {node.zone === 2 ? "🌐 GLOBAL" : `L${node.hierarchy_level}`}
                      </span>
                      <span className="bg-white/60 px-2 py-0.5 rounded text-gray-600">
                        {node.compression_hint}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}