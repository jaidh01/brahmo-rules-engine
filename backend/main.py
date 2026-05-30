from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import time
from supabase import create_client, Client

from pipeline.permission_compiler import compile_permissions
from pipeline.bfs_traversal import run_bfs
from pipeline.zone2_injector import inject_zone2
from pipeline.five_check_filter import run_five_checks
from pipeline.candidate_assembler import assemble_candidate_set

from pydantic import BaseModel
from typing import Optional, List

load_dotenv()

app = FastAPI(title="BRAHMO Rules Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

class NewUser(BaseModel):
    id: str
    name: str
    role: str
    department: str
    ceiling_level: int
    write_ceiling: Optional[int] = None
    compliance_clearance: Optional[List[str]] = []

@app.get("/")
def root():
    return {"status": "BRAHMO Rules Engine running"}

@app.get("/test-db")
def test_db():
    result = supabase.table("knowledge_nodes").select("id").execute()
    return {"node_count": len(result.data)}

@app.get("/users")
def get_users():
    result = supabase.table("users").select("*").execute()
    return result.data

@app.post("/pipeline/{user_id}")
def run_pipeline(user_id: str):
    start_total = time.time()

    # --- Fetch user ---
    user_result = supabase.table("users").select("*").eq("id", user_id).execute()
    if not user_result.data:
        raise HTTPException(status_code=404, detail="User not found")
    user = user_result.data[0]

    # --- Step 1: Compile permissions ---
    t0 = time.time()
    permissions = compile_permissions(user)
    permission_ms = round((time.time() - t0) * 1000)

    # --- Step 2: Fetch hierarchy levels ---
    hierarchy_result = supabase.table("hierarchy_levels").select("*").eq("org_id", user["org_id"]).execute()
    hierarchy_levels = hierarchy_result.data

    # Build level_id -> level_number map
    level_number_map = {lvl["id"]: lvl["level_number"] for lvl in hierarchy_levels}

    # --- Step 3: Find entry point ---
    # Entry point = deepest hierarchy level matching user's department
    dept_levels = [
        lvl for lvl in hierarchy_levels
        if lvl.get("department") == user["department"]
    ]
    if not dept_levels:
        # Fallback: use root
        entry_level = next(lvl for lvl in hierarchy_levels if lvl["level_number"] == 1)
    else:
        # Pick the deepest level (highest level_number) for this department
        entry_level = max(dept_levels, key=lambda x: x["level_number"])

    # --- Step 4: BFS traversal ---
    t0 = time.time()
    # bfs_distances = run_bfs(entry_level["id"], hierarchy_levels)

    if user["role"] == "ADMIN":
        bfs_distances = {lvl["id"]: 0 for lvl in hierarchy_levels}
    else:
        bfs_distances = run_bfs(entry_level["id"], hierarchy_levels)


    bfs_ms = round((time.time() - t0) * 1000)

    reachable_level_ids = set(bfs_distances.keys())

    # --- Step 5: Fetch all nodes for reachable levels ---
    all_nodes_result = supabase.table("knowledge_nodes").select("*").eq("org_id", user["org_id"]).execute()
    all_nodes = all_nodes_result.data

    # Attach level_number to each node
    for node in all_nodes:
        node["_level_number"] = level_number_map.get(node["hierarchy_level_id"])

    # Filter to reachable nodes only
    reachable_nodes = [n for n in all_nodes if n["hierarchy_level_id"] in reachable_level_ids]
    after_bfs = len(reachable_nodes)

    # --- Step 6: Zone 2 injection ---
    t0 = time.time()
    zone2_nodes = inject_zone2(reachable_level_ids, all_nodes)

    # Merge zone2 nodes into reachable (avoid duplicates)
    reachable_ids = {n["id"] for n in reachable_nodes}
    for node in zone2_nodes:
        if node["id"] not in reachable_ids:
            reachable_nodes.append(node)
            reachable_ids.add(node["id"])

    zone2_ms = round((time.time() - t0) * 1000)
    after_zone2 = len(reachable_nodes)

    # --- Step 7: Five checks ---
    t0 = time.time()
    filter_result = run_five_checks(reachable_nodes, user, permissions)
    checks_ms = round((time.time() - t0) * 1000)

    # --- Step 8: Assemble candidate set ---
    candidate_set = assemble_candidate_set(filter_result["nodes"], bfs_distances)

    total_ms = round((time.time() - start_total) * 1000)

    return {
        "user": user["id"],
        "user_name": user["name"],
        "role": user["role"],
        "ceiling_level": user["ceiling_level"],
        "department": user["department"],
        "entry_point": entry_level["id"],
        "pipeline_timing": {
            "permission_compile_ms": permission_ms,
            "bfs_ms": bfs_ms,
            "zone2_inject_ms": zone2_ms,
            "checks_ms": checks_ms,
            "total_ms": total_ms
        },
        "funnel": {
            "total_nodes": len(all_nodes),
            "after_bfs": after_bfs,
            "after_zone2": after_zone2,
            "after_check1": filter_result["after_check1"],
            "after_check2": filter_result["after_check2"],
            "after_check3": filter_result["after_check3"],
            "after_check4": filter_result["after_check4"],
            "after_check5": filter_result["after_check5"],
        },
        "candidate_set": candidate_set
    }


@app.post("/users")
def add_user(user: NewUser):
    # Check if user ID already exists
    existing = supabase.table("users").select("id").eq("id", user.id).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="User ID already exists")
    
    result = supabase.table("users").insert({
        "id": user.id,
        "org_id": "supra",
        "name": user.name,
        "role": user.role,
        "department": user.department,
        "ceiling_level": user.ceiling_level,
        "write_ceiling": user.write_ceiling,
        "compliance_clearance": user.compliance_clearance or [],
        "status": "ACTIVE"
    }).execute()
    
    return {"success": True, "user": result.data[0]}