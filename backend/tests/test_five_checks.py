"""
Tests for the 5-check sequential filter.
Verifies each check independently and that they run in correct order.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from pipeline.five_check_filter import run_five_checks
from pipeline.permission_compiler import compile_permissions

BASE_NODE = {
    "id": "TEST-01", "org_id": "supra", "type": "CONSTRAINT",
    "title": "Test Node", "content": "Test content",
    "importance": 0.9, "zone": 1, "status": "ACTIVE",
    "derivability_score": 0.1, "compliance_tags": [],
    "_level_number": 10, "department": "ortho",
    "hierarchy_level_id": "HL-10-ORTHO-W", "valid_until": None,
}

PRIYA = {
    "id": "U-PRIYA", "org_id": "supra", "role": "VIEWER",
    "ceiling_level": 10, "compliance_clearance": [],
}


def make_node(**kwargs):
    return {**BASE_NODE, **kwargs}


def test_check1_isolation():
    """Nodes from a different org must be excluded."""
    nodes = [BASE_NODE, make_node(id="OTHER", org_id="other_hospital")]
    perms = compile_permissions(PRIYA)
    result = run_five_checks(nodes, PRIYA, perms)
    ids = [n["id"] for n in result["nodes"]]
    assert "TEST-01" in ids
    assert "OTHER" not in ids


def test_check2_compliance_mnpi():
    """MNPI-tagged node must be excluded for user without clearance."""
    nodes = [BASE_NODE, make_node(id="MNPI-NODE", compliance_tags=["MNPI"])]
    perms = compile_permissions(PRIYA)
    result = run_five_checks(nodes, PRIYA, perms)
    ids = [n["id"] for n in result["nodes"]]
    assert "TEST-01" in ids
    assert "MNPI-NODE" not in ids


def test_check2_compliance_cleared_user():
    """MNPI node visible to user WITH clearance."""
    user_with_clearance = {**PRIYA, "compliance_clearance": ["MNPI"]}
    nodes = [make_node(id="MNPI-NODE", compliance_tags=["MNPI"])]
    perms = compile_permissions(user_with_clearance)
    result = run_five_checks(nodes, user_with_clearance, perms)
    ids = [n["id"] for n in result["nodes"]]
    assert "MNPI-NODE" in ids


def test_check3_permission_ceiling():
    """Node above user ceiling (lower level_number) must be excluded for VIEWER."""
    hod_node = make_node(id="HOD-NODE", _level_number=4)  # level 4 < Priya's ceiling 10
    nodes = [BASE_NODE, hod_node]
    perms = compile_permissions(PRIYA)
    result = run_five_checks(nodes, PRIYA, perms)
    ids = [n["id"] for n in result["nodes"]]
    assert "TEST-01" in ids
    assert "HOD-NODE" not in ids


def test_check4_temporal_superseded():
    """Superseded nodes must be excluded."""
    old_node = make_node(id="OLD-NODE", status="SUPERSEDED")
    nodes = [BASE_NODE, old_node]
    perms = compile_permissions(PRIYA)
    result = run_five_checks(nodes, PRIYA, perms)
    ids = [n["id"] for n in result["nodes"]]
    assert "TEST-01" in ids
    assert "OLD-NODE" not in ids


def test_check5_derivability():
    """High-derivability nodes (score >= 0.7) must be excluded."""
    generic_node = make_node(id="GENERIC", derivability_score=0.95)
    nodes = [BASE_NODE, generic_node]
    perms = compile_permissions(PRIYA)
    result = run_five_checks(nodes, PRIYA, perms)
    ids = [n["id"] for n in result["nodes"]]
    assert "TEST-01" in ids
    assert "GENERIC" not in ids


def test_checks_are_sequential():
    """Count after each check must be <= count after previous check."""
    nodes = [
        BASE_NODE,
        make_node(id="N2", compliance_tags=["MNPI"]),
        make_node(id="N3", _level_number=4),
        make_node(id="N4", status="SUPERSEDED"),
        make_node(id="N5", derivability_score=0.9),
    ]
    perms = compile_permissions(PRIYA)
    result = run_five_checks(nodes, PRIYA, perms)
    counts = [
        result["after_check1"], result["after_check2"],
        result["after_check3"], result["after_check4"], result["after_check5"],
    ]
    for i in range(1, len(counts)):
        assert counts[i] <= counts[i - 1], f"Check {i+1} count increased — checks not sequential!"


if __name__ == "__main__":
    test_check1_isolation()
    test_check2_compliance_mnpi()
    test_check2_compliance_cleared_user()
    test_check3_permission_ceiling()
    test_check4_temporal_superseded()
    test_check5_derivability()
    test_checks_are_sequential()
    print("All 5-check filter tests passed.")
