export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          student_id: string
          first_name: string
          last_name: string
          email: string
          role: 'student' | 'professor' | 'admin'
          created_at: string
        }
        Insert: {
          id: string
          student_id: string
          first_name: string
          last_name: string
          email: string
          role?: 'student' | 'professor' | 'admin'
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          first_name?: string
          last_name?: string
          email?: string
          role?: 'student' | 'professor' | 'admin'
          created_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          id: string
          course_code: string
          course_name: string
          professor_id: string
          semester: string
          year: number
          created_at: string
        }
        Insert: {
          id?: string
          course_code: string
          course_name: string
          professor_id: string
          semester: string
          year: number
          created_at?: string
        }
        Update: {
          id?: string
          course_code?: string
          course_name?: string
          professor_id?: string
          semester?: string
          year?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_professor_id_fkey"
            columns: ["professor_id"]
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      class_sessions: {
        Row: {
          id: string
          course_id: string
          session_date: string
          start_time: string
          end_time: string
          qr_code_secret: string
          qr_code_expires_at: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          session_date: string
          start_time: string
          end_time: string
          qr_code_secret: string
          qr_code_expires_at: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          session_date?: string
          start_time?: string
          end_time?: string
          qr_code_secret?: string
          qr_code_expires_at?: string
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_sessions_course_id_fkey"
            columns: ["course_id"]
            referencedRelation: "courses"
            referencedColumns: ["id"]
          }
        ]
      }
      attendance_records: {
        Row: {
          id: string
          session_id: string
          student_id: string
          scanned_at: string
          status: 'present' | 'late' | 'absent'
          device_fingerprint: string
          ip_address: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          student_id: string
          scanned_at: string
          status: 'present' | 'late' | 'absent'
          device_fingerprint: string
          ip_address: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          student_id?: string
          scanned_at?: string
          status?: 'present' | 'late' | 'absent'
          device_fingerprint?: string
          ip_address?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      qr_code_usage: {
        Row: {
          id: string
          session_id: string
          qr_code_secret: string
          used_by: string
          used_at: string
          device_fingerprint: string
        }
        Insert: {
          id?: string
          session_id: string
          qr_code_secret: string
          used_by: string
          used_at: string
          device_fingerprint: string
        }
        Update: {
          id?: string
          session_id?: string
          qr_code_secret?: string
          used_by?: string
          used_at?: string
          device_fingerprint?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_code_usage_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_code_usage_used_by_fkey"
            columns: ["used_by"]
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
