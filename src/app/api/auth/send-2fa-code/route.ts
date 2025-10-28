import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Initialize SendGrid API key (server-side only)
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  console.warn('⚠️ SENDGRID_API_KEY not found in environment variables.');
}

interface TwoFactorAuthData {
  enabled: boolean;
  lastCodeSent?: Date;
  attempts?: number;
  updatedAt?: Date;
}

/**
 * Generate a 6-digit 2FA code
 */
const generate2FACode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();
    
    if (!userId || !email) {
      return NextResponse.json(
        { error: 'userId and email are required' },
        { status: 400 }
      );
    }

    console.log('🔐 Sending 2FA code to:', email);

    // Check if 2FA is enabled
    const user2FARef = doc(db, 'user_2fa', userId);
    const userDoc = await getDoc(user2FARef);
    
    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: '2FA is not enabled for this account' },
        { status: 400 }
      );
    }

    const userData = userDoc.data() as TwoFactorAuthData;
    
    if (!userData.enabled) {
      return NextResponse.json(
        { error: '2FA is not enabled for this account' },
        { status: 400 }
      );
    }
    
    // Check rate limiting (max 3 codes per 5 minutes)
    const now = new Date();
    if (userData.lastCodeSent) {
      const lastSent = userData.lastCodeSent.toDate();
      const timeDiff = now.getTime() - lastSent.getTime();
      if (timeDiff < 5 * 60 * 1000) { // 5 minutes
        const remainingTime = Math.ceil((5 * 60 * 1000 - timeDiff) / 1000);
        return NextResponse.json(
          { 
            error: `Please wait ${remainingTime} seconds before requesting another code`,
            success: false 
          },
          { status: 429 }
        );
      }
    }

    // Generate and store code
    const code = generate2FACode();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

    const codeRef = doc(db, 'user_2fa_codes', userId);
    await setDoc(codeRef, {
      code: code,
      expiresAt: expiresAt,
      attempts: 0,
      createdAt: now,
      email: email
    });

    // Update last code sent time
    await setDoc(user2FARef, {
      lastCodeSent: now,
      updatedAt: serverTimestamp()
    }, { merge: true });

    // Send code via SendGrid
    const subject = 'Your MoneyDesk.co 2FA Verification Code';
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>2FA Verification Code - MoneyDesk.co</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .email-container {
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 30px;
        }
        .code-container {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
            border: 2px dashed #667eea;
        }
        .code {
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 8px;
            margin: 10px 0;
        }
        .security-note {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 14px;
        }
        .security-note strong {
            color: #856404;
        }
        .footer {
            background: #f9f9f9;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🔐 Two-Factor Authentication</h1>
            <p>MoneyDesk.co</p>
        </div>
        <div class="content">
            <h2>Your Verification Code</h2>
            <p>You requested a two-factor authentication code for your MoneyDesk.co account.</p>
            
            <div class="code-container">
                <p style="margin: 0 0 10px 0; color: #666;">Your verification code is:</p>
                <div class="code">${code}</div>
                <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">This code expires in 10 minutes</p>
            </div>

            <div class="security-note">
                <strong>🔒 Security Notice:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Never share this code with anyone</li>
                    <li>MoneyDesk.co will never ask for this code via email or phone</li>
                    <li>If you didn't request this code, please secure your account immediately</li>
                </ul>
            </div>

            <p>Enter this code in the verification field to complete your login.</p>
        </div>
        
        <div class="footer">
            <p><strong>MoneyDesk.co</strong></p>
            <p>Smart Financial Management</p>
            <p style="margin-top: 10px; font-size: 12px; color: #999;">
                This is an automated message. Please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>
    `;

    const text = `
Two-Factor Authentication Code - MoneyDesk.co

Your verification code is: ${code}

This code expires in 10 minutes.

Security Notice:
- Never share this code with anyone
- MoneyDesk.co will never ask for this code via email or phone
- If you didn't request this code, please secure your account immediately

Enter this code in the verification field to complete your login.

Best regards,
MoneyDesk.co Team
    `;

    const msg = {
      to: email,
      from: process.env.FROM_EMAIL || 'noreply@moneydesk.co',
      subject,
      text: text,
      html: html,
    };

    console.log('📤 Sending 2FA code with SendGrid...');
    await sgMail.send(msg);
    console.log('✅ 2FA code sent successfully to:', email);

    return NextResponse.json({
      success: true,
      message: '2FA code sent to your email',
    });
  } catch (error: any) {
    console.error('❌ Error sending 2FA code:', error);
    return NextResponse.json(
      {
        error: 'Failed to send 2FA code',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
