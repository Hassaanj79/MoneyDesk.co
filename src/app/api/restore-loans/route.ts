import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (email !== 'hassyku786@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the user ID for hassyku786@gmail.com using Admin SDK
    const usersSnapshot = await adminDb.collection('users')
      .where('email', '==', 'hassyku786@gmail.com')
      .get();
    
    if (usersSnapshot.empty) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    
    // Check existing loans
    const loansSnapshot = await adminDb.collection('users').doc(userId).collection('loans').get();
    
    if (loansSnapshot.size > 0) {
      return NextResponse.json({ 
        message: 'Loans already exist', 
        count: loansSnapshot.size 
      });
    }
    
    // Create sample loans data
    const sampleLoans = [
      {
        type: 'given',
        borrowerName: 'John Smith',
        amount: 5000,
        description: 'Personal loan to friend for emergency',
        status: 'active',
        dueDate: '2024-12-31',
        interestRate: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        type: 'taken',
        borrowerName: 'Bank of America',
        amount: 15000,
        description: 'Car loan for new vehicle',
        status: 'active',
        dueDate: '2025-06-30',
        interestRate: 8,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        type: 'given',
        borrowerName: 'Sarah Johnson',
        amount: 2000,
        description: 'Emergency loan to family member',
        status: 'paid',
        dueDate: '2024-10-15',
        interestRate: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        type: 'taken',
        borrowerName: 'Wells Fargo',
        amount: 25000,
        description: 'Home improvement loan',
        status: 'active',
        dueDate: '2025-12-31',
        interestRate: 6.5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        type: 'given',
        borrowerName: 'Mike Wilson',
        amount: 3000,
        description: 'Business loan to colleague',
        status: 'active',
        dueDate: '2025-03-15',
        interestRate: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    const createdLoans = [];
    for (const loan of sampleLoans) {
      try {
        const docRef = await adminDb.collection('users').doc(userId).collection('loans').add(loan);
        createdLoans.push({ id: docRef.id, ...loan });
      } catch (error) {
        console.error('Error creating loan:', error);
      }
    }
    
    return NextResponse.json({ 
      message: 'Loans restored successfully', 
      count: createdLoans.length,
      loans: createdLoans
    });
    
  } catch (error) {
    console.error('Error restoring loans:', error);
    return NextResponse.json({ error: 'Failed to restore loans' }, { status: 500 });
  }
}
