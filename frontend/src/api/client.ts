import {
  User,
  StudentDashboardData,
  AttendanceRecord,
  WhatIfResponse,
  AlertItem,
  NotificationItem,
  AgentRunItem,
  AgentLogItem,
  AuditLogItem,
  ThresholdConfig,
  CSVImportResult,
  EngineStatus,
  SchedulerStatus,
  MLMetrics,
  PublicLandingStats,
  SubjectItem,
  PaginatedResponse
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Public Landing Aggregate Stats
  async getPublicLandingStats(): Promise<PublicLandingStats> {
    return this.request<PublicLandingStats>('/public/landing-stats');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    let response: Response;
    try {
      response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (networkError: any) {
      throw new Error('Unable to connect to the server. Please check your connection and try again.');
    }

    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      // Clear token and redirect to login if authenticated session expired
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login') && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }

    if (!response.ok) {
      console.error(`[API Error] ${options.method || 'GET'} ${endpoint} -> HTTP ${response.status}`);

      let errorMsg = '';
      try {
        const errorData = await response.json();
        if (typeof errorData.detail === 'string') {
          errorMsg = errorData.detail;
        } else if (Array.isArray(errorData.detail) && errorData.detail[0]?.msg) {
          errorMsg = errorData.detail.map((d: any) => d.msg).join(', ');
        } else if (errorData.error && typeof errorData.error.message === 'string') {
          errorMsg = errorData.error.message;
        } else if (typeof errorData.message === 'string') {
          errorMsg = errorData.message;
        }
      } catch {
        // non-JSON response payload
      }

      if (!errorMsg) {
        if (response.status === 400) {
          errorMsg = 'Invalid request. Please check your input and credentials.';
        } else if (response.status === 401) {
          errorMsg = 'Incorrect ID/email or password. Please check your credentials and try again.';
        } else if (response.status === 403) {
          errorMsg = 'Access restricted. Please verify your role or contact the administrator.';
        } else if (response.status === 404) {
          errorMsg = 'Unable to connect to the authentication service. Please try again.';
        } else if (response.status === 409) {
          errorMsg = 'Conflict detected. Please review your input and try again.';
        } else if (response.status === 422) {
          errorMsg = 'Validation error. Please verify the entered fields.';
        } else if (response.status === 429) {
          errorMsg = 'Too many attempts. Please wait and try again later.';
        } else if (response.status >= 500) {
          errorMsg = 'Something went wrong on the server. Please try again shortly.';
        } else {
          errorMsg = 'An unexpected error occurred. Please try again.';
        }
      }

      throw new Error(errorMsg);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string, portalRole?: string) {
    return this.request<{
      access_token: string;
      token_type: string;
      user_id: number;
      email: string;
      full_name: string;
      role: string;
      must_change_password?: boolean;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, portal_role: portalRole }),
    });
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Engine Status
  async getEngineStatus(): Promise<EngineStatus> {
    return this.request<EngineStatus>('/ai/status');
  }

  // Student
  async getStudentDashboard(): Promise<StudentDashboardData> {
    return this.request<StudentDashboardData>('/students/me/dashboard');
  }

  async getStudentAttendance(subjectId?: number, status?: string): Promise<AttendanceRecord[]> {
    let url = '/students/me/attendance';
    const params = new URLSearchParams();
    if (subjectId) params.append('subject_id', subjectId.toString());
    if (status) params.append('status', status);
    const qs = params.toString();
    return this.request<AttendanceRecord[]>(qs ? `${url}?${qs}` : url);
  }

  // Attendance & What-If
  async runWhatIf(subjectId: number, attendClasses: number, missClasses: number, studentId?: number): Promise<WhatIfResponse> {
    return this.request<WhatIfResponse>('/attendance/what-if', {
      method: 'POST',
      body: JSON.stringify({
        subject_id: subjectId,
        classes_to_attend: attendClasses,
        classes_to_miss: missClasses,
        student_id: studentId,
      }),
    });
  }

  async getAttendanceRecords(subjectId?: number, studentId?: number): Promise<AttendanceRecord[]> {
    let url = '/attendance/';
    const params = new URLSearchParams();
    if (subjectId) params.append('subject_id', subjectId.toString());
    if (studentId) params.append('student_id', studentId.toString());
    const qs = params.toString();
    return this.request<AttendanceRecord[]>(qs ? `${url}?${qs}` : url);
  }

  async addAttendanceRecord(data: { student_id: number; subject_id: number; date: string; status: string; notes?: string }) {
    return this.request<AttendanceRecord>('/attendance/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAttendanceRecord(id: number, data: { status: string; notes?: string }) {
    return this.request<AttendanceRecord>(`/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async uploadAttendanceCSV(file: File): Promise<CSVImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.request<CSVImportResult>('/attendance/import', {
      method: 'POST',
      body: formData,
    });
  }

  // Alerts
  async getAlerts(riskLevel?: string, isResolved?: boolean): Promise<AlertItem[]> {
    let url = '/alerts/';
    const params = new URLSearchParams();
    if (riskLevel) params.append('risk_level', riskLevel);
    if (isResolved !== undefined) params.append('is_resolved', isResolved.toString());
    const qs = params.toString();
    return this.request<AlertItem[]>(qs ? `${url}?${qs}` : url);
  }

  async resolveAlert(id: number, isResolved: boolean = true): Promise<AlertItem> {
    return this.request<AlertItem>(`/alerts/${id}/resolve`, {
      method: 'PUT',
      body: JSON.stringify({ is_resolved: isResolved }),
    });
  }

  // Notifications
  async getNotifications(limit: number = 50, offset: number = 0): Promise<NotificationItem[]> {
    return this.request<NotificationItem[]>(`/notifications/?limit=${limit}&offset=${offset}`);
  }

  async getUnreadNotificationCount(): Promise<{ unread_count: number }> {
    return this.request<{ unread_count: number }>('/notifications/unread-count');
  }

  async markNotificationRead(id: number): Promise<NotificationItem> {
    return this.request<NotificationItem>(`/notifications/${id}/read`, {
      method: 'PUT',
      body: JSON.stringify({ is_read: true }),
    });
  }

  async markAllNotificationsRead() {
    return this.request<{ message: string }>('/notifications/read-all', {
      method: 'PUT',
    });
  }

  // AI Chat & Status
  async sendChatMessage(
    message: string,
    history?: { role: string; content: string }[]
  ): Promise<{ reply: string; suggested_actions?: string[]; is_mock_ai: boolean; telemetry?: any }> {
    return this.request<{ reply: string; suggested_actions?: string[]; is_mock_ai: boolean; telemetry?: any }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history: history || [] }),
    });
  }

  async sendChatMessageStream(
    message: string,
    history?: { role: string; content: string }[],
    callbacks?: {
      onStage?: (stage: string, stageMessage: string) => void;
      onChunk?: (chunk: string) => void;
      onDone?: (data: { reply: string; suggested_actions?: string[]; telemetry?: any }) => void;
      onError?: (error: any) => void;
    }
  ): Promise<void> {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}/ai/chat/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message, history: history || [] }),
      });

      if (!response.ok) {
        if (response.status >= 500) {
          throw new Error('Something went wrong on the server. Please try again shortly.');
        }
        let errMsg = `HTTP ${response.status}`;
        try {
          const errJson = await response.json();
          errMsg = errJson.detail || errJson.message || errMsg;
        } catch {
          // ignore
        }
        throw new Error(errMsg);
      }

      if (!response.body) {
        throw new Error('Streaming response body unavailable');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const cleanLine = line.trim();
          if (cleanLine.startsWith('data: ')) {
            try {
              const data = JSON.parse(cleanLine.substring(6));
              if (data.type === 'stage' && callbacks?.onStage) {
                callbacks.onStage(data.stage, data.message);
              } else if (data.type === 'chunk' && callbacks?.onChunk) {
                callbacks.onChunk(data.content);
              } else if (data.type === 'done' && callbacks?.onDone) {
                callbacks.onDone({
                  reply: data.reply,
                  suggested_actions: data.suggested_actions,
                  telemetry: data.telemetry,
                });
              }
            } catch (pErr) {
              console.warn('[SSE Parse error]', pErr);
            }
          }
        }
      }
    } catch (err: any) {
      if (callbacks?.onError) {
        callbacks.onError(err);
      } else {
        throw err;
      }
    }
  }

  // Faculty
  async getFacultyDashboard(): Promise<any> {
    return this.request<any>('/faculty/dashboard');
  }

  async getFacultySubjects(): Promise<any[]> {
    return this.request<any[]>('/faculty/subjects');
  }

  async getFacultyStudents(subjectId?: number, riskLevel?: string, search?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (subjectId) params.append('subject_id', subjectId.toString());
    if (riskLevel) params.append('risk_level', riskLevel);
    if (search) params.append('search', search);
    const qs = params.toString();
    return this.request<any[]>(qs ? `/faculty/students?${qs}` : '/faculty/students');
  }

  // Admin
  async getAdminAnalytics(): Promise<any> {
    return this.request<any>('/admin/analytics');
  }

  async getAdminUsers(role?: string, search?: string, page?: number, pageSize?: number): Promise<any> {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (search) params.append('search', search);
    if (page !== undefined) params.append('page', page.toString());
    if (pageSize !== undefined) params.append('page_size', pageSize.toString());
    const qs = params.toString();
    return this.request<any>(qs ? `/admin/users?${qs}` : '/admin/users');
  }

  async addStudent(data: {
    email: string;
    password: string;
    full_name: string;
    roll_number: string;
    department?: string;
    semester?: number;
    section?: string;
  }): Promise<any> {
    return this.request<any>('/admin/students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addFaculty(data: {
    email: string;
    password: string;
    full_name: string;
    employee_id: string;
    department?: string;
    designation?: string;
    assigned_subject_ids?: number[];
  }): Promise<any> {
    return this.request<any>('/admin/faculty', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUserStatus(userId: number, isActive: boolean): Promise<any> {
    return this.request<any>(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: isActive }),
    });
  }

  async resetUserPassword(userId: number, newPassword: string, requireChange: boolean = true): Promise<any> {
    return this.request<any>(`/admin/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ new_password: newPassword, require_change_on_next_login: requireChange }),
    });
  }

  async forceChangePassword(newPassword: string): Promise<User> {
    return this.request<User>('/auth/force-change-password', {
      method: 'POST',
      body: JSON.stringify({ new_password: newPassword }),
    });
  }

  async uploadProfilePhoto(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('file', file);
    return this.request<User>('/auth/profile/photo', {
      method: 'POST',
      body: formData,
    });
  }

  async removeProfilePhoto(): Promise<User> {
    return this.request<User>('/auth/profile/photo', {
      method: 'DELETE',
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<any> {
    return this.request<any>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
  }

  async getAdminSubjects(search?: string, department?: string, semester?: number, isActive?: boolean): Promise<SubjectItem[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (department) params.append('department', department);
    if (semester !== undefined) params.append('semester', semester.toString());
    if (isActive !== undefined) params.append('is_active', isActive.toString());
    const qs = params.toString();
    return this.request<SubjectItem[]>(qs ? `/admin/subjects?${qs}` : '/admin/subjects');
  }

  async createSubject(data: {
    code: string;
    name: string;
    department: string;
    semester: number;
    total_classes_scheduled: number;
    credits?: number;
  }): Promise<SubjectItem> {
    return this.request<SubjectItem>('/admin/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSubject(
    id: number,
    data: Partial<{
      code: string;
      name: string;
      department: string;
      semester: number;
      total_classes_scheduled: number;
      credits: number;
      is_active: boolean;
    }>
  ): Promise<SubjectItem> {
    return this.request<SubjectItem>(`/admin/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteOrArchiveSubject(id: number): Promise<{ message: string; archived: boolean; deleted: boolean; id: number }> {
    return this.request<{ message: string; archived: boolean; deleted: boolean; id: number }>(`/admin/subjects/${id}`, {
      method: 'DELETE',
    });
  }

  async archiveSubject(id: number): Promise<any> {
    return this.request<any>(`/admin/subjects/${id}/archive`, {
      method: 'POST',
    });
  }

  async unarchiveSubject(id: number): Promise<any> {
    return this.request<any>(`/admin/subjects/${id}/unarchive`, {
      method: 'POST',
    });
  }

  async getThresholds(): Promise<ThresholdConfig> {
    return this.request<ThresholdConfig>('/admin/thresholds');
  }

  async updateThresholds(data: { green_min: number; yellow_min: number; orange_min: number; red_max: number }): Promise<ThresholdConfig> {
    return this.request<ThresholdConfig>('/admin/thresholds', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getAuditLogs(action?: string, page?: number, pageSize?: number): Promise<any> {
    const params = new URLSearchParams();
    if (action) params.append('action', action);
    if (page !== undefined) params.append('page', page.toString());
    if (pageSize !== undefined) params.append('page_size', pageSize.toString());
    const qs = params.toString();
    return this.request<any>(qs ? `/admin/audit-logs?${qs}` : '/admin/audit-logs');
  }

  // Agent Operations
  async triggerAgentAnalysis(department?: string, semester?: number): Promise<any> {
    return this.request<any>('/agent/analyze', {
      method: 'POST',
      body: JSON.stringify({ department, semester }),
    });
  }

  async getAgentRuns(page?: number, pageSize?: number): Promise<any> {
    const params = new URLSearchParams();
    if (page !== undefined) params.append('page', page.toString());
    if (pageSize !== undefined) params.append('page_size', pageSize.toString());
    const qs = params.toString();
    return this.request<any>(qs ? `/agent/runs?${qs}` : '/agent/runs');
  }

  async getAgentRunLogs(runId: number): Promise<AgentLogItem[]> {
    return this.request<AgentLogItem[]>(`/agent/runs/${runId}/logs`);
  }

  // Registration
  async register(data: {
    email: string;
    password: string;
    full_name: string;
    role: string;
    roll_number?: string;
    department?: string;
    semester?: number;
    phone?: string;
  }) {
    return this.request<{
      access_token: string;
      token_type: string;
      user_id: number;
      email: string;
      full_name: string;
      role: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Scheduler
  async getSchedulerStatus(): Promise<SchedulerStatus> {
    return this.request<SchedulerStatus>('/scheduler/status');
  }

  async updateSchedulerConfig(enabled: boolean, intervalHours: number): Promise<SchedulerStatus> {
    return this.request<SchedulerStatus>('/scheduler/config', {
      method: 'POST',
      body: JSON.stringify({ enabled, interval_hours: intervalHours }),
    });
  }

  async triggerSchedulerRun(): Promise<any> {
    return this.request<any>('/scheduler/trigger', {
      method: 'POST',
    });
  }

  // Machine Learning
  async getMLMetrics(): Promise<MLMetrics> {
    return this.request<MLMetrics>('/ml/metrics');
  }

  async predictStudentRisk(studentId: number, subjectId?: number): Promise<any> {
    const qs = subjectId ? `?subject_id=${subjectId}` : '';
    return this.request<any>(`/ml/predict/${studentId}${qs}`, {
      method: 'POST',
    });
  }

  async trainMLModel(): Promise<any> {
    return this.request<any>('/ml/train', {
      method: 'POST',
    });
  }

  // All Notifications & Delivery Management
  async getAllNotifications(status?: string, channel?: string, page?: number, pageSize?: number): Promise<any> {
    const params = new URLSearchParams();
    if (status) params.append('delivery_status', status);
    if (channel) params.append('channel', channel);
    if (page !== undefined) params.append('page', page.toString());
    if (pageSize !== undefined) params.append('page_size', pageSize.toString());
    const qs = params.toString();
    return this.request<any>(qs ? `/notifications/all?${qs}` : '/notifications/all');
  }

  async retryNotification(id: number): Promise<NotificationItem> {
    return this.request<NotificationItem>(`/notifications/${id}/retry`, {
      method: 'POST',
    });
  }

  // Reports
  async getReportsAtRisk(subjectId?: number, department?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (subjectId) params.append('subject_id', subjectId.toString());
    if (department) params.append('department', department);
    const qs = params.toString();
    return this.request<any[]>(qs ? `/reports/at-risk?${qs}` : '/reports/at-risk');
  }

  async getReportsSubjects(): Promise<any[]> {
    return this.request<any[]>('/reports/subjects');
  }

  async getReportsDepartment(): Promise<any[]> {
    return this.request<any[]>('/reports/departments');
  }

  async getReportsAgentRuns(): Promise<any[]> {
    return this.request<any[]>('/reports/agent-runs');
  }

  getReportDownloadUrl(endpoint: string): string {
    const token = this.getToken();
    return `${API_BASE}${endpoint}${endpoint.includes('?') ? '&' : '?'}token=${token}`;
  }
}

export const api = new ApiClient();
