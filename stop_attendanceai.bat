@echo off
setlocal enabledelayedexpansion

title AttendanceAI Stopper

echo ================================================================
echo           ATTENDANCEAI - DEVELOPMENT PROCESS STOPPER
echo ================================================================
echo.
echo Scanning for AttendanceAI services listening on ports 8000 and 5173...

set "STOPPED_COUNT=0"

:: 1. Terminate process on port 8000 (FastAPI / Uvicorn)
for /f "tokens=5" %%a in ('netstat -ano -p tcp ^| findstr ":8000" ^| findstr "LISTENING"') do (
    set "TARGET_PID=%%a"
    if defined TARGET_PID (
        if not "!TARGET_PID!"=="0" (
            echo  - Terminating backend process on port 8000 [PID !TARGET_PID!]
            taskkill /F /T /PID !TARGET_PID! >nul 2>&1
            set /a STOPPED_COUNT+=1
        )
    )
)

:: 2. Terminate process on port 5173 (React / Vite)
for /f "tokens=5" %%b in ('netstat -ano -p tcp ^| findstr ":5173" ^| findstr "LISTENING"') do (
    set "TARGET_PID=%%b"
    if defined TARGET_PID (
        if not "!TARGET_PID!"=="0" (
            echo  - Terminating frontend process on port 5173 [PID !TARGET_PID!]
            taskkill /F /T /PID !TARGET_PID! >nul 2>&1
            set /a STOPPED_COUNT+=1
        )
    )
)

echo.
if !STOPPED_COUNT! GTR 0 (
    echo [SUCCESS] AttendanceAI development services stopped cleanly.
) else (
    echo [INFO] No active AttendanceAI services were found on ports 8000 or 5173.
)
echo ================================================================
echo.
