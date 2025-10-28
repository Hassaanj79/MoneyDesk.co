import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import type { MoneyPool, MoneyPoolParticipant } from '@/types';
import { sendEmail } from './email';
import { createMoneyPoolInvitationEmail } from './email-templates';

export interface PoolInvitation {
  id?: string;
  poolId: string;
  poolName: string;
  invitedBy: string;
  invitedByEmail: string;
  invitedByName?: string;
  inviteeEmail: string;
  inviteeName?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  expiresAt: string;
  joinCode?: string;
}

/**
 * Send an email invitation for a pool participant
 */
export async function sendPoolInvitation(
  poolId: string,
  inviteeEmail: string,
  inviteeName: string,
  invitedBy: string,
  invitedByEmail: string,
  poolName: string
): Promise<boolean> {
  try {
    // Generate a unique join code
    const joinCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // Create invitation record
    const invitationData = {
      poolId,
      poolName,
      invitedBy,
      invitedByEmail,
      inviteeEmail,
      inviteeName,
      status: 'pending',
      joinCode,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };

    const invitationsRef = collection(db, 'pool_invitations');
    await addDoc(invitationsRef, invitationData);

    // Construct join URL
    const joinUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pools/join?code=${joinCode}`;

    // Generate email content using template
    const { subject, html, text } = createMoneyPoolInvitationEmail({
      inviteeName: inviteeName || 'there',
      inviterName: invitedByEmail.split('@')[0], // Use email username as name
      poolName,
      joinUrl,
    });

    // Send email using SendGrid
    const emailSent = await sendEmail({
      to: inviteeEmail,
      subject,
      html,
      body: text,
    });

    if (emailSent) {
      console.log(`✅ Invitation email sent to ${inviteeEmail} for pool: ${poolName}`);
      console.log(`🔗 Join code: ${joinCode}`);
    } else {
      console.error(`❌ Failed to send invitation email to ${inviteeEmail}`);
    }

    return emailSent;
  } catch (error) {
    console.error('Error sending pool invitation:', error);
    return false;
  }
}

/**
 * Generate HTML email template for pool invitation
 */
function generateInvitationEmailHTML(
  inviteeName: string,
  poolName: string,
  joinCode: string,
  inviterEmail: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Pool Invitation</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>You're Invited to Join a Money Pool</h2>
        <p>Hi ${inviteeName},</p>
        <p><strong>${inviterEmail}</strong> has invited you to join the pool: <strong>${poolName}</strong></p>
        
        <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Pool:</strong> ${poolName}</p>
          <p style="margin: 10px 0 0 0;"><strong>Your Join Code:</strong> <code style="background: white; padding: 5px 10px; border-radius: 3px;">${joinCode}</code></p>
        </div>
        
        <p>To join this pool:</p>
        <ol>
          <li>Log in to MoneyDesk</li>
          <li>Go to the Money Pools section</li>
          <li>Click "Join Pool"</li>
          <li>Enter the join code above</li>
        </ol>
        
        <p style="color: #666; font-size: 12px;">This invitation will expire in 7 days.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        
        <p style="color: #666; font-size: 12px;">
          This is an automated message from MoneyDesk.<br>
          If you didn't expect this invitation, please ignore this email.
        </p>
      </body>
    </html>
  `;
}

/**
 * Get all invitations for a pool
 */
export async function getPoolInvitations(poolId: string): Promise<PoolInvitation[]> {
  const invitationsRef = collection(db, 'pool_invitations');
  const q = query(invitationsRef, where('poolId', '==', poolId));
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as PoolInvitation[];
}

