import { doc, getDoc, setDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function saveToFirestore(collectionName: string, documentId: string, data: any): Promise<void> {
  try {
    const docRef = doc(db, collectionName, documentId)
    await setDoc(
      docRef,
      {
        ...data,
        updatedAt: new Date(),
      },
      { merge: true },
    )

    console.log(`✅ Data saved to Firestore: ${collectionName}/${documentId}`)
  } catch (error) {
    console.error(`❌ Failed to save to Firestore:`, error)
    throw error
  }
}

export async function getFromFirestore(collectionName: string, documentId: string): Promise<any> {
  try {
    const docRef = doc(db, collectionName, documentId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() }
    } else {
      return null
    }
  } catch (error) {
    console.error(`❌ Failed to get from Firestore:`, error)
    throw error
  }
}

export async function queryFirestore(
  collectionName: string,
  conditions: Array<{ field: string; operator: any; value: any }>,
  orderByField?: string,
  limitCount?: number,
): Promise<any[]> {
  try {
    let q = query(collection(db, collectionName))

    // Add where conditions
    conditions.forEach((condition) => {
      q = query(q, where(condition.field, condition.operator, condition.value))
    })

    // Add ordering
    if (orderByField) {
      q = query(q, orderBy(orderByField, "desc"))
    }

    // Add limit
    if (limitCount) {
      q = query(q, limit(limitCount))
    }

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error(`❌ Failed to query Firestore:`, error)
    throw error
  }
}
