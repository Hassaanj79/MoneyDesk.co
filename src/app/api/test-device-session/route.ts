import { NextRequest, NextResponse } from 'next/server';
import { createOrUpdateDeviceSession } from '@/services/device-management';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Create a test device session
    const deviceId = `test_device_${Date.now()}`;
    const deviceName = 'Test Device - Browser';
    const userAgent = 'Mozilla/5.0 (Test Browser)';
    const ipAddress = '127.0.0.1';
    const location = {
      city: 'Test City',
      country: 'Test Country',
      region: 'Test Region'
    };

    console.log('Creating test device session for userId:', userId);

    const sessionId = await createOrUpdateDeviceSession(
      userId,
      deviceId,
      deviceName,
      userAgent,
      ipAddress,
      location,
      false
    );

    return NextResponse.json({
      success: true,
      sessionId,
      message: 'Test device session created successfully'
    });

  } catch (error: any) {
    console.error('Error creating test device session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create test device session' },
      { status: 500 }
    );
  }
}
