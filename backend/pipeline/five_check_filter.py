from datetime import datetime, timezone

def run_five_checks(nodes: list, user: dict, permissions: dict) -> dict:
    """
    Runs 5 sequential checks. Output of each check = input to next.
    Returns counts at each stage + final passing nodes.
    """
    # --- Check 1: Isolation ---
    after_check1 = [n for n in nodes if n["org_id"] == user["org_id"]]

    # --- Check 2: Compliance ---
    user_clearance = set(user.get("compliance_clearance", []))
    def compliance_pass(node):
        node_tags = set(node.get("compliance_tags", []))
        # If node has restricted tags, user must have clearance for ALL of them
        restricted = node_tags - user_clearance
        return len(restricted) == 0

    after_check2 = [n for n in after_check1 if compliance_pass(n)]

    # --- Check 3: Permission ---
    # def permission_pass(node):
    #     level_id = node["hierarchy_level_id"]
    #     # Find level_number for this node's level
    #     level_number = node.get("_level_number")
    #     if level_number is None:
    #         return False
    #     return permissions.get(level_number, {}).get("can_read", False)

    def permission_pass(node):
        # Zone 2 (global) nodes bypass permission ceiling — they apply to ALL users
        if node["zone"] == 2:
            return True
        level_number = node.get("_level_number")
        if level_number is None:
            return False
        return permissions.get(level_number, {}).get("can_read", False)

    after_check3 = [n for n in after_check2 if permission_pass(n)]

    # --- Check 4: Temporal ---
    now = datetime.now(timezone.utc)
    def temporal_pass(node):
        if node["status"] in ("SUPERSEDED", "EXPIRED"):
            return False
        valid_until = node.get("valid_until")
        if valid_until:
            # Parse and compare
            if isinstance(valid_until, str):
                expiry = datetime.fromisoformat(valid_until.replace("Z", "+00:00"))
            else:
                expiry = valid_until
            if expiry < now:
                return False
        return True

    after_check4 = [n for n in after_check3 if temporal_pass(n)]

    # --- Check 5: Derivability ---
    threshold = 0.7
    after_check5 = [n for n in after_check4 if float(n["derivability_score"]) < threshold]

    return {
        "after_check1": len(after_check1),
        "after_check2": len(after_check2),
        "after_check3": len(after_check3),
        "after_check4": len(after_check4),
        "after_check5": len(after_check5),
        "nodes": after_check5
    }