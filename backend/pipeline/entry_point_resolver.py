def resolve_entry_point(user: dict, hierarchy_levels: list) -> dict:
    """
    Maps a user's department to their DAG entry point (leaf node).
    The entry point is the deepest hierarchy level matching the user's department.

    For ADMIN: entry point is the root (Level 1) — but BFS is skipped entirely.
    For all others: deepest level in their department.
    """
    dept_levels = [
        lvl for lvl in hierarchy_levels
        if lvl.get("department") == user["department"]
    ]

    if not dept_levels:
        # Fallback: use root node (Level 1)
        return next(lvl for lvl in hierarchy_levels if lvl["level_number"] == 1)

    # Pick the deepest level (highest level_number) for this department
    return max(dept_levels, key=lambda x: x["level_number"])
