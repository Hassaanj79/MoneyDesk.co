export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  disabled: boolean;
  metadata: {
    creationTime: string;
    lastSignInTime: string | null;
    lastRefreshTime: string | null;
  };
  customClaims: Record<string, any>;
  providerData: Array<{
    providerId: string;
    uid: string;
    email: string | null;
    displayName: string | null;
  }>;
}

export interface AuthUsersResponse {
  users: AuthUser[];
  totalUsers: number;
  hasMore: boolean;
  nextPageToken: string | null;
}

export const fetchAllAuthUsers = async (timestamp?: number): Promise<AuthUsersResponse> => {
  try {
    console.log('Fetching auth users from API...');
    
    // Add timestamp to URL to prevent caching
    const url = timestamp ? `/api/admin/users?t=${timestamp}` : '/api/admin/users';
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });

    console.log('API response status:', response.status);
    
    if (!response.ok) {
      console.warn(`API request failed (${response.status}): ${response.statusText}`);
      const errorText = await response.text();
      console.warn('Error response:', errorText);
      
      // Only use fallback data if it's a server error, not auth issues
      if (response.status >= 500) {
        console.log('Server error, using fallback data');
        return getFallbackAuthUsers();
      } else {
        // For auth errors, throw to show proper error
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
    }

    const data: AuthUsersResponse = await response.json();
    console.log('Successfully fetched auth users:', data.users.length);
    return data;
  } catch (error: any) {
    console.error('Error fetching auth users:', error);
    
    // Only use fallback data for network errors, not API errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.log('Network error, using fallback data');
      return getFallbackAuthUsers();
    }
    
    // For other errors, re-throw to show proper error message
    throw error;
  }
};

function getFallbackAuthUsers(): AuthUsersResponse {
  const mockUsers = [
    {
      uid: 'fallback-user-1',
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
      uid: 'fallback-user-2',
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
      uid: 'fallback-user-3',
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
      uid: 'fallback-user-4',
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
      uid: 'fallback-user-5',
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

  return {
    users: mockUsers,
    totalUsers: mockUsers.length,
    hasMore: false,
    nextPageToken: null,
  };
}

export const getUserStatus = (user: AuthUser): 'active' | 'inactive' | 'disabled' => {
  if (user.disabled) return 'disabled';
  if (!user.emailVerified) return 'inactive';
  return 'active';
};

export const getLastSignInBadge = (lastSignInTime: string | null) => {
  if (!lastSignInTime) {
    return {
      text: 'Never',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: 'Clock'
    };
  }

  const lastSignIn = new Date(lastSignInTime);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - lastSignIn.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return {
      text: 'Today',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: 'CheckCircle'
    };
  } else if (diffInDays <= 7) {
    return {
      text: `${diffInDays}d ago`,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: 'Clock'
    };
  } else if (diffInDays <= 30) {
    return {
      text: `${diffInDays}d ago`,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: 'AlertTriangle'
    };
  } else {
    return {
      text: `${diffInDays}d ago`,
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: 'XCircle'
    };
  }
};

export const formatAuthDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
