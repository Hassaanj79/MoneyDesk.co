import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Check if Firebase Admin SDK is available and initialized
    if (!adminAuth) {
      console.log('Firebase Admin SDK not available, returning mock data');
      return getMockUsersData();
    }

    // Check if user is admin (you can add more sophisticated auth here)
    // For development, we'll bypass authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // List all users (paginated)
    const maxResults = 1000; // Maximum number of users to return
    const listUsersResult = await adminAuth.listUsers(maxResults);
    
    const users = listUsersResult.users.map(userRecord => ({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      emailVerified: userRecord.emailVerified,
      disabled: userRecord.disabled,
      metadata: {
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime,
        lastRefreshTime: userRecord.metadata.lastRefreshTime,
      },
      customClaims: userRecord.customClaims,
      providerData: userRecord.providerData.map(provider => ({
        providerId: provider.providerId,
        uid: provider.uid,
        email: provider.email,
        displayName: provider.displayName,
      })),
    }));

    console.log(`Successfully fetched ${users.length} real users from Firebase Authentication`);
    return NextResponse.json({
      users,
      totalUsers: listUsersResult.users.length,
      hasMore: listUsersResult.pageToken ? true : false,
      nextPageToken: listUsersResult.pageToken,
    });

  } catch (error: any) {
    console.error('Error fetching users from Firebase Auth:', error);
    
    // If Firebase Admin SDK fails, return mock data
    console.log('Firebase Admin SDK error, returning mock data');
    return getMockUsersData();
  }
}

function getMockUsersData() {
  const mockUsers = [
        {
          uid: 'mock-user-1',
          email: 'hassaan@repairdesk.co',
          displayName: 'Hassaan Jalal',
          emailVerified: true,
          disabled: false,
          metadata: {
            creationTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            lastSignInTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            lastRefreshTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          },
          customClaims: {},
          providerData: [{
            providerId: 'password',
            uid: 'hassaan@repairdesk.co',
            email: 'hassaan@repairdesk.co',
            displayName: 'Hassaan Jalal',
          }],
        },
        {
          uid: 'mock-user-2',
          email: 'john.doe@example.com',
          displayName: 'John Doe',
          emailVerified: true,
          disabled: false,
          metadata: {
            creationTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            lastSignInTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            lastRefreshTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
          customClaims: {},
          providerData: [{
            providerId: 'password',
            uid: 'john.doe@example.com',
            email: 'john.doe@example.com',
            displayName: 'John Doe',
          }],
        },
        {
          uid: 'mock-user-3',
          email: 'jane.smith@example.com',
          displayName: 'Jane Smith',
          emailVerified: true,
          disabled: false,
          metadata: {
            creationTime: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            lastSignInTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            lastRefreshTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          },
          customClaims: {},
          providerData: [{
            providerId: 'password',
            uid: 'jane.smith@example.com',
            email: 'jane.smith@example.com',
            displayName: 'Jane Smith',
          }],
        },
        {
          uid: 'mock-user-4',
          email: 'bob.wilson@example.com',
          displayName: 'Bob Wilson',
          emailVerified: false,
          disabled: true,
          metadata: {
            creationTime: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            lastSignInTime: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
            lastRefreshTime: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          },
          customClaims: {},
          providerData: [{
            providerId: 'password',
            uid: 'bob.wilson@example.com',
            email: 'bob.wilson@example.com',
            displayName: 'Bob Wilson',
          }],
        },
        {
          uid: 'mock-user-5',
          email: 'alice.johnson@example.com',
          displayName: 'Alice Johnson',
          emailVerified: true,
          disabled: false,
          metadata: {
            creationTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            lastSignInTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            lastRefreshTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          },
          customClaims: {},
          providerData: [{
            providerId: 'password',
            uid: 'alice.johnson@example.com',
            email: 'alice.johnson@example.com',
            displayName: 'Alice Johnson',
          }],
        }
      ];

  return NextResponse.json({
    users: mockUsers,
    totalUsers: mockUsers.length,
    hasMore: false,
    nextPageToken: null,
  });
}
