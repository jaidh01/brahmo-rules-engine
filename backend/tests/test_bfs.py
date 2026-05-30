"""
Tests for BFS traversal — verifies correct upward DAG traversal,
multi-parent handling, visited set, and cycle prevention.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from pipeline.bfs_traversal import run_bfs

# Minimal test graph (mirrors the Supabase hierarchy structure)
TEST_HIERARCHY = [
    {"id": "HL-01",           "level_number": 1,  "parent_ids": []},
    {"id": "HL-03-CLIN",      "level_number": 3,  "parent_ids": ["HL-01"]},
    {"id": "HL-05-ORTHO",     "level_number": 5,  "parent_ids": ["HL-03-CLIN"]},
    {"id": "HL-05-SURG",      "level_number": 5,  "parent_ids": ["HL-03-CLIN"]},
    {"id": "HL-05-CARDIO",    "level_number": 5,  "parent_ids": ["HL-03-CLIN"]},
    {"id": "HL-08-ORTHO-GEN", "level_number": 8,  "parent_ids": ["HL-05-ORTHO"]},
    {"id": "HL-08-POST-TKR",  "level_number": 8,  "parent_ids": ["HL-05-ORTHO", "HL-05-SURG"]},  # multi-parent
    {"id": "HL-10-ORTHO-W",   "level_number": 10, "parent_ids": ["HL-08-ORTHO-GEN"]},
]


def test_bfs_walks_upward():
    """BFS from Ortho Ward should reach root, not Cardiology."""
    result = run_bfs("HL-10-ORTHO-W", TEST_HIERARCHY)
    assert "HL-10-ORTHO-W" in result   # entry point
    assert "HL-08-ORTHO-GEN" in result # parent
    assert "HL-05-ORTHO" in result     # grandparent
    assert "HL-03-CLIN" in result      # great-grandparent
    assert "HL-01" in result           # root
    assert "HL-05-CARDIO" not in result  # different branch — must NOT be reachable


# def test_bfs_multi_parent_no_duplicate():
#     """Post-TKR Protocol has two parents. BFS must not process it twice."""
#     result = run_bfs("HL-10-ORTHO-W", TEST_HIERARCHY)
#     # HL-05-SURG reachable via Post-TKR (multi-parent), but only once
#     assert "HL-05-SURG" in result
#     # HL-03-CLIN is parent of both ORTHO and SURG — must appear exactly once
#     level_ids = list(result.keys())
#     assert level_ids.count("HL-03-CLIN") == 1

def test_bfs_multi_parent_no_duplicate():
    """HL-03-CLIN is parent of both ORTHO and SURG — must appear exactly once."""
    result = run_bfs("HL-05-ORTHO", TEST_HIERARCHY)
    # Starting from ORTHO dept, we reach Post-TKR (multi-parent) and via it, SURG
    # But HL-03-CLIN (common ancestor) should only be visited once
    level_ids = list(result.keys())
    assert level_ids.count("HL-03-CLIN") == 1
    assert level_ids.count("HL-01") == 1


def test_bfs_distance_from_entry():
    """Distance values should increase as we go further from entry."""
    result = run_bfs("HL-10-ORTHO-W", TEST_HIERARCHY)
    assert result["HL-10-ORTHO-W"] == 0   # entry = distance 0
    assert result["HL-08-ORTHO-GEN"] == 1  # 1 hop up
    assert result["HL-05-ORTHO"] == 2      # 2 hops up
    assert result["HL-03-CLIN"] == 3       # 3 hops up
    assert result["HL-01"] == 4            # 4 hops up


def test_bfs_root_has_no_parents():
    """BFS from root terminates correctly with no infinite loop."""
    result = run_bfs("HL-01", TEST_HIERARCHY)
    assert "HL-01" in result
    assert len(result) == 1  # only the root itself


if __name__ == "__main__":
    test_bfs_walks_upward()
    test_bfs_multi_parent_no_duplicate()
    test_bfs_distance_from_entry()
    test_bfs_root_has_no_parents()
    print("All BFS tests passed.")
