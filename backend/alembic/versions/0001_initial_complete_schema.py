"""Initial complete schema baseline

Revision ID: 0001_initial_complete_schema
Revises: 
Create Date: 2026-09-19 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0001_initial_complete_schema'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False, server_default='student'),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('profile_photo_url', sa.String(length=500), nullable=True),
        sa.Column('must_change_password', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('password_reset_at', sa.DateTime(), nullable=True),
        sa.Column('password_changed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_users_id', 'users', ['id'], unique=False)
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # 2. students
    op.create_table(
        'students',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('roll_number', sa.String(length=50), nullable=False),
        sa.Column('department', sa.String(length=100), nullable=False),
        sa.Column('semester', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('section', sa.String(length=10), nullable=False, server_default='A'),
        sa.Column('batch', sa.String(length=50), nullable=False, server_default='2022-2026'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index('ix_students_id', 'students', ['id'], unique=False)
    op.create_index('ix_students_roll_number', 'students', ['roll_number'], unique=True)

    # 3. faculty
    op.create_table(
        'faculty',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('employee_id', sa.String(length=50), nullable=False),
        sa.Column('department', sa.String(length=100), nullable=False),
        sa.Column('designation', sa.String(length=100), nullable=False, server_default='Assistant Professor'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index('ix_faculty_id', 'faculty', ['id'], unique=False)
    op.create_index('ix_faculty_employee_id', 'faculty', ['employee_id'], unique=True)

    # 4. subjects
    op.create_table(
        'subjects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('department', sa.String(length=100), nullable=False),
        sa.Column('semester', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('total_classes_scheduled', sa.Integer(), nullable=True, server_default='50'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('credits', sa.Integer(), nullable=True, server_default='3'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_subjects_id', 'subjects', ['id'], unique=False)
    op.create_index('ix_subjects_code', 'subjects', ['code'], unique=True)

    # 5. faculty_subjects
    op.create_table(
        'faculty_subjects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('faculty_id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['faculty_id'], ['faculty.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_faculty_subjects_id', 'faculty_subjects', ['id'], unique=False)

    # 6. attendance
    op.create_table(
        'attendance',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('marked_by', sa.Integer(), nullable=True),
        sa.Column('notes', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['marked_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('student_id', 'subject_id', 'date', name='uix_student_subject_date')
    )
    op.create_index('ix_attendance_id', 'attendance', ['id'], unique=False)
    op.create_index('ix_attendance_student_id', 'attendance', ['student_id'], unique=False)
    op.create_index('ix_attendance_subject_id', 'attendance', ['subject_id'], unique=False)
    op.create_index('ix_attendance_date', 'attendance', ['date'], unique=False)

    # 7. attendance_corrections
    op.create_table(
        'attendance_corrections',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('attendance_id', sa.Integer(), nullable=False),
        sa.Column('corrected_by_user_id', sa.Integer(), nullable=True),
        sa.Column('previous_status', sa.String(length=20), nullable=False),
        sa.Column('new_status', sa.String(length=20), nullable=False),
        sa.Column('reason', sa.String(length=255), nullable=False),
        sa.Column('corrected_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['attendance_id'], ['attendance.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['corrected_by_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_attendance_corrections_id', 'attendance_corrections', ['id'], unique=False)
    op.create_index('ix_attendance_corrections_attendance_id', 'attendance_corrections', ['attendance_id'], unique=False)

    # 8. attendance_thresholds
    op.create_table(
        'attendance_thresholds',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('green_min', sa.Float(), nullable=False, server_default='80.0'),
        sa.Column('yellow_min', sa.Float(), nullable=False, server_default='75.0'),
        sa.Column('orange_min', sa.Float(), nullable=False, server_default='65.0'),
        sa.Column('red_max', sa.Float(), nullable=False, server_default='65.0'),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_attendance_thresholds_id', 'attendance_thresholds', ['id'], unique=False)

    # 9. alerts (with partial unique index for idempotency on active alerts)
    op.create_table(
        'alerts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('risk_level', sa.String(length=20), nullable=False),
        sa.Column('current_percentage', sa.Float(), nullable=False),
        sa.Column('required_percentage', sa.Float(), nullable=False, server_default='75.0'),
        sa.Column('classes_attended', sa.Integer(), nullable=False),
        sa.Column('classes_conducted', sa.Integer(), nullable=False),
        sa.Column('classes_required', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=False),
        sa.Column('recommended_action', sa.Text(), nullable=False),
        sa.Column('lifecycle_status', sa.String(length=30), nullable=False, server_default='NEW'),
        sa.Column('is_resolved', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('assigned_to_user_id', sa.Integer(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('resolved_by_user_id', sa.Integer(), nullable=True),
        sa.Column('dismiss_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['student_id'], ['students.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assigned_to_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['resolved_by_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_alerts_id', 'alerts', ['id'], unique=False)
    op.create_index('ix_alerts_student_id', 'alerts', ['student_id'], unique=False)
    op.create_index('ix_alerts_subject_id', 'alerts', ['subject_id'], unique=False)
    op.create_index('ix_alerts_lifecycle_status', 'alerts', ['lifecycle_status'], unique=False)
    op.create_index('ix_alerts_is_resolved', 'alerts', ['is_resolved'], unique=False)
    op.create_index('ix_alerts_created_at', 'alerts', ['created_at'], unique=False)
    try:
        op.create_index(
            'uix_active_student_subject_alert',
            'alerts',
            ['student_id', 'subject_id'],
            unique=True,
            postgresql_where=sa.text('is_resolved = false'),
            sqlite_where=sa.text('is_resolved = 0')
        )
    except Exception:
        pass

    # 10. alert_interventions
    op.create_table(
        'alert_interventions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('alert_id', sa.Integer(), nullable=False),
        sa.Column('action_type', sa.String(length=50), nullable=False),
        sa.Column('previous_status', sa.String(length=30), nullable=True),
        sa.Column('new_status', sa.String(length=30), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('attendance_before', sa.Float(), nullable=True),
        sa.Column('attendance_after', sa.Float(), nullable=True),
        sa.Column('outcome_status', sa.String(length=30), nullable=False, server_default='PENDING'),
        sa.Column('performed_by_user_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['alert_id'], ['alerts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['performed_by_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_alert_interventions_id', 'alert_interventions', ['id'], unique=False)
    op.create_index('ix_alert_interventions_alert_id', 'alert_interventions', ['alert_id'], unique=False)
    op.create_index('ix_alert_interventions_outcome_status', 'alert_interventions', ['outcome_status'], unique=False)
    op.create_index('ix_alert_interventions_created_at', 'alert_interventions', ['created_at'], unique=False)

    # 11. notifications
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('alert_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('notification_type', sa.String(length=50), nullable=False, server_default='INFO'),
        sa.Column('channel', sa.String(length=50), nullable=False, server_default='IN_APP'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='SENT'),
        sa.Column('retry_count', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('sent_at', sa.DateTime(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=True, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['alert_id'], ['alerts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_notifications_id', 'notifications', ['id'], unique=False)
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'], unique=False)
    op.create_index('ix_notifications_created_at', 'notifications', ['created_at'], unique=False)

    # 11. agent_runs
    op.create_table(
        'agent_runs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('triggered_by', sa.Integer(), nullable=True),
        sa.Column('trigger_type', sa.String(length=50), nullable=False, server_default='MANUAL'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='RUNNING'),
        sa.Column('current_stage', sa.String(length=100), nullable=False, server_default='INITIALIZING'),
        sa.Column('start_time', sa.DateTime(), nullable=True),
        sa.Column('end_time', sa.DateTime(), nullable=True),
        sa.Column('students_analyzed', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('at_risk_found', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('alerts_created', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('notifications_sent', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('tool_executions', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('errors', sa.Text(), nullable=True),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['triggered_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_agent_runs_id', 'agent_runs', ['id'], unique=False)

    # 12. agent_logs
    op.create_table(
        'agent_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('run_id', sa.Integer(), nullable=False),
        sa.Column('step_number', sa.Integer(), nullable=False),
        sa.Column('step_name', sa.String(length=100), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='INFO'),
        sa.Column('log_message', sa.Text(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['run_id'], ['agent_runs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_agent_logs_id', 'agent_logs', ['id'], unique=False)
    op.create_index('ix_agent_logs_run_id', 'agent_logs', ['run_id'], unique=False)

    # 13. audit_logs
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('username', sa.String(length=255), nullable=True),
        sa.Column('user_role', sa.String(length=50), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('resource', sa.String(length=255), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='SUCCESS'),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_audit_logs_id', 'audit_logs', ['id'], unique=False)
    op.create_index('ix_audit_logs_user_id', 'audit_logs', ['user_id'], unique=False)
    op.create_index('ix_audit_logs_action', 'audit_logs', ['action'], unique=False)
    op.create_index('ix_audit_logs_timestamp', 'audit_logs', ['timestamp'], unique=False)

    # 14. system_settings
    op.create_table(
        'system_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('key', sa.String(length=100), nullable=False),
        sa.Column('value', sa.Text(), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('is_encrypted', sa.Boolean(), nullable=True, server_default='0'),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_system_settings_id', 'system_settings', ['id'], unique=False)
    op.create_index('ix_system_settings_key', 'system_settings', ['key'], unique=True)

def downgrade() -> None:
    op.drop_table('system_settings')
    op.drop_table('audit_logs')
    op.drop_table('agent_logs')
    op.drop_table('agent_runs')
    op.drop_table('notifications')
    op.drop_table('alert_interventions')
    op.drop_table('alerts')
    op.drop_table('attendance_thresholds')
    op.drop_table('attendance_corrections')
    op.drop_table('attendance')
    op.drop_table('faculty_subjects')
    op.drop_table('subjects')
    op.drop_table('faculty')
    op.drop_table('students')
    op.drop_table('users')
