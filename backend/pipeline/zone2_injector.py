def inject_zone2(reachable_level_ids: set, all_nodes: list) -> list:
    """
    Adds GLOBAL (zone=2) nodes to the reachable set.
    These bypass BFS but still go through all 5 checks.
    """
    zone2_nodes = [
        node for node in all_nodes
        if node["zone"] == 2
    ]

    # Add their level IDs to reachable set
    for node in zone2_nodes:
        reachable_level_ids.add(node["hierarchy_level_id"])

    return zone2_nodes