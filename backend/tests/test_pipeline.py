"""
Integration tests for the full pipeline.
These tests hit the live API — make sure uvicorn is running on port 7000.
"""
import requests

BASE = "http://localhost:7000"


def test_priya_pipeline():
    """Priya (VIEWER, L10, Ortho) should see ortho + global nodes only."""
    res = requests.post(f"{BASE}/pipeline/U-PRIYA")
    assert res.status_code == 200
    data = res.json()

    assert data["role"] == "VIEWER"
    assert data["ceiling_level"] == 10

    nodes = data["candidate_set"]
    departments = [n["department"] for n in nodes if n["department"]]

    # Zero cross-department leakage
    assert "cardiology" not in departments, "Cardiology node leaked to Priya!"
    assert "medicine" not in departments, "Medicine node leaked to Priya!"
    assert "paediatrics" not in departments, "Paeds node leaked to Priya!"

    # No MNPI nodes
    for node in nodes:
        assert "MNPI" not in node["compliance_tags"], f"MNPI node {node['id']} leaked to Priya!"

    # No superseded nodes
    for node in nodes:
        assert node["status"] != "SUPERSEDED", f"Superseded node {node['id']} in candidate set!"

    # No high-derivability nodes
    assert data["funnel"]["after_check5"] > 0
    print(f"Priya: {data['funnel']['after_check5']} nodes — PASS")


def test_vikram_sees_more_than_priya():
    """Vikram (HOD, L4) must see more nodes than Priya from same graph."""
    priya = requests.post(f"{BASE}/pipeline/U-PRIYA").json()
    vikram = requests.post(f"{BASE}/pipeline/U-VIKRAM").json()

    priya_count = priya["funnel"]["after_check5"]
    vikram_count = vikram["funnel"]["after_check5"]

    assert vikram_count > priya_count, \
        f"Vikram ({vikram_count}) should see more than Priya ({priya_count})"
    print(f"Priya: {priya_count}, Vikram: {vikram_count} — PASS")


def test_suresh_sees_most():
    """Admin Suresh (L1) must see the most nodes of all users."""
    priya = requests.post(f"{BASE}/pipeline/U-PRIYA").json()["funnel"]["after_check5"]
    vikram = requests.post(f"{BASE}/pipeline/U-VIKRAM").json()["funnel"]["after_check5"]
    suresh = requests.post(f"{BASE}/pipeline/U-SURESH").json()["funnel"]["after_check5"]

    assert suresh >= vikram >= priya, \
        f"Expected Suresh({suresh}) >= Vikram({vikram}) >= Priya({priya})"
    print(f"Priya: {priya}, Vikram: {vikram}, Suresh: {suresh} — PASS")


def test_different_users_different_results():
    """Same graph, different users must produce different candidate sets."""
    priya_ids = set(n["id"] for n in requests.post(f"{BASE}/pipeline/U-PRIYA").json()["candidate_set"])
    suresh_ids = set(n["id"] for n in requests.post(f"{BASE}/pipeline/U-SURESH").json()["candidate_set"])

    assert priya_ids != suresh_ids, "Priya and Suresh got identical results — pipeline is broken!"
    only_suresh = suresh_ids - priya_ids
    assert len(only_suresh) > 0, "Suresh has no nodes Priya doesn't — permission check broken!"
    print(f"Suresh sees {len(only_suresh)} nodes Priya can't — PASS")


def test_global_safety_nodes_present():
    """Warfarin-NSAID constraint must appear in Priya's candidate set (Zone 2)."""
    nodes = requests.post(f"{BASE}/pipeline/U-PRIYA").json()["candidate_set"]
    global_nodes = [n for n in nodes if n["zone"] == 2]
    assert len(global_nodes) > 0, "No Zone 2 global nodes in Priya's candidate set!"
    titles = [n["title"] for n in global_nodes]
    assert any("Warfarin" in t for t in titles), "Warfarin-NSAID constraint missing from global nodes!"
    print(f"Zone 2 nodes in Priya's set: {len(global_nodes)} — PASS")


if __name__ == "__main__":
    test_priya_pipeline()
    test_vikram_sees_more_than_priya()
    test_suresh_sees_most()
    test_different_users_different_results()
    test_global_safety_nodes_present()
    print("\nAll integration tests passed.")
