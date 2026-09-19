export type UserRole = 'student' | 'faculty' | 'admin';
export type RiskLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  profile_photo_url?: string | null;
  must_change_password?: boolean;
  created_at: string;
  profile_id?: number | null;
  roll_number?: string | null;
  employee_id?: string | null;
  department?: string | null;
  semester?: number | null;
  access_token?: string | null;
}


export interface SubjectAttendanceDetail {
  subject_id: number;
  subject_code: string;
  subject_name: string;
  faculty_name?: string | null;
  classes_attended: number;
  classes_conducted: number;
  percentage: number;
  risk_level: RiskLevel;
  required_threshold: number;
  is_at_risk: boolean;
  consecutive_classes_needed: number;
  max_classes_can_miss: number;
  status_label: string;
}

export interface AttendanceTrendPoint {
  label: string;
  percentage: number;
  attended: number;
  conducted: number;
}

export interface StudentDashboardData {
  student_id: number;
  user_id: number;
  full_name: string;
  roll_number: string;
  department: string;
  semester: number;
  overall_percentage: number;
  overall_risk_level: RiskLevel;
  total_subjects: number;
  subjects_below_threshold: number;
  critical_subjects_count: number;
  active_alerts_count: number;
  unread_notifications_count: number;
  subjects: SubjectAttendanceDetail[];
  attendance_trends: AttendanceTrendPoint[];
}

export interface AttendanceRecord {
  id: number;
  student_id: number;
  student_name?: string | null;
  roll_number?: string | null;
  subject_id: number;
  subject_name?: string | null;
  subject_code?: string | null;
  date: string;
  status: 'PRESENT' | 'ABSENT';
  notes?: string | null;
  created_at: string;
}

export interface WhatIfResponse {
  student_id: number;
  student_name: string;
  subject_id: number;
  subject_code: string;
  subject_name: string;
  current_attended: number;
  current_conducted: number;
  current_percentage: number;
  current_risk_level: RiskLevel;
  simulated_classes_attended: number;
  simulated_classes_conducted: number;
  projected_percentage: number;
  projected_risk_level: RiskLevel;
  percentage_change: number;
  required_threshold: number;
  is_above_threshold: boolean;
  status_summary: string;
  ai_explanation: string;
}

export interface AlertItem {
  id: number;
  student_id: number;
  student_name?: string | null;
  roll_number?: string | null;
  subject_id: number;
  subject_name?: string | null;
  subject_code?: string | null;
  risk_level: RiskLevel;
  current_percentage: number;
  required_percentage: number;
  classes_attended: number;
  classes_conducted: number;
  classes_required: number;
  title: string;
  explanation: string;
  recommended_action: string;
  lifecycle_status: string; // NEW, ACKNOWLEDGED, IN_PROGRESS, RESOLVED, DISMISSED, ESCALATED
  is_resolved: boolean;
  resolved_at?: string | null;
  resolved_by_user_id?: number | null;
  created_at: string;
}


export interface NotificationItem {
  id: number;
  user_id: number;
  alert_id?: number | null;
  title: string;
  message: string;
  notification_type: 'WARNING' | 'CRITICAL' | 'INFO' | 'RECOVERY';
  channel?: 'IN_APP' | 'EMAIL' | 'SMS' | 'WHATSAPP';
  status?: 'QUEUED' | 'SENT' | 'FAILED' | 'READ';
  retry_count?: number;
  sent_at?: string | null;
  error_message?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface SchedulerStatus {
  enabled: boolean;
  interval_hours: number;
  is_currently_running: boolean;
  last_run_time: string | null;
  next_scheduled_run: string | null;
  scheduler_active: boolean;
}

export interface MLMetrics {
  model_name: string;
  version: string;
  status: string;
  trained_at: string;
  evaluation_metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
  };
  confusion_matrix: {
    labels: string[];
    matrix: number[][];
  };
  feature_importances: Record<string, number>;
  training_samples: number;
  test_samples: number;
}

export interface AgentLogItem {
  id: number;
  run_id: number;
  step_number: number;
  step_name: string;
  status: string;
  log_message: string;
  timestamp: string;
}

export interface AgentRunItem {
  id: number;
  triggered_by?: number | null;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  start_time: string;
  end_time?: string | null;
  students_analyzed: number;
  at_risk_found: number;
  alerts_created: number;
  notifications_sent: number;
  summary?: string | null;
  logs?: AgentLogItem[];
}

export interface AuditLogItem {
  id: number;
  user_id?: number | null;
  username?: string | null;
  user_role?: string | null;
  action: string;
  resource: string;
  status: string;
  details?: string | null;
  timestamp: string;
}

export interface ThresholdConfig {
  id: number;
  green_min: number;
  yellow_min: number;
  orange_min: number;
  red_max: number;
  is_active: boolean;
  updated_at: string;
}

export interface CSVImportResult {
  records_processed: number;
  successful_records: number;
  failed_records: number;
  duplicate_records: number;
  errors: string[];
}

export interface EngineStatus {
  status?: string;
  is_live: boolean;
  provider: string;
  model: string;
  display_badge: string;
  description: string;
}

export interface PublicLandingStats {
  institution_name: string;
  system_name: string;
  academic_edition: string;
  academic_session: string;
  metrics: {
    total_students: number;
    total_faculty: number;
    total_courses: number;
    total_attendance_records: number;
  };
  thresholds: {
    statutory_minimum: number;
    warning_threshold: number;
    critical_threshold: number;
    green_min: number;
    yellow_min: number;
    orange_min: number;
    red_max: number;
  };
  security_features: string[];
  status: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface SubjectItem {
  id: number;
  code: string;
  name: string;
  department: string;
  semester: number;
  total_classes_scheduled: number;
  is_active: boolean;
  credits?: number;
  faculty_count?: number;
  attendance_records_count?: number;
  alerts_count?: number;
}

