"""
Vercel Serverless Function entrypoint for AttendanceAI FastAPI backend.
Configures sys.path so the 'backend' package and 'app.*' modules resolve seamlessly.
"""
import sys
import os

# Append 'backend' directory to Python search path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, "..", "backend"))

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
