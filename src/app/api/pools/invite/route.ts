import { NextRequest, NextResponse } from 'next/server';
import { sendPoolInvitation } from '@/services/pool-invitations';

/**
 * POST /api/pools/invite
 * Send a pool invitation email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { poolId, inviteeEmail, inviteeName, invitedBy, invitedByEmail, poolName } = body;

    if (!poolId || !inviteeEmail || !invitedBy || !invitedByEmail || !poolName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const success = await sendPoolInvitation(
      poolId,
      inviteeEmail,
      inviteeName || '',
      invitedBy,
      invitedByEmail,
      poolName
    );

    if (success) {
      return NextResponse.json({ 
        success: true,
        message: 'Invitation sent successfully' 
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send invitation' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending pool invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

