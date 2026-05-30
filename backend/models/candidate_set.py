from pydantic import BaseModel
from typing import List, Optional
from backend.models.node import CandidateNode


class PipelineTiming(BaseModel):
    permission_compile_ms: int
    bfs_ms: int
    zone2_inject_ms: int
    checks_ms: int
    total_ms: int


class FunnelCounts(BaseModel):
    total_nodes: int
    after_bfs: int
    after_zone2: int
    after_check1: int
    after_check2: int
    after_check3: int
    after_check4: int
    after_check5: int


class CandidateSet(BaseModel):
    user: str
    user_name: str
    role: str
    ceiling_level: int
    department: str
    entry_point: str
    pipeline_timing: PipelineTiming
    funnel: FunnelCounts
    candidate_set: List[CandidateNode]
