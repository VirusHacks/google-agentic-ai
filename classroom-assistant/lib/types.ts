import { Timestamp } from "firebase/firestore"

export interface User {
  uid: string
  email: string
  displayName: string
  role: "teacher" | "student"
  avatarUrl?: string
  avatarPublicId?: string
  age?: number
  grade?: string
  createdAt: Date
  updatedAt: Date
}

export interface Classroom {
  id: string
  name: string
  description: string
  subject: string
  gradeRange: string
  teacherId: string
  teacherName: string
  students: string[]
  inviteCode: string
  schedule: {
    days: string[]
    time: string
  }
  meetLink?: string
  curriculumUrl?: string
  curriculumPublicId?: string
  timetableUrl?: string
  timetablePublicId?: string
  curriculumProgress: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Assignment {
  id: string
  classroomId: string
  title: string
  description: string
  dueDate: Date
  totalPoints: number
  attachments: string[]
  submissions: {
    [studentId: string]: {
      studentId: string
      submittedAt: Date
      status: "draft" | "submitted" | "graded"
      content: string
      attachments: string[]
      grade?: number
      feedback?: string
    }
  }
  createdAt: Date
}

export interface Content {
  id: string
  classroomId: string
  title: string
  type: "pdf" | "image" | "video" | "link"
  topic: string
  url: string
  publicId?: string
  uploadedAt: Date
  uploadedBy: string
}

export interface Note {
  id: string
  classroomId: string
  title: string
  content: string
  tags: string[]
  fileUrl?: string
  filePublicId?: string
  filename?: string
  fileType?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface Worksheet {
  id: string
  classroomId: string
  title: string
  description: string
  subject: string
  gradeLevel: string
  difficulty: "easy" | "medium" | "hard"
  fileUrl: string
  filename: string
  publicId: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface Test {
  id: string
  classroomId: string
  title: string
  description?: string
  duration: number // in minutes
  totalMarks: number
  createdBy: string
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
  isActive: boolean
  questions: TestQuestion[]
  aiGenerated: boolean
  generationPrompt?: string
}

export interface TestQuestion {
  id: string
  type: "mcq" | "fill" | "match" | "short" | "long"
  text: string
  marks: number
  required: boolean
  options?: string[] // for MCQ
  pairs?: { left: string; right: string }[] // for match
  correctAnswer?: string | string[] | Record<string, string>
  order: number
  aiGenerated: boolean
}

export interface TestSubmission {
  id: string
  testId: string
  classroomId: string
  studentId: string
  studentName: string
  answers: Record<string, any>
  score: number
  maxScore: number
  autoGradedScore: number
  aiGradedScore: number
  manualGradedScore: number
  submittedAt: Timestamp | Date
  startedAt: Timestamp | Date
  timeSpent: number // in seconds
  status: "in_progress" | "submitted" | "graded"
  gradedBy?: string
  gradedAt?: Timestamp | Date
  feedback?: string
  questionFeedback: Record<
    string,
    {
      score: number
      feedback: string
      isCorrect: boolean
    }
  >
}

export interface AIGeneratedAnswers {
  testId: string
  classroomId: string
  answers: Record<
    string,
    {
      correctAnswer: string | string[] | Record<string, string>
      explanation: string
      gradingCriteria?: string
    }
  >
  generatedAt: Timestamp | Date
  generatedBy: string
}
export interface StudentAnalytics {
  studentId: string
  classroomId: string
  assignmentsCompleted: number
  assignmentsPending: number
  assignmentsOverdue: number
  averageScore: number
  lastActive: Date
  streak: number
}
