# Architecture Notes — BRAHMO Rules Engine

## Pipeline Overview

* User Session Start

  * Permission Compiler *(O(1) lookup built once)*
  * Entry Point Resolver *(dept → DAG leaf node)*
  * BFS Traversal *(walk upward through DAG)*
  * Zone 2 Injection *(add global safety nodes)*
  * 5-Check Sequential Filter

    * Isolation
    * Compliance
    * Permission
    * Temporal
    * Derivability
  * Candidate Set Assembler *(annotate + sort by importance)*



## Key Design Decisions

### 1. Why BFS walks UPWARD
The DAG is structured with the hospital root at Level 1 and wards/patients at Level 10-12. A user at Ortho Ward (L10) walks UP toward the root, collecting every ancestor node. This naturally enforces department isolation — Cardiology nodes are on a different branch and are never touched, not denied.

### 2. Why Zone 2 nodes bypass the permission ceiling check
Global drug safety constraints (e.g. Warfarin-NSAID interaction) live at hierarchy Level 3 — above a ward nurse's ceiling of Level 10. If we applied the ceiling check strictly, nurses would never see life-critical safety rules. Zone 2 nodes are injected after BFS and bypass Check 3 (permission ceiling) because they are hospital-wide mandates, not privileged information.

### 3. Why checks are sequential, not parallel
Each check's output is the input to the next. A compliance-excluded node (Check 2) must never reach the permission check (Check 3) — not for performance, but for correctness. Running checks in parallel would mean a restricted node could pass one check while failing another, creating a window where partial data is processed.

### 4. Why permission is compiled once (O(1) lookup)
With 500+ nodes in the reachable set, querying the database per node during the permission check would be an N+1 query disaster. At session start we compile the user's permission profile into a dictionary `{level_number: {can_read: bool}}`. Each permission check is then a single dictionary lookup — O(1) regardless of graph size.

### 5. Why restricted nodes are silently excluded (not denied)
Returning HTTP 403 or "access denied" for restricted nodes tells an attacker those nodes exist. Silent exclusion means unauthorized nodes are simply absent from the response — indistinguishable from not existing at all.

### 6. Why Checks 1-4 run as application-layer filters (not SQL WHERE clauses)
For this assessment, we fetch the reachable node IDs from BFS first, then retrieve only those nodes from the database. This avoids fetching all 50 nodes into memory. In production at scale, Checks 1-4 would be pushed into SQL WHERE clauses or Supabase RLS policies to ensure restricted data never leaves the database layer.

### 7. How multi-parent DAG nodes are handled
Post-TKR Protocol has two parents (Orthopaedics + Surgery). BFS uses a `visited` set — when a node is first encountered, it's added to visited and queued. Any subsequent path that reaches the same node finds it already in the visited set and skips it. This prevents double-processing and handles accidental cycles.

### 8. How derivability scoring works
Each node has a pre-computed `derivability_score` (0.0-1.0) set at seed time. Nodes containing generic medical knowledge (e.g. "Paracetamol is an analgesic") score high (0.9+). Nodes containing org-specific decisions (e.g. "Supra Ortho uses Paracetamol 650mg QDS post-TKR — decided by Dr. Vikram Jan 2025") score low (0.05-0.15). Threshold: 0.7. Nodes above this threshold are excluded because the AI can answer from general training data — sending them wastes tokens without adding value.

## Scalability

**Q: This demo has 50 nodes. A hospital chain has 15,000 across 12 hospitals.**

- BFS is bounded by the user's reachable subgraph. Priya's BFS touches ~17 nodes regardless of whether the total graph has 50 or 15,000 nodes.
- Checks 1-4 are binary SQL conditions that scale with database indexes, not total row count.
- Derivability is a pre-computed score — zero compute at query time.
- Permission compilation is O(1) per check after a one-time session-start build.
- Multi-tenancy (Check 1) ensures each hospital's nodes are isolated by `org_id` index.

Pipeline time stays under 500ms because it is proportional to the user's reachable subgraph, not total graph size.

## What This Pipeline Does NOT Do
- It does not compress nodes into an AI prompt (that is the downstream Composition Agent)
- It does not authenticate users (handled upstream)
- It does not update or mutate knowledge nodes
- It does not use any LLM at any stage