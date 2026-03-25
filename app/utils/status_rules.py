TANKER_STATUS_TRANSITIONS = {
    "available": {"assigned"},
    "assigned": {"loading", "available"},
    "loading": {"delivering", "available"},
    "delivering": {"arrived", "available"},
    "arrived": {"completed", "available"},
    "completed": {"available"},
}

BATCH_STATUS_TRANSITIONS = {
    "forming": {"ready"},
    "ready": {"assigned"},
    "assigned": {"loading", "ready"},
    "loading": {"delivering", "ready"},
    "delivering": {"arrived", "ready"},
    "arrived": {"completed", "ready"},
    "completed": set(),
}


def can_transition(current_status: str, next_status: str, transitions: dict[str, set[str]]) -> bool:
    return next_status in transitions.get(current_status, set())


def ensure_valid_transition(
    current_status: str,
    next_status: str,
    transitions: dict[str, set[str]],
    entity_name: str = "Entity",
) -> None:
    if not can_transition(current_status, next_status, transitions):
        allowed = sorted(transitions.get(current_status, set()))
        raise ValueError(
            f"{entity_name} cannot move from '{current_status}' to '{next_status}'. "
            f"Allowed next states: {allowed if allowed else 'none'}"
        )

TANKER_STATUS_TRANSITIONS = {
    "available": {"assigned"},
    "assigned": {"loading", "available"},
    "loading": {"delivering", "available"},
    "delivering": {"arrived", "available"},
    "arrived": {"completed", "available"},
    "completed": {"available"},
}

BATCH_STATUS_TRANSITIONS = {
    "forming": {"ready"},
    "ready": {"assigned"},
    "assigned": {"loading", "ready"},
    "loading": {"delivering", "ready"},
    "delivering": {"arrived", "ready"},
    "arrived": {"completed", "ready"},
    "completed": set(),
}


def can_transition(current_status: str, next_status: str, transitions: dict[str, set[str]]) -> bool:
    return next_status in transitions.get(current_status, set())


def ensure_valid_transition(
    current_status: str,
    next_status: str,
    transitions: dict[str, set[str]],
    entity_name: str = "Entity",
) -> None:
    if not can_transition(current_status, next_status, transitions):
        allowed = sorted(transitions.get(current_status, set()))
        raise ValueError(
            f"{entity_name} cannot move from '{current_status}' to '{next_status}'. "
            f"Allowed next states: {allowed if allowed else 'none'}"
        )