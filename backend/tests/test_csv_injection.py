import pytest
from app.core.csv_sanitizer import sanitize_csv_cell, sanitize_csv_row, is_safe_pure_number

def test_csv_formula_injection_sanitization():
    """Verify that dangerous spreadsheet formula prefixes are safely neutralized with a single quote."""
    dangerous_inputs = [
        "=1+1",
        "=SUM(A1:A10)",
        "=cmd|' /C calc'!A0",
        "@SUM(B1:B5)",
        "+cmd|' /C notepad'!A0",
        "-2+3+cmd|' /C calc'!A0",
        "\t=1+1",
        "\r=cmd|' /C calc'!A0",
        "=HYPERLINK('http://malicious.site', 'Click Here')",
        "|cmd|' /C calc'!A0"
    ]

    for payload in dangerous_inputs:
        sanitized = sanitize_csv_cell(payload)
        assert sanitized.startswith("'"), f"Failed to neutralize dangerous formula: {payload} -> {sanitized}"

def test_csv_legitimate_data_preserved():
    """Verify that legitimate negative numbers, integers, floats, and strings are preserved without unnecessary quoting."""
    safe_inputs = [
        -5,
        -10.5,
        42,
        3.14,
        "-5",
        "-12.5",
        "+10",
        "Rahul Verma",
        "CS501",
        "Computer Networks",
        "PRESENT",
        "ABSENT"
    ]

    for val in safe_inputs:
        sanitized = sanitize_csv_cell(val)
        if isinstance(val, (int, float)):
            assert sanitized == val
        elif is_safe_pure_number(str(val)):
            assert sanitized == val
        else:
            assert sanitized == val

def test_csv_row_sanitization():
    """Verify complete row sanitization."""
    row = ["CS2022-001", "=1+1", -5, "@SUM(A1:B1)", "PRESENT"]
    sanitized_row = sanitize_csv_row(row)
    assert sanitized_row[0] == "CS2022-001"
    assert sanitized_row[1] == "'=1+1"
    assert sanitized_row[2] == -5
    assert sanitized_row[3] == "'@SUM(A1:B1)"
    assert sanitized_row[4] == "PRESENT"
