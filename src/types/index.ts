// User Types
export interface User {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'student' | 'professor' | 'admin';
  created_at: string;
}

export interface UserProfile extends User {
  courses?: Course[];
}

// Course Types
export interface Course {
  id: string;
  course_code: string;
  course_name: string;
  professor_id: string;
  semester: string;
  year: number;
  created_at: string;
  professor?: User;
  sessions?: ClassSession[];
}

// Class Session Types
export interface ClassSession {
  id: string;
  course_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  qr_code_secret: string;
  qr_code_expires_at: string;
  is_active: boolean;
  created_at: string;
  course?: Course;
  attendance_records?: AttendanceRecord[];
}

// Attendance Types
export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  scanned_at: string;
  status: 'present' | 'late' | 'absent';
  device_fingerprint: string;
  ip_address: string;
  created_at: string;
  student?: User;
  session?: ClassSession;
}

// QR Code Types
export interface QRCodeData {
  sessionId: string;
  timestamp: number;
  nonce: string;
  signature: string;
}

export interface QRCodeResponse {
  qr_code: string;
  expires_at: string;
  session_id: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Analytics Types
export interface AttendanceAnalytics {
  total_sessions: number;
  total_students: number;
  attendance_rate: number;
  average_late_rate: number;
  attendance_trend: AttendanceTrend[];
  student_performance: StudentPerformance[];
}

export interface AttendanceTrend {
  date: string;
  attendance_rate: number;
  present_count: number;
  late_count: number;
  absent_count: number;
}

export interface StudentPerformance {
  student_id: string;
  student_name: string;
  attendance_rate: number;
  total_present: number;
  total_late: number;
  total_absent: number;
  last_attended: string;
}

// Device Fingerprinting
export interface DeviceFingerprint {
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  cookieEnabled: boolean;
  doNotTrack: string;
  hardwareConcurrency: number;
  deviceMemory?: number;
  connectionType?: string;
}

// Geofencing
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

// Socket Events
export interface SocketEvents {
  'join-session': (sessionId: string) => void;
  'qr-scan': (qrData: QRCodeData, studentId: string) => void;
  'attendance-update': (attendance: AttendanceRecord) => void;
  'qr-refresh': (qrData: QRCodeResponse) => void;
  'session-started': (session: ClassSession) => void;
  'session-ended': (sessionId: string) => void;
}

// Form Types
export interface CreateCourseForm {
  course_code: string;
  course_name: string;
  semester: string;
  year: number;
}

export interface CreateSessionForm {
  course_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
}

export interface ScanQRForm {
  qr_data: QRCodeData;
  location?: LocationData;
}

// Export Types
export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  date_range: {
    start: string;
    end: string;
  };
  include_analytics: boolean;
  group_by: 'student' | 'session' | 'date';
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// State Types
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AppError | null;
}

export interface AttendanceState {
  currentSession: ClassSession | null;
  attendanceRecords: AttendanceRecord[];
  qrCode: QRCodeResponse | null;
  isScanning: boolean;
  scanError: string | null;
}

// Component Props
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

export interface ButtonProps extends ComponentProps {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export interface InputProps extends ComponentProps {
  id?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'time';
  placeholder?: string;
  value?: string | number;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  min?: string | number;
  max?: string | number;
}
