from pydantic import BaseModel
from typing import Optional, List


class KnowledgeNode(BaseModel):
    id: str
    org_id: str
    hierarchy_level_id: str
    type: str  # CONSTRAINT | DECISION | ANTI_PATTERN | FACT
    title: str
    content: str
    importance: float
    zone: int  # 1 = Addressed, 2 = Global, 3 = Floating
    status: str  # ACTIVE | SUPERSEDED | EXPIRED | LEGAL_HOLD
    derivability_score: float
    compliance_tags: List[str] = []
    department: Optional[str] = None
    valid_until: Optional[str] = None


class CandidateNode(BaseModel):
    id: str
    type: str
    title: str
    content: str
    importance: float
    zone: int
    hierarchy_level: Optional[int]
    department: Optional[str]
    distance_from_entry: int
    compression_hint: str  # FULL | COMPRESSED | CONSTRAINT_ONLY
    status: str
    compliance_tags: List[str] = []
