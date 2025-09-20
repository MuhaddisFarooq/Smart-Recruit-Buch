export interface Announcement {
  id: string
  title: string
  content: string
  priority: "high" | "medium" | "low"
  author: string
  date: string
}

export interface Assignment {
  id: string
  title: string
  description: string
  subject: string
  dueDate: string
  points: number
  status: "pending" | "submitted" | "graded"
  attachments: { name: string; url: string }[]
}

export interface Quiz {
  id: string
  title: string
  subject: string
  description: string
  duration: number
  questions: Question[]
  isActive: true | false
  score?: number
  status?: string
}

export interface Question {
  id: string
  type: "multiple-choice" | "true-false" | "short-answer"
  question: string
  options?: string[]
  correctAnswers: number[]
  points: number
}

export interface StudyMaterial {
  id: string
  title: string
  description: string
  subject: string
  type: "document" | "video" | "presentation"
  size: string
  uploadDate: string
  downloads: number
}

export interface ScheduleEntry {
  id: string
  subject: string
  instructor: string
  room: string
  day: string
  startTime: string
  endTime: string
  type: "lecture" | "lab" | "tutorial"
  color: string
}

export interface Student {
  id: string
  name: string
  email: string
  rollNumber: string
  attendancePercentage: number
  status: "present" | "late" | "absent"
}

export interface AttendanceRecord {
  studentId: string
  date: string
  status: "present" | "absent"
  course: string
}
