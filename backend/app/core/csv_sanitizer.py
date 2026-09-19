import re
from typing import Any, List

# Leading characters that can trigger formula execution in Microsoft Excel, LibreOffice Calc, or Google Sheets
FORMULA_TRIGGERS = ("=", "+", "-", "@", "\t", "\r", "|")

# Pattern to recognize legitimate pure integer or floating-point numbers in string form
PURE_NUMBER_PATTERN = re.compile(r"^[+-]?\d+(?:\.\d+)?$")

def is_safe_pure_number(s: str) -> bool:
    """Checks if a string represents a pure numeric literal (e.g. '-5', '+10.5', '42')."""
    return bool(PURE_NUMBER_PATTERN.match(s.strip()))

def sanitize_csv_cell(val: Any) -> Any:
    """
    Sanitizes a single CSV cell value against CSV Formula Injection (CWE-1236).
    If a string begins with dangerous formula prefixes (=, +, -, @, tab, newline, pipe),
    it is prepended with a single quote (') to force spreadsheet processors
    to interpret the content purely as text/string rather than an executable formula.
    
    Legitimate integers, floats, booleans, and pure numeric strings (e.g. '-5', '+3.14')
    are preserved without unnecessary quoting.
    """
    if val is None:
        return ""
    
    if isinstance(val, (int, float, bool)):
        return val

    s = str(val).strip()
    if not s:
        return val

    # If it begins with a trigger character
    if s[0] in FORMULA_TRIGGERS:
        # Check if it is a legitimate pure numeric value (like -5 or +10)
        # Note: '=' and '@' and '|' and tabs are always treated as formula injection
        if s[0] in ("+", "-") and is_safe_pure_number(s):
            return val
        
        # Neutralize dangerous formula injection
        return f"'{s}"

    return val

def sanitize_csv_row(row: List[Any]) -> List[Any]:
    """Sanitizes an entire row of CSV values."""
    return [sanitize_csv_cell(cell) for cell in row]

