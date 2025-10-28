import { NextRequest, NextResponse } from 'next/server';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  console.warn('⚠️ SENDGRID_API_KEY not found in environment variables.');
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Processing password reset for:', email);

    // Generate a secure reset token
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    
    console.log('🔗 Generated reset URL:', resetUrl);

    // Store reset token in Firestore with expiration
    const resetTokenRef = doc(db, 'password_reset_tokens', email);
    await setDoc(resetTokenRef, {
      token: resetToken,
      email: email,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
      used: false
    });

    console.log('💾 Token stored in Firestore');

    // Send email via SendGrid
    const subject = 'Password Reset Request - MoneyDesk.co';
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - MoneyDesk.co</title>
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
        .cta-button {
            display: block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 8px;
            text-align: center;
            margin: 30px auto;
            font-weight: 600;
            font-size: 16px;
            width: fit-content;
        }
        .cta-button:hover {
            background: linear-gradient(135deg, #5a6fd8 0%, #6a42a2 100%);
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
            <h1>🔐 Password Reset Request</h1>
            <p>MoneyDesk.co</p>
        </div>
        <div class="content">
            <h2>Hello!</h2>
            <p>You have requested a password reset for your MoneyDesk.co account.</p>
            
            <p>To reset your password, please click the button below:</p>
            
            <div style="text-align: center;">
                <a href="${resetUrl}" class="cta-button">Reset My Password</a>
            </div>
            
            <div class="security-note">
                <strong>⚠️ Security Notice:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>This link will expire in 1 hour for security reasons</li>
                    <li>If you did not request this password reset, please ignore this email</li>
                    <li>Do not share this link with anyone</li>
                </ul>
            </div>
            
            <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px; font-family: monospace;">${resetUrl}</p>
            
            <p>If you have any questions or need assistance, please contact our support team.</p>
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
Password Reset Request - MoneyDesk.co

Hello!

You have requested a password reset for your MoneyDesk.co account.

To reset your password, please click the link below:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you did not request this password reset, please ignore this email and your password will remain unchanged.

For security reasons, please do not share this link with anyone.

If you have any questions or need assistance, please contact our support team.

Best regards,
MoneyDesk.co Team
    `;

    console.log('📧 Sending email via SendGrid...');
    
    if (!SENDGRID_API_KEY) {
      console.error('❌ SendGrid API key not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 503 }
      );
    }

    const msg = {
      to: email,
      from: process.env.FROM_EMAIL || 'support@moneydesk.co',
      subject,
      text: text,
      html: html,
    };

    await sgMail.send(msg);
    console.log('✅ Password reset email sent successfully');

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent successfully',
    });

  } catch (error) {
    console.error('❌ Error in password reset:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
