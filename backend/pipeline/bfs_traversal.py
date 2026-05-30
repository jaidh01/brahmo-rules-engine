from collections import deque

def run_bfs(entry_level_id: str, hierarchy_levels: list) -> dict:
    """
    Walks UP the DAG from the user's entry point.
    Returns: {level_id: distance_from_entry}
    """
    # Build a lookup: level_id -> level data
    level_map = {lvl["id"]: lvl for lvl in hierarchy_levels}

    visited = {}   # level_id -> distance
    queue = deque()

    queue.append((entry_level_id, 0))
    visited[entry_level_id] = 0

    while queue:
        current_id, distance = queue.popleft()
        current = level_map.get(current_id)

        if not current:
            continue

        # Walk up to each parent
        for parent_id in current.get("parent_ids", []):
            if parent_id not in visited:
                visited[parent_id] = distance + 1
                queue.append((parent_id, distance + 1))

    return visited  # {level_id: distance}