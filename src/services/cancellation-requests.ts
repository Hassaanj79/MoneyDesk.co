import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  query, 
  orderBy, 
  where,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { CancellationRequest } from '@/types';

const CANCELLATION_REQUESTS_COLLECTION = 'cancellationRequests';

// Create a new cancellation request
export const createCancellationRequest = async (requestData: Omit<CancellationRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    console.log('Creating cancellation request with data:', requestData);
    console.log('Firebase db instance:', db);
    console.log('Collection path:', CANCELLATION_REQUESTS_COLLECTION);
    
    const now = new Date().toISOString();
    const dataToSave = {
      ...requestData,
      createdAt: now,
      updatedAt: now,
    };
    
    console.log('Data to save:', dataToSave);
    
    const docRef = await addDoc(collection(db, CANCELLATION_REQUESTS_COLLECTION), dataToSave);
    console.log('Document created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating cancellation request:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};

// Get all cancellation requests (admin only)
export const getAllCancellationRequests = async (): Promise<CancellationRequest[]> => {
  try {
    const q = query(
      collection(db, CANCELLATION_REQUESTS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CancellationRequest));
  } catch (error) {
    console.error('Error getting cancellation requests:', error);
    throw error;
  }
};

// Get pending cancellation requests count
export const getPendingCancellationCount = async (): Promise<number> => {
  try {
    const q = query(
      collection(db, CANCELLATION_REQUESTS_COLLECTION),
      where('status', '==', 'NEW')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting pending cancellation count:', error);
    throw error;
  }
};

// Update cancellation request status
export const updateCancellationRequestStatus = async (
  requestId: string, 
  status: CancellationRequest['status'],
  adminId?: string,
  adminNotes?: string
): Promise<void> => {
  try {
    const requestRef = doc(db, CANCELLATION_REQUESTS_COLLECTION, requestId);
    
    // Get current document to append notes
    const currentDoc = await getDoc(requestRef);
    const currentData = currentDoc.data();
    
    const updateData: any = { 
      status,
      updatedAt: new Date().toISOString()
    };
    
    if (adminId) {
      updateData.adminId = adminId;
    }
    
    if (adminNotes) {
      const timestamp = new Date().toLocaleString();
      const newNote = `[${timestamp}] ${adminNotes}`;
      
      // Append new note to existing notes
      const existingNotes = currentData?.adminNotes || '';
      updateData.adminNotes = existingNotes 
        ? `${existingNotes}\n\n${newNote}` 
        : newNote;
    }
    
    await updateDoc(requestRef, updateData);
  } catch (error) {
    console.error('Error updating cancellation request:', error);
    throw error;
  }
};

// Delete cancellation request
export const deleteCancellationRequest = async (requestId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, CANCELLATION_REQUESTS_COLLECTION, requestId));
  } catch (error) {
    console.error('Error deleting cancellation request:', error);
    throw error;
  }
};

// Listen to cancellation requests changes (real-time)
export const listenToCancellationRequests = (callback: (requests: CancellationRequest[]) => void) => {
  const q = query(
    collection(db, CANCELLATION_REQUESTS_COLLECTION),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const requests = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CancellationRequest));
    callback(requests);
  });
};
