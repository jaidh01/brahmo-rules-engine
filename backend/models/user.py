from pydantic import BaseModel
from typing import Optional, List


class User(BaseModel):
    id: str
    org_id: str
    name: str
    role: str  # ADMIN | HOD | EDITOR | VIEWER | QUALITY | AUDITOR
    department: str
    ceiling_level: int
    write_ceiling: Optional[int] = None
    compliance_clearance: List[str] = []
    status: str = "ACTIVE"


class NewUserRequest(BaseModel):
    id: Optional[str] = None
    name: str
    role: str
    department: str
    ceiling_level: int
    write_ceiling: Optional[int] = None
    compliance_clearance: Optional[List[str]] = []
