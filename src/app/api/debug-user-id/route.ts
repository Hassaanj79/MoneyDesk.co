import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // This is just for testing - in a real scenario, you'd get this from the client
    return NextResponse.json({
      message: 'This endpoint is for testing. Please check the browser console for user ID when you log in.',
      instructions: [
        '1. Open browser console',
        '2. Log in to your account',
        '3. Look for console logs showing user.uid',
        '4. Use that UID to test 2FA status'
      ]
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to get instructions',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
