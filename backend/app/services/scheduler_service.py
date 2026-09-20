import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.config import settings
from app.models.system_setting import SystemSetting
from app.models.agent import AgentRun
from app.agents.attendance_agent import AttendanceMonitoringAgent

logger = logging.getLogger("attendance.scheduler")

class AttendanceScheduler:
    """
    Automated background scheduler for periodic attendance monitoring scans.
    Persists configuration in the database and enforces idempotent execution.
    """

    def __init__(self):
        self._task: Optional[asyncio.Task] = None
        self._is_executing = False
        self._last_run_time: Optional[datetime] = None
        self._next_run_time: Optional[datetime] = None

    @property
    def is_running(self) -> bool:
        return self._task is not None and not self._task.done()

    @property
    def interval_hours(self) -> int:
        return settings.SCHEDULER_INTERVAL_HOURS

    def _get_setting(self, db: Session, key: str, default: str) -> str:
        s = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        return s.value if s else default

    def _set_setting(self, db: Session, key: str, value: str, description: str = ""):
        s = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if not s:
            s = SystemSetting(key=key, value=value, description=description)
            db.add(s)
        else:
            s.value = value
            s.updated_at = datetime.now(timezone.utc)
        db.commit()

    def get_status(self, db: Session) -> Dict[str, Any]:
        enabled_val = self._get_setting(db, "scheduler_enabled", str(settings.SCHEDULER_ENABLED).lower())
        interval_val = self._get_setting(db, "scheduler_interval_hours", str(settings.SCHEDULER_INTERVAL_HOURS))

        enabled = enabled_val.lower() == "true"
        interval_hours = int(interval_val) if interval_val.isdigit() else 24

        last_run = db.query(AgentRun).order_by(AgentRun.start_time.desc()).first()
        last_time = last_run.start_time if last_run else self._last_run_time

        next_time = (last_time + timedelta(hours=interval_hours)) if last_time and enabled else None

        return {
            "enabled": enabled,
            "interval_hours": interval_hours,
            "is_currently_running": self._is_executing,
            "last_run_time": last_time.isoformat() if last_time else None,
            "next_scheduled_run": next_time.isoformat() if next_time else None,
            "scheduler_active": self._task is not None and not self._task.done()
        }

    def update_config(self, db: Session, enabled: bool, interval_hours: int) -> Dict[str, Any]:
        self._set_setting(db, "scheduler_enabled", str(enabled).lower(), "Automated attendance scan enabled flag")
        self._set_setting(db, "scheduler_interval_hours", str(max(1, interval_hours)), "Scan interval in hours")
        return self.get_status(db)

    def trigger_immediate_run(self, db: Session, triggered_by_user_id: Optional[int] = None) -> Dict[str, Any]:
        """Executes an immediate manual or scheduled run synchronously."""
        if self._is_executing:
            return {"status": "ALREADY_RUNNING", "message": "An agent monitoring cycle is already in progress."}

        self._is_executing = True
        try:
            agent = AttendanceMonitoringAgent(
                db=db,
                triggered_by_user_id=triggered_by_user_id,
                trigger_type="MANUAL" if triggered_by_user_id else "SCHEDULED"
            )
            result = agent.run()
            self._last_run_time = datetime.now(timezone.utc)
            return result
        finally:
            self._is_executing = False

    async def _loop(self):
        """Background coroutine that evaluates schedule intervals."""
        logger.info("Attendance Scheduler background loop started.")
        while True:
            try:
                await asyncio.sleep(60)  # Check every minute
                db = SessionLocal()
                try:
                    status = self.get_status(db)
                    if not status["enabled"] or self._is_executing:
                        continue

                    # Check if run is due
                    last_run = db.query(AgentRun).order_by(AgentRun.start_time.desc()).first()
                    interval = timedelta(hours=status["interval_hours"])
                    now_utc = datetime.now(timezone.utc)
                    last_start = last_run.start_time if last_run else None
                    if last_start and last_start.tzinfo is None:
                        last_start = last_start.replace(tzinfo=timezone.utc)

                    is_due = (last_start is None) or (now_utc - last_start >= interval)

                    if is_due:
                        logger.info("Triggering scheduled automated attendance scan.")
                        self._is_executing = True
                        try:
                            agent = AttendanceMonitoringAgent(db=db, triggered_by_user_id=None, trigger_type="SCHEDULED")
                            agent.run()
                            self._last_run_time = datetime.now(timezone.utc)
                        finally:
                            self._is_executing = False
                finally:
                    db.close()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Scheduler loop error: {e}")
                await asyncio.sleep(60)

    def start(self):
        if self._task is None or self._task.done():
            loop = asyncio.get_event_loop()
            self._task = loop.create_task(self._loop())
            logger.info("Started AttendanceScheduler task.")

    def stop(self):
        if self._task and not self._task.done():
            self._task.cancel()
            logger.info("Stopped AttendanceScheduler task.")

attendance_scheduler = AttendanceScheduler()
