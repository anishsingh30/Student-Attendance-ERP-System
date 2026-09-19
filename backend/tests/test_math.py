import pytest
from app.services.recovery_calculator import (
    calculate_percentage,
    calculate_consecutive_needed,
    calculate_max_missable,
    calculate_projected_attendance
)

def test_calculate_percentage():
    # 34 out of 50 classes is 68.0%
    assert calculate_percentage(34, 50) == 68.0
    # 0 conducted
    assert calculate_percentage(0, 0) == 100.0
    # Full attendance
    assert calculate_percentage(40, 40) == 100.0
    # Precision rounding
    assert calculate_percentage(1, 3) == 33.33

def test_consecutive_needed_example():
    """
    Section 6 Example:
    If a student has attended 34 out of 50 classes:
    Attendance = 68%.
    If the required threshold is 75%, calculate minimum consecutive future classes.
    Formula: (34 + x) / (50 + x) >= 0.75
    34 + x >= 37.5 + 0.75x
    0.25x >= 3.5
    x >= 14
    """
    needed = calculate_consecutive_needed(34, 50, target_pct=75.0)
    assert needed == 14

    # Verify: (34 + 14) / (50 + 14) = 48 / 64 = 0.75 (75.0%)
    assert calculate_percentage(34 + 14, 50 + 14) == 75.0
    # Verify: 13 classes would be: 47 / 63 = 74.60% (fails)
    assert calculate_percentage(34 + 13, 50 + 13) < 75.0

def test_consecutive_needed_edge_cases():
    # Already above 75% -> 0 needed
    assert calculate_consecutive_needed(40, 50, 75.0) == 0
    # Exactly at 75% -> 0 needed
    assert calculate_consecutive_needed(75, 100, 75.0) == 0
    # 0 conducted -> 0 needed
    assert calculate_consecutive_needed(0, 0, 75.0) == 0

def test_max_missable():
    # Attended 45 out of 50 = 90%. Target = 75%.
    # 45 / (50 + m) >= 0.75 => 45 >= 37.5 + 0.75m => 7.5 >= 0.75m => m <= 10
    m = calculate_max_missable(45, 50, 75.0)
    assert m == 10
    # If student misses 10 classes: 45 / 60 = 75.0%
    assert calculate_percentage(45, 50 + 10) == 75.0
    # If student misses 11 classes: 45 / 61 = 73.77% (drops below 75%)
    assert calculate_percentage(45, 50 + 11) < 75.0

def test_projected_attendance():
    # Current: 39 / 50 = 78%
    # Miss next 2 classes: 39 / 52 = 75.0%
    proj = calculate_projected_attendance(attended=39, conducted=50, attend_next=0, miss_next=2)
    assert proj == 75.0
