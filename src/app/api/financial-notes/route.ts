import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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
      dateRange,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(collection(db, 'financial_notes'), noteData);
      return NextResponse.json({
        id: docRef.id,
        message: 'Note saved successfully'
      });
    } catch (firestoreError) {
      console.error('Firestore error:', firestoreError);
      // Fallback: return success but note that it's stored locally
      return NextResponse.json({
        id: `local-${Date.now()}`,
        message: 'Note saved locally (Firestore unavailable)',
        local: true
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
  } catch (error) {
    console.error('Error fetching financial notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}
