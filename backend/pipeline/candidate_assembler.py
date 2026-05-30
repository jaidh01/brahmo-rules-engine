def assemble_candidate_set(nodes: list, bfs_distances: dict) -> list:
    """
    Annotates each surviving node with metadata for the downstream agent.
    """
    candidate_set = []

    for node in nodes:
        level_id = node["hierarchy_level_id"]
        distance = bfs_distances.get(level_id, 99)

        # Compression hint based on distance from entry point
        if distance <= 1:
            compression_hint = "FULL"
        elif distance == 2:
            compression_hint = "COMPRESSED"
        else:
            compression_hint = "CONSTRAINT_ONLY"

        candidate_set.append({
            "id": node["id"],
            "type": node["type"],
            "title": node["title"],
            "content": node["content"],
            "importance": float(node["importance"]),
            "zone": node["zone"],
            "hierarchy_level": node.get("_level_number"),
            "department": node.get("department"),
            "distance_from_entry": distance,
            "compression_hint": compression_hint,
            "status": node["status"],
            "compliance_tags": node.get("compliance_tags", [])
        })

    # Sort by importance descending
    candidate_set.sort(key=lambda x: x["importance"], reverse=True)

    return candidate_set