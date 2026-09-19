import pytest
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token

def test_password_hashing():
    pw = "mysecret123"
    hashed = get_password_hash(pw)
    assert hashed != pw
    assert verify_password(pw, hashed) is True
    assert verify_password("wrongpassword", hashed) is False

def test_jwt_token_flow():
    payload = {"sub": "test@college.edu", "role": "student", "id": 42}
    token = create_access_token(payload)
    assert isinstance(token, str)
    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == "test@college.edu"
    assert decoded["role"] == "student"
    assert decoded["id"] == 42
