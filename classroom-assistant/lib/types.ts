import type { Timestamp } from "firebase/firestore"

export interface Classroom {
  id: string
  name: string
  description: string
  teacherId: string
  teacherName: string
  subject: string
  schedule: {
    days: string[]
    time: string
  }
  students: string[]
  inviteCode: string
  curriculumUrl?: string
  timetableUrl?: string
  curriculumProgress: number
  isActive: boolean
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export interface Assignment {
  id: string
  classroomId: string
  title: string
  description: string
  dueDate: Timestamp | Date
  totalPoints: number
  attachments: string[]
  submissions: { [studentId: string]: Submission }
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export interface Submission {
  studentId: string
  studentName: string
  submittedAt: Timestamp | Date
  attachments: string[]
  text?: string
  grade?: number
  feedback?: string
  status: "submitted" | "graded" | "late"
}

export interface Content {
  id: string
  classroomId: string
  title: string
  type: "pdf" | "image" | "video" | "link"
  url: string
  topic: string
  uploadedAt: Timestamp | Date
  uploadedBy: string
}

export interface StudentAnalytics {
  studentId: string
  classroomId: string
  assignmentsCompleted: number
  averageScore: number
  topicScores: { [topic: string]: number }
  lastActive: Timestamp | Date
}

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  role: "teacher" | "student"
  createdAt: Timestamp | Date
}
