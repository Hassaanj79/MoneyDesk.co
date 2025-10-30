import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { adminDb } from '@/lib/firebase-admin';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Generate a verification token on the server
    const verificationToken = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

    // Store token in Firestore (server-side)
    await adminDb.collection('email_verifications').doc(verificationToken).set({
      email,
      createdAt: new Date(),
      used: false,
    });

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

    const msg = {
      to: email,
      from: process.env.FROM_EMAIL || 'support@moneydesk.co',
      subject: 'Verify Your MoneyDesk Account',
      text: `Welcome to MoneyDesk! Please verify your email by clicking this link: ${verificationUrl}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Account</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              width: 48px;
              height: 48px;
              background: linear-gradient(135deg, #8b5cf6, #a855f7);
              border-radius: 12px;
              margin: 0 auto 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 24px;
              font-weight: bold;
            }
            h1 {
              color: #1f2937;
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .subtitle {
              color: #6b7280;
              margin: 8px 0 0;
              font-size: 16px;
            }
            .content {
              margin: 30px 0;
            }
            .verification-box {
              background: #f8fafc;
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .verify-button {
              display: inline-block;
              background: linear-gradient(135deg, #8b5cf6, #a855f7);
              color: white;
              text-decoration: none;
              padding: 16px 32px;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              margin: 20px 0;
              transition: all 0.2s;
            }
            .verify-button:hover {
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
            }
            .backup-link {
              background: #f3f4f6;
              border-radius: 6px;
              padding: 12px;
              margin: 20px 0;
              word-break: break-all;
              font-family: monospace;
              font-size: 12px;
              color: #6b7280;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
            }
            .security-note {
              background: #fef3c7;
              border: 1px solid #f59e0b;
              border-radius: 6px;
              padding: 12px;
              margin: 20px 0;
              color: #92400e;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">MD</div>
              <h1>Welcome to MoneyDesk!</h1>
              <p class="subtitle">Please verify your email address to get started</p>
            </div>

            <div class="content">
              <p>Thank you for signing up for MoneyDesk! To complete your registration and start managing your finances, please verify your email address.</p>

              <div class="verification-box">
                <p><strong>Click the button below to verify your account:</strong></p>
                <a href="${verificationUrl}" class="verify-button">Verify My Account</a>
              </div>

              <div class="security-note">
                <strong>Security Note:</strong> This verification link will expire in 24 hours for your security. If you didn't create an account with MoneyDesk, please ignore this email.
              </div>

              <p>If the button doesn't work, use this link:</p>
              <div class="backup-link">
                <a href="${verificationUrl}" style="color:#4f46e5; text-decoration:underline;" target="_blank" rel="noopener noreferrer">${verificationUrl}</a>
              </div>

              <p>Once verified, you'll be able to:</p>
              <ul>
                <li>Track your income and expenses</li>
                <li>Manage your budgets and financial goals</li>
                <li>Access AI-powered financial insights</li>
                <li>Sync across all your devices</li>
              </ul>
            </div>

            <div class="footer">
              <p>This email was sent by MoneyDesk. If you have any questions, please contact our support team.</p>
              <p>&copy; 2024 MoneyDesk. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await sgMail.send(msg);

    console.log(`✅ Verification email sent to: ${email}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Verification email sent successfully' 
    });

  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    );
  }
}
