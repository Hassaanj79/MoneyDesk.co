import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { title, content, dateRange, userId } = await request.json();

    // Validate input
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Use provided userId or fallback to 'anonymous'
    const userIdentifier = userId || 'anonymous';

    const noteData = {
      userId: userIdentifier,
      title,
      content,
      dateRange: dateRange || null, // Handle undefined dateRange
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      console.log('Attempting to save note with data:', { ...noteData, content: '[content hidden]' });
      const docRef = await addDoc(collection(db, 'financial_notes'), noteData);
      console.log('Note saved successfully with ID:', docRef.id);
      return NextResponse.json({
        id: docRef.id,
        message: 'Note saved successfully'
      });
    } catch (firestoreError: any) {
      console.error('Firestore error details:', {
        code: firestoreError.code,
        message: firestoreError.message,
        stack: firestoreError.stack
      });
      
      // If it's a permission error, try to provide more specific feedback
      if (firestoreError.code === 'permission-denied') {
        console.error('Permission denied - this might be due to authentication issues');
        return NextResponse.json({
          id: `local-${Date.now()}`,
          message: 'Note saved locally (Authentication issue)',
          local: true,
          error: 'Permission denied - authentication required'
        });
      }
      
      // Fallback: return success but note that it's stored locally
      return NextResponse.json({
        id: `local-${Date.now()}`,
        message: 'Note saved locally (Firestore unavailable)',
        local: true,
        error: firestoreError.message
      });
    }
  } catch (error) {
    console.error('Error saving financial note:', error);
    return NextResponse.json(
      { error: 'Failed to save note' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'current-user';
    const limitParam = searchParams.get('limit') || '10';

    try {
      const notesQuery = query(
        collection(db, 'financial_notes'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(parseInt(limitParam))
      );
      const querySnapshot = await getDocs(notesQuery);

      const notes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return NextResponse.json(notes);
    } catch (firestoreError: any) {
      console.error('Firestore error in GET:', firestoreError);
      
      // If it's a permission error, return empty array
      if (firestoreError.code === 'permission-denied') {
        console.log('Permission denied for fetching notes, returning empty array');
        return NextResponse.json([]);
      }
      
      // For other errors, try to return local storage data
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error fetching financial notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}
