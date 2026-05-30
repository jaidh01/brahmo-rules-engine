# Each node has a name and a list of its parents
# This is our DAG (the hospital hierarchy)

graph = {
    "Hospital":           {"parents": []},
    "Clinical Division":  {"parents": ["Hospital"]},
    "Ortho Dept":         {"parents": ["Clinical Division"]},
    "Surgery Dept":       {"parents": ["Clinical Division"]},
    "Cardiology Dept":    {"parents": ["Clinical Division"]},
    "Ortho Ward":         {"parents": ["Ortho Dept"]},
    "TKR Unit":           {"parents": ["Ortho Dept"]},
    "Post-TKR Protocol":  {"parents": ["Ortho Dept", "Surgery Dept"]},  # two parents!
    "Cardiac ICU":        {"parents": ["Cardiology Dept"]},
}


from collections import deque

def bfs_upward(start_node, graph):
    visited = set()       # nodes we've already seen
    queue = deque()       # nodes waiting to be processed
    result = []           # all reachable nodes, in order found

    # Begin at the user's entry point
    queue.append(start_node)
    visited.add(start_node)

    while queue:
        current = queue.popleft()   # take the next node to process
        result.append(current)

        # Walk UP to each parent
        for parent in graph[current]["parents"]:
            if parent not in visited:       # skip if already seen
                visited.add(parent)
                queue.append(parent)

    return result


# Nurse Priya starts at Ortho Ward
priya_nodes = bfs_upward("Ortho Ward", graph)
print("\nPriya can reach:", priya_nodes)

# A cardiology nurse starts at Cardiac ICU
cardio_nodes = bfs_upward("Cardiac ICU", graph)
print("\n\nCardio nurse can reach:", cardio_nodes)

def bfs_upward_verbose(start_node, graph):
    visited = set()
    queue = deque()
    result = []

    queue.append(start_node)
    visited.add(start_node)

    while queue:
        current = queue.popleft()
        result.append(current)

        for parent in graph[current]["parents"]:
            if parent not in visited:
                print(f"  → Adding '{parent}' to queue (found via '{current}')")
                visited.add(parent)
                queue.append(parent)
            else:
                print(f"  ✗ Skipping '{parent}' — already visited")

    return result

bfs_upward_verbose("TKR Unit", graph)