export type User = {
  id: string;
  name: string;
  role: string;
  department: string;
  ceiling_level: number;
};

export type CandidateNode = {
  id: string;
  type: string;
  title: string;
  content: string;
  importance: number;
  zone: number;
  hierarchy_level: number;
  department: string | null;
  distance_from_entry: number;
  compression_hint: string;
  status: string;
  compliance_tags: string[];
};

export type PipelineResult = {
  user: string;
  user_name: string;
  role: string;
  ceiling_level: number;
  department: string;
  entry_point: string;
  pipeline_timing: { total_ms: number };
  funnel: {
    total_nodes: number;
    after_bfs: number;
    after_zone2: number;
    after_check1: number;
    after_check2: number;
    after_check3: number;
    after_check4: number;
    after_check5: number;
  };
  candidate_set: CandidateNode[];
  reachable_level_ids: string[];
};

export const TYPE_COLORS: Record<string, string> = {
  CONSTRAINT: "#ef4444",
  DECISION: "#f59e0b",
  ANTI_PATTERN: "#f97316",
  FACT: "#3b82f6",
};

export const TYPE_BG: Record<string, string> = {
  CONSTRAINT: "bg-red-50 border-red-200",
  DECISION: "bg-amber-50 border-amber-200",
  ANTI_PATTERN: "bg-orange-50 border-orange-200",
  FACT: "bg-blue-50 border-blue-200",
};