import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    orderBy,
    Timestamp,
    writeBatch,
    runTransaction,
  } from "firebase/firestore"
  import { db } from "@/lib/firebase"
  import type { Test, AIGeneratedAnswers, TestQuestion } from "@/lib/types"
  
  export interface CreateTestData {
    classroomId: string
    title: string
    description?: string
    duration: number
    totalMarks: number
    createdBy: string
    isActive: boolean
    aiGenerated: boolean
    generationPrompt?: string
    questions: TestQuestion[]
  }
  
  export interface CreateTestResult {
    testId: string
    answersId?: string
  }
  
  export class FirebaseTestUtils {
    // Create a complete test with questions and answers in a transaction
    static async createCompleteTest(
      testData: CreateTestData,
      aiAnswers?: Record<string, any>,
    ): Promise<CreateTestResult> {
      try {
        console.log('[createCompleteTest] INPUT testData:', JSON.stringify(testData, null, 2));
        return await runTransaction(db, async (transaction) => {
          // Create the test document
          const testsRef = collection(db, `classrooms/${testData.classroomId}/tests`)
          const testDocRef = doc(testsRef)

          const testDoc: Omit<Test, "id"> = {
            classroomId: testData.classroomId,
            title: testData.title,
            description: testData.description,
            duration: testData.duration,
            totalMarks: testData.totalMarks,
            createdBy: testData.createdBy,
            isActive: testData.isActive,
            aiGenerated: testData.aiGenerated,
            generationPrompt: testData.generationPrompt,
            questions: testData.questions,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          }

          // Remove undefined fields (Firestore does not allow them)
          Object.keys(testDoc).forEach(
            (key) => (testDoc as Record<string, any>)[key] === undefined && delete (testDoc as Record<string, any>)[key]
          )

          console.log('[createCompleteTest] FINAL testDoc to Firestore:', JSON.stringify(testDoc, null, 2));

          transaction.set(testDocRef, testDoc)

          let answersId: string | undefined

          // If AI answers are provided, create the answers document
          if (aiAnswers && testData.aiGenerated) {
            const answersRef = collection(db, `classrooms/${testData.classroomId}/test_answers`)
            const answersDocRef = doc(answersRef)

            const answersDoc: Omit<AIGeneratedAnswers, "id"> = {
              testId: testDocRef.id,
              classroomId: testData.classroomId,
              answers: aiAnswers,
              generatedBy: testData.createdBy,
              generatedAt: Timestamp.now(),
            }

            transaction.set(answersDocRef, answersDoc)
            answersId = answersDocRef.id
          }

          const result = {
            testId: testDocRef.id,
            answersId,
          }
          console.log('[createCompleteTest] RESULT:', JSON.stringify(result, null, 2));
          return result;
        })
      } catch (error) {
        console.error("Error creating complete test:", error)
        throw new Error(`Failed to create test: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }
  
    // Create a new test (legacy method for backward compatibility)
    static async createTest(classroomId: string, testData: Omit<Test, "id" | "createdAt" | "updatedAt">) {
      try {
        const testsRef = collection(db, `classrooms/${classroomId}/tests`)
        const docRef = await addDoc(testsRef, {
          ...testData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
        return docRef.id
      } catch (error) {
        console.error("Error creating test:", error)
        throw new Error(`Failed to create test: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }
  
    // Store AI-generated answers
    static async storeAIAnswers(classroomId: string, answersData: Omit<AIGeneratedAnswers, "generatedAt">) {
      try {
        const answersRef = collection(db, `classrooms/${classroomId}/test_answers`)
        const docRef = await addDoc(answersRef, {
          ...answersData,
          generatedAt: Timestamp.now(),
        })
        return docRef.id
      } catch (error) {
        console.error("Error storing AI answers:", error)
        throw new Error(`Failed to store AI answers: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }
  
    // Get test by ID with error handling
    static async getTest(classroomId: string, testId: string): Promise<Test | null> {
      try {
        const testRef = doc(db, `classrooms/${classroomId}/tests`, testId)
        const testSnap = await getDoc(testRef)
  
        if (testSnap.exists()) {
          const data = testSnap.data()
          return {
            id: testSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as Test
        }
        return null
      } catch (error) {
        console.error("Error getting test:", error)
        throw new Error(`Failed to get test: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }
  
    // Get AI answers for a test
    static async getAIAnswers(classroomId: string, testId: string): Promise<AIGeneratedAnswers | null> {
      try {
        const answersRef = collection(db, `classrooms/${classroomId}/test_answers`)
        const q = query(answersRef, where("testId", "==", testId))
        const querySnapshot = await getDocs(q)
  
        if (!querySnapshot.empty) {
          const firstDoc = querySnapshot.docs[0]
          if (!firstDoc) {
            return null
          }
          const data = firstDoc.data()
          if (!data) {
            return null
          }
          return {
            id: firstDoc.id,
            testId: data.testId,
            classroomId: data.classroomId,
            answers: data.answers,
            generatedBy: data.generatedBy,
            generatedAt: data.generatedAt?.toDate() || new Date(),
          } as AIGeneratedAnswers
        }
        return null
      } catch (error) {
        console.error("Error getting AI answers:", error)
        throw new Error(`Failed to get AI answers: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }
  
    // Get all tests for a classroom with pagination
    static async getClassroomTests(classroomId: string, limit = 50): Promise<Test[]> {
      try {
        const testsRef = collection(db, `classrooms/${classroomId}/tests`)
        const q = query(testsRef, orderBy("createdAt", "desc"))
        const querySnapshot = await getDocs(q)
  
        return querySnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          }
        }) as Test[]
      } catch (error) {
        console.error("Error getting classroom tests:", error)
        throw new Error(`Failed to get tests: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }
  
    // Update test with optimistic locking
    static async updateTest(classroomId: string, testId: string, updates: Partial<Test>): Promise<void> {
      try {
        const testRef = doc(db, `classrooms/${classroomId}/tests`, testId)
  
        // Remove fields that shouldn't be updated
        const { id, createdAt, ...safeUpdates } = updates
  
        await updateDoc(testRef, {
          ...safeUpdates,
          updatedAt: Timestamp.now(),
        })
      } catch (error) {
        console.error("Error updating test:", error)
        throw new Error(`Failed to update test: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }
  
    // Delete test and associated data
    static async deleteTest(classroomId: string, testId: string): Promise<void> {
      try {
        const batch = writeBatch(db)
  
        // Delete the test
        const testRef = doc(db, `classrooms/${classroomId}/tests`, testId)
        batch.delete(testRef)
  
        // Delete associated AI answers
        const answersRef = collection(db, `classrooms/${classroomId}/test_answers`)
        const answersQuery = query(answersRef, where("testId", "==", testId))
        const answersSnapshot = await getDocs(answersQuery)
  
        answersSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref)
        })
  
        // Delete associated submissions (if any)
        const submissionsRef = collection(db, `classrooms/${classroomId}/test_submissions`)
        const submissionsQuery = query(submissionsRef, where("testId", "==", testId))
        const submissionsSnapshot = await getDocs(submissionsQuery)
  
        submissionsSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref)
        })
  
        await batch.commit()
      } catch (error) {
        console.error("Error deleting test:", error)
        throw new Error(`Failed to delete test: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }
  
    // Validate test data before saving
    static validateTestData(testData: CreateTestData): string[] {
      const errors: string[] = []
  
      if (!testData.title?.trim()) {
        errors.push("Test title is required")
      }
  
      if (testData.duration < 1 || testData.duration > 300) {
        errors.push("Duration must be between 1 and 300 minutes")
      }
  
      if (testData.totalMarks < 1) {
        errors.push("Total marks must be at least 1")
      }
  
      if (!testData.questions || testData.questions.length === 0) {
        errors.push("At least one question is required")
      }
  
      if (testData.questions) {
        testData.questions.forEach((question, index) => {
          if (!question.text?.trim()) {
            errors.push(`Question ${index + 1} must have text`)
          }
          if (question.marks < 1) {
            errors.push(`Question ${index + 1} must have at least 1 mark`)
          }
          if (question.type === "mcq" && (!question.options || question.options.length < 2)) {
            errors.push(`Question ${index + 1} (MCQ) must have at least 2 options`)
          }
        })
      }
  
      return errors
    }
  }
  