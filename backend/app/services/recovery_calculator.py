import math

def calculate_percentage(attended: int, conducted: int) -> float:
    """
    Calculate deterministic attendance percentage rounded to 2 decimal places.
    Returns 100.0 if no classes have been conducted yet.
    """
    if conducted <= 0:
        return 100.0
    pct = (attended / conducted) * 100.0
    return round(pct, 2)

def calculate_consecutive_needed(attended: int, conducted: int, target_pct: float = 75.0) -> int:
    """
    Deterministic calculation for minimum consecutive future classes a student
    must attend to reach target_pct (e.g. 75%).

    Mathematical formulation:
        (attended + x) / (conducted + x) >= target
        attended + x >= target * conducted + target * x
        x * (1 - target) >= target * conducted - attended
        x = ceil((target * conducted - attended) / (1 - target))

    Args:
        attended: Total classes attended
        conducted: Total classes conducted
        target_pct: Threshold percentage (e.g. 75.0 for 75%)

    Returns:
        Minimum integer consecutive classes needed (0 if already >= target).
    """
    if conducted <= 0:
        return 0

    target = target_pct / 100.0
    current_pct = (attended / conducted) * 100.0
    if current_pct >= target_pct:
        return 0

    if target >= 1.0:
        # If target is 100% and student already missed a class, 100% can never be strictly reached
        return -1

    numerator = (target * conducted) - attended
    denominator = 1.0 - target

    classes_needed = math.ceil(numerator / denominator)
    return max(0, classes_needed)

def calculate_max_missable(attended: int, conducted: int, target_pct: float = 75.0) -> int:
    """
    Deterministic calculation for maximum consecutive future classes a student
    can afford to miss without dropping below target_pct.

    Mathematical formulation:
        attended / (conducted + m) >= target
        attended >= target * conducted + target * m
        target * m <= attended - target * conducted
        m = floor((attended - target * conducted) / target)

    Returns:
        Integer maximum classes that can be missed (0 if already at or below target).
    """
    if conducted <= 0:
        return 0

    target = target_pct / 100.0
    current_pct = (attended / conducted) * 100.0
    if current_pct < target_pct:
        return 0

    numerator = attended - (target * conducted)
    if numerator <= 0:
        return 0

    classes_missable = math.floor(numerator / target)
    return max(0, classes_missable)

def calculate_projected_attendance(
    attended: int, 
    conducted: int, 
    attend_next: int = 0, 
    miss_next: int = 0
) -> float:
    """
    Deterministic projection when attending 'attend_next' and missing 'miss_next' classes.
    """
    new_attended = attended + max(0, attend_next)
    new_conducted = conducted + max(0, attend_next) + max(0, miss_next)
    if new_conducted <= 0:
        return 100.0
    pct = (new_attended / new_conducted) * 100.0
    return round(pct, 2)

def simulate_attendance(
    current_attended: int,
    current_conducted: int,
    future_attended: int = 0,
    future_missed: int = 0,
    target_pct: float = 75.0
) -> dict:
    """
    Simulates projected attendance and risk level after future attended/missed classes.
    """
    proj_pct = calculate_projected_attendance(
        current_attended, current_conducted, future_attended, future_missed
    )
    proj_att = current_attended + max(0, future_attended)
    proj_cond = current_conducted + max(0, future_attended) + max(0, future_missed)

    risk = "GREEN"
    if proj_pct < 65.0:
        risk = "RED"
    elif proj_pct < 75.0:
        risk = "ORANGE"
    elif proj_pct < 80.0:
        risk = "YELLOW"

    return {
        "projected_percentage": proj_pct,
        "projected_attended": proj_att,
        "projected_conducted": proj_cond,
        "meets_threshold": proj_pct >= target_pct,
        "projected_risk": risk
    }
