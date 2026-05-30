def compile_permissions(user: dict) -> dict:
    """
    Builds an O(1) lookup of what levels this user can read.
    Called ONCE at session start.
    
    Returns: {level_number: {"can_read": bool}}
    """
    role = user["role"]
    ceiling = user["ceiling_level"]
    permissions = {}

    for level in range(1, 16):  # levels 1-15
        if role == "ADMIN":
            # Admin sees everything
            can_read = True
        elif role == "HOD":
            # HOD sees everything at or below their ceiling
            can_read = True
        elif role in ("VIEWER", "EDITOR", "QUALITY", "AUDITOR"):
            # Can only read nodes at their ceiling level or deeper (higher number = deeper)
            can_read = level >= ceiling
        else:
            can_read = False

        permissions[level] = {"can_read": can_read}

    return permissions